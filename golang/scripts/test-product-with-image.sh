#!/bin/bash

API_URL="https://siargaotradingroad.com/api"

echo "Testing Product Creation with Image on Production API"
echo "======================================================"
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PHONE="9$(printf "%09d" $TIMESTAMP)"
TEST_PASSWORD="testpass123"

echo "Step 1: Register a test user (supplier)..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test Supplier ${TIMESTAMP}\",
    \"phone\": \"$TEST_PHONE\",
    \"role\": \"supplier\"
  }")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to register user"
  echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
  exit 1
fi

echo "✅ User registered successfully"
echo "Token: ${TOKEN:0:30}..."
echo ""

echo "Step 2: Create a test image file..."
cat > /tmp/test-image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
EOF

echo "✅ Test image file created"
echo ""

echo "Step 3: Upload image to S3..."
UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/upload?type=product" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-image.txt")

UPLOAD_HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | sed '/HTTP_CODE/d')

echo "Upload Response HTTP Code: $UPLOAD_HTTP_CODE"
echo "Upload Response Body:"
echo "$UPLOAD_BODY" | jq '.' 2>/dev/null || echo "$UPLOAD_BODY"
echo ""

if [ "$UPLOAD_HTTP_CODE" != "200" ]; then
  echo "❌ Image upload failed!"
  echo "This might indicate S3 is not configured properly."
  exit 1
fi

IMAGE_URL=$(echo "$UPLOAD_BODY" | jq -r '.url' 2>/dev/null)

if [ -z "$IMAGE_URL" ] || [ "$IMAGE_URL" == "null" ]; then
  echo "❌ Failed to get image URL from upload response"
  exit 1
fi

echo "✅ Image uploaded successfully"
echo "Image URL: $IMAGE_URL"
echo ""

echo "Step 4: Create product with image..."
PRODUCT_SKU="TEST-SKU-${TIMESTAMP}"
PRODUCT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product ${TIMESTAMP}\",
    \"description\": \"Test product created via API with image\",
    \"sku\": \"$PRODUCT_SKU\",
    \"price\": 99.99,
    \"stock_quantity\": 100,
    \"unit\": \"piece\",
    \"category\": \"Test\",
    \"image_url\": \"$IMAGE_URL\"
  }")

PRODUCT_HTTP_CODE=$(echo "$PRODUCT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
PRODUCT_BODY=$(echo "$PRODUCT_RESPONSE" | sed '/HTTP_CODE/d')

echo "Product Response HTTP Code: $PRODUCT_HTTP_CODE"
echo "Product Response Body:"
echo "$PRODUCT_BODY" | jq '.' 2>/dev/null || echo "$PRODUCT_BODY"
echo ""

if [ "$PRODUCT_HTTP_CODE" == "201" ]; then
  PRODUCT_ID=$(echo "$PRODUCT_BODY" | jq -r '.id' 2>/dev/null)
  PRODUCT_IMAGE=$(echo "$PRODUCT_BODY" | jq -r '.image_url' 2>/dev/null)
  echo "✅ Product created successfully!"
  echo "Product ID: $PRODUCT_ID"
  echo "Product Image URL: $PRODUCT_IMAGE"
  
  if [ "$PRODUCT_IMAGE" == "$IMAGE_URL" ]; then
    echo "✅ Image URL matches uploaded image"
  else
    echo "⚠️  Image URL mismatch"
  fi
else
  echo "❌ Product creation failed"
fi

echo ""
echo "Cleaning up test image file..."
rm -f /tmp/test-image.txt
