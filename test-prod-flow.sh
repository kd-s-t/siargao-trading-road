#!/bin/bash

set -e

API_URL="${API_URL:-http://localhost:3020/api}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "Production E2E Test Flow"
echo "=========================================="
echo "API URL: $API_URL"
echo "Timestamp: $TIMESTAMP"
echo ""

SUPPLIER_EMAIL="supplier-test-$TIMESTAMP@example.com"
STORE_EMAIL="store-test-$TIMESTAMP@example.com"
PASSWORD="test123456"

SUPPLIER_TOKEN=""
STORE_TOKEN=""
SUPPLIER_ID=""
STORE_ID=""
PRODUCT_ID=""
ORDER_ID=""

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
        echo "ERROR: $response"
        return 1
    fi
    
    if [ -n "$expected_field" ]; then
        if ! echo "$response" | grep -q "$expected_field"; then
            echo "ERROR: Expected field '$expected_field' not found in response"
            echo "Response: $response"
            return 1
        fi
    fi
    
    return 0
}

echo "Step 1: Register Supplier"
echo "------------------------"
SUPPLIER_DATA=$(cat <<EOF
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

RESPONSE=$(make_request "POST" "/register" "$SUPPLIER_DATA")
if ! check_response "$RESPONSE" "token"; then
    echo "Failed to register supplier"
    exit 1
fi

SUPPLIER_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
SUPPLIER_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✓ Supplier registered: ID=$SUPPLIER_ID"
echo ""

echo "Step 2: Supplier Adds Products"
echo "------------------------------"
PRODUCT1_DATA=$(cat <<EOF
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

RESPONSE=$(make_request "POST" "/products" "$PRODUCT1_DATA" "$SUPPLIER_TOKEN")
if ! check_response "$RESPONSE" "id"; then
    echo "Failed to create product 1"
    exit 1
fi

PRODUCT_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✓ Product 1 created: ID=$PRODUCT_ID"

PRODUCT2_DATA=$(cat <<EOF
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

RESPONSE=$(make_request "POST" "/products" "$PRODUCT2_DATA" "$SUPPLIER_TOKEN")
if ! check_response "$RESPONSE" "id"; then
    echo "Failed to create product 2"
    exit 1
fi

PRODUCT2_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✓ Product 2 created: ID=$PRODUCT2_ID"
echo ""

echo "Step 3: Register Store"
echo "---------------------"
STORE_DATA=$(cat <<EOF
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

RESPONSE=$(make_request "POST" "/register" "$STORE_DATA")
if ! check_response "$RESPONSE" "token"; then
    echo "Failed to register store"
    exit 1
fi

STORE_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
STORE_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✓ Store registered: ID=$STORE_ID"
echo ""

echo "Step 4: Store Creates Draft Order"
echo "--------------------------------"
DRAFT_DATA=$(cat <<EOF
{
    "supplier_id": $SUPPLIER_ID
}
EOF
)

RESPONSE=$(make_request "POST" "/orders/draft" "$DRAFT_DATA" "$STORE_TOKEN")
if ! check_response "$RESPONSE" "id"; then
    echo "Failed to create draft order"
    exit 1
fi

ORDER_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✓ Draft order created: ID=$ORDER_ID"
echo ""

echo "Step 5: Store Adds Products to Order"
echo "------------------------------------"
ITEM1_DATA=$(cat <<EOF
{
    "product_id": $PRODUCT_ID,
    "quantity": 2
}
EOF
)

RESPONSE=$(make_request "POST" "/orders/$ORDER_ID/items" "$ITEM1_DATA" "$STORE_TOKEN")
if ! check_response "$RESPONSE" "id"; then
    echo "Failed to add item 1 to order"
    exit 1
fi
echo "✓ Added Product 1 (quantity: 2) to order"

ITEM2_DATA=$(cat <<EOF
{
    "product_id": $PRODUCT2_ID,
    "quantity": 1
}
EOF
)

RESPONSE=$(make_request "POST" "/orders/$ORDER_ID/items" "$ITEM2_DATA" "$STORE_TOKEN")
if ! check_response "$RESPONSE" "id"; then
    echo "Failed to add item 2 to order"
    exit 1
fi
echo "✓ Added Product 2 (quantity: 1) to order"
echo ""

echo "Step 6: Store Submits Order"
echo "---------------------------"
SUBMIT_DATA=$(cat <<EOF
{
    "payment_method": "gcash",
    "delivery_option": "deliver",
    "shipping_address": "456 Store Avenue, Siargao, Surigao del Norte",
    "notes": "Please deliver before 5 PM"
}
EOF
)

RESPONSE=$(make_request "POST" "/orders/$ORDER_ID/submit" "$SUBMIT_DATA" "$STORE_TOKEN")
if ! check_response "$RESPONSE" "preparing"; then
    echo "Failed to submit order"
    echo "Response: $RESPONSE"
    exit 1
fi
echo "✓ Order submitted - Status: preparing"
echo ""

echo "Step 7: Supplier Updates Order Status - Preparing → In Transit"
echo "--------------------------------------------------------------"
STATUS_DATA=$(cat <<EOF
{
    "status": "in_transit"
}
EOF
)

RESPONSE=$(make_request "PUT" "/orders/$ORDER_ID/status" "$STATUS_DATA" "$SUPPLIER_TOKEN")
if ! check_response "$RESPONSE" "in_transit"; then
    echo "Failed to update order status to in_transit"
    exit 1
fi
echo "✓ Order status updated: in_transit"
echo ""

echo "Step 8: Supplier Updates Order Status - In Transit → Delivered"
echo "---------------------------------------------------------------"
STATUS_DATA=$(cat <<EOF
{
    "status": "delivered"
}
EOF
)

RESPONSE=$(make_request "PUT" "/orders/$ORDER_ID/status" "$STATUS_DATA" "$SUPPLIER_TOKEN")
if ! check_response "$RESPONSE" "delivered"; then
    echo "Failed to update order status to delivered"
    exit 1
fi
echo "✓ Order status updated: delivered"
echo ""

echo "Step 9: Supplier Marks Payment as Paid"
echo "---------------------------------------"
RESPONSE=$(make_request "POST" "/orders/$ORDER_ID/payment/paid" "{}" "$SUPPLIER_TOKEN")
if ! check_response "$RESPONSE" "paid"; then
    echo "Failed to mark payment as paid"
    exit 1
fi
echo "✓ Payment marked as paid"
echo ""

echo "=========================================="
echo "✓ All tests passed!"
echo "=========================================="
echo "Summary:"
echo "  Supplier ID: $SUPPLIER_ID"
echo "  Store ID: $STORE_ID"
echo "  Product IDs: $PRODUCT_ID, $PRODUCT2_ID"
echo "  Order ID: $ORDER_ID"
echo ""
echo "Test completed successfully!"
