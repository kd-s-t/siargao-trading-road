#!/bin/bash

set -e

# ============================================================================
# Usage
# ============================================================================

function show_usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Environment to test (local|prod) [default: local]
    -u, --url URL            Override API URL
    -h, --help              Show this help message

Examples:
    # Test local environment (default)
    $0
    ENVIRONMENT=local $0

    # Test production environment
    ENVIRONMENT=prod $0
    $0 --environment prod

    # Test with custom API URL
    API_URL=http://localhost:8080/api $0
    $0 --url http://localhost:8080/api
EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# ============================================================================
# Configuration
# ============================================================================

ENVIRONMENT="${ENVIRONMENT:-local}"

case "$ENVIRONMENT" in
    local)
        API_URL="${API_URL:-http://localhost:3020/api}"
        ;;
    prod)
        API_URL="${API_URL:-https://siargaotradingroad.com/api}"
        ;;
    *)
        echo "Error: Invalid environment. Use 'local' or 'prod'"
        exit 1
        ;;
esac

TIMESTAMP=$(date +%s)
PASSWORD="test123456"

# Test user credentials
SUPPLIER_EMAIL="supplier-test-$TIMESTAMP@example.com"
STORE_EMAIL="store-test-$TIMESTAMP@example.com"

# State variables
SUPPLIER_TOKEN=""
STORE_TOKEN=""
SUPPLIER_ID=""
STORE_ID=""
PRODUCT_ID=""
PRODUCT2_ID=""
ORDER_ID=""

# ============================================================================
# Helper Functions
# ============================================================================

function print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

function print_step() {
    echo ""
    echo "Step $1: $2"
    echo "$(printf '=%.0s' {1..50})"
}

function print_success() {
    echo "✓ $1"
}

function print_error() {
    echo "✗ ERROR: $1" >&2
}

function make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers=()
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    headers+=(-H "Content-Type: application/json")
    
    if [ "$method" = "GET" ]; then
        curl -s "${headers[@]}" "$API_URL$endpoint"
    elif [ "$method" = "POST" ]; then
        curl -s "${headers[@]}" -X POST -d "$data" "$API_URL$endpoint"
    elif [ "$method" = "PUT" ]; then
        curl -s "${headers[@]}" -X PUT -d "$data" "$API_URL$endpoint"
    fi
}

function check_response() {
    local response=$1
    local expected_field=$2
    
    if echo "$response" | grep -q "\"error\""; then
        print_error "$response"
        return 1
    fi
    
    if [ -n "$expected_field" ]; then
        if ! echo "$response" | grep -q "$expected_field"; then
            print_error "Expected field '$expected_field' not found in response"
            echo "Response: $response"
            return 1
        fi
    fi
    
    return 0
}

function extract_json_value() {
    local json=$1
    local field=$2
    echo "$json" | grep -o "\"$field\":\"[^\"]*" | cut -d'"' -f4
}

function extract_json_number() {
    local json=$1
    local field=$2
    echo "$json" | grep -o "\"$field\":[0-9]*" | head -1 | cut -d':' -f2
}

# ============================================================================
# Test Steps
# ============================================================================

function register_supplier() {
    print_step "1" "Register Supplier"
    
    local supplier_data=$(cat <<EOF
{
    "email": "$SUPPLIER_EMAIL",
    "password": "$PASSWORD",
    "name": "Test Supplier $TIMESTAMP",
    "phone": "09123456789",
    "role": "supplier",
    "address": "123 Supplier Street, Siargao",
    "latitude": 9.7854,
    "longitude": 126.0883
}
EOF
)
    
    local response=$(make_request "POST" "/register" "$supplier_data")
    if ! check_response "$response" "token"; then
        print_error "Failed to register supplier"
        exit 1
    fi
    
    SUPPLIER_TOKEN=$(extract_json_value "$response" "token")
    SUPPLIER_ID=$(extract_json_number "$response" "id")
    print_success "Supplier registered: ID=$SUPPLIER_ID"
}

function supplier_adds_products() {
    print_step "2" "Supplier Adds Products"
    
    local product1_data=$(cat <<EOF
{
    "name": "Test Product 1 - Rice",
    "description": "Premium quality rice",
    "sku": "SKU-RICE-$TIMESTAMP",
    "price": 2500.00,
    "stock_quantity": 100,
    "unit": "sack",
    "category": "Grains"
}
EOF
)
    
    local response=$(make_request "POST" "/products" "$product1_data" "$SUPPLIER_TOKEN")
    if ! check_response "$response" "id"; then
        print_error "Failed to create product 1"
        exit 1
    fi
    
    PRODUCT_ID=$(extract_json_number "$response" "id")
    print_success "Product 1 created: ID=$PRODUCT_ID"
    
    local product2_data=$(cat <<EOF
{
    "name": "Test Product 2 - Sugar",
    "description": "White refined sugar",
    "sku": "SKU-SUGAR-$TIMESTAMP",
    "price": 1800.00,
    "stock_quantity": 50,
    "unit": "sack",
    "category": "Beverages"
}
EOF
)
    
    response=$(make_request "POST" "/products" "$product2_data" "$SUPPLIER_TOKEN")
    if ! check_response "$response" "id"; then
        print_error "Failed to create product 2"
        exit 1
    fi
    
    PRODUCT2_ID=$(extract_json_number "$response" "id")
    print_success "Product 2 created: ID=$PRODUCT2_ID"
}

function register_store() {
    print_step "3" "Register Store"
    
    local store_data=$(cat <<EOF
{
    "email": "$STORE_EMAIL",
    "password": "$PASSWORD",
    "name": "Test Store $TIMESTAMP",
    "phone": "09987654321",
    "role": "store",
    "address": "456 Store Avenue, Siargao",
    "latitude": 9.7900,
    "longitude": 126.0900
}
EOF
)
    
    local response=$(make_request "POST" "/register" "$store_data")
    if ! check_response "$response" "token"; then
        print_error "Failed to register store"
        exit 1
    fi
    
    STORE_TOKEN=$(extract_json_value "$response" "token")
    STORE_ID=$(extract_json_number "$response" "id")
    print_success "Store registered: ID=$STORE_ID"
}

function store_creates_draft_order() {
    print_step "4" "Store Creates Draft Order"
    
    local draft_data=$(cat <<EOF
{
    "supplier_id": $SUPPLIER_ID
}
EOF
)
    
    local response=$(make_request "POST" "/orders/draft" "$draft_data" "$STORE_TOKEN")
    if ! check_response "$response" "id"; then
        print_error "Failed to create draft order"
        exit 1
    fi
    
    ORDER_ID=$(extract_json_number "$response" "id")
    print_success "Draft order created: ID=$ORDER_ID"
}

function store_adds_products_to_order() {
    print_step "5" "Store Adds Products to Order"
    
    local item1_data=$(cat <<EOF
{
    "product_id": $PRODUCT_ID,
    "quantity": 2
}
EOF
)
    
    local response=$(make_request "POST" "/orders/$ORDER_ID/items" "$item1_data" "$STORE_TOKEN")
    if ! check_response "$response" "id"; then
        print_error "Failed to add item 1 to order"
        exit 1
    fi
    print_success "Added Product 1 (quantity: 2) to order"
    
    local item2_data=$(cat <<EOF
{
    "product_id": $PRODUCT2_ID,
    "quantity": 1
}
EOF
)
    
    response=$(make_request "POST" "/orders/$ORDER_ID/items" "$item2_data" "$STORE_TOKEN")
    if ! check_response "$response" "id"; then
        print_error "Failed to add item 2 to order"
        exit 1
    fi
    print_success "Added Product 2 (quantity: 1) to order"
}

function store_submits_order() {
    print_step "6" "Store Submits Order"
    
    local submit_data=$(cat <<EOF
{
    "payment_method": "gcash",
    "delivery_option": "deliver",
    "shipping_address": "456 Store Avenue, Siargao, Surigao del Norte",
    "notes": "Please deliver before 5 PM"
}
EOF
)
    
    local response=$(make_request "POST" "/orders/$ORDER_ID/submit" "$submit_data" "$STORE_TOKEN")
    if ! check_response "$response" "preparing"; then
        print_error "Failed to submit order"
        echo "Response: $response"
        exit 1
    fi
    print_success "Order submitted - Status: preparing"
}

function supplier_updates_status_to_in_transit() {
    print_step "7" "Supplier Updates Order Status - Preparing → In Transit"
    
    local status_data=$(cat <<EOF
{
    "status": "in_transit"
}
EOF
)
    
    local response=$(make_request "PUT" "/orders/$ORDER_ID/status" "$status_data" "$SUPPLIER_TOKEN")
    if ! check_response "$response" "in_transit"; then
        print_error "Failed to update order status to in_transit"
        exit 1
    fi
    print_success "Order status updated: in_transit"
}

function supplier_updates_status_to_delivered() {
    print_step "8" "Supplier Updates Order Status - In Transit → Delivered"
    
    local status_data=$(cat <<EOF
{
    "status": "delivered"
}
EOF
)
    
    local response=$(make_request "PUT" "/orders/$ORDER_ID/status" "$status_data" "$SUPPLIER_TOKEN")
    if ! check_response "$response" "delivered"; then
        print_error "Failed to update order status to delivered"
        exit 1
    fi
    print_success "Order status updated: delivered"
}

function supplier_marks_payment_paid() {
    print_step "9" "Supplier Marks Payment as Paid"
    
    local response=$(make_request "POST" "/orders/$ORDER_ID/payment/paid" "{}" "$SUPPLIER_TOKEN")
    if ! check_response "$response" "paid"; then
        print_error "Failed to mark payment as paid"
        exit 1
    fi
    print_success "Payment marked as paid"
}

function print_summary() {
    print_header "All Tests Passed!"
    echo "Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  API URL: $API_URL"
    echo "  Supplier ID: $SUPPLIER_ID"
    echo "  Store ID: $STORE_ID"
    echo "  Product IDs: $PRODUCT_ID, $PRODUCT2_ID"
    echo "  Order ID: $ORDER_ID"
    echo ""
    echo "Test completed successfully!"
}

# ============================================================================
# Main Execution
# ============================================================================

function main() {
    print_header "E2E Test Flow - $ENVIRONMENT Environment"
    echo "API URL: $API_URL"
    echo "Timestamp: $TIMESTAMP"
    
    register_supplier
    supplier_adds_products
    register_store
    store_creates_draft_order
    store_adds_products_to_order
    store_submits_order
    supplier_updates_status_to_in_transit
    supplier_updates_status_to_delivered
    supplier_marks_payment_paid
    print_summary
}

main
