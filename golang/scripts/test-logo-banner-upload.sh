#!/bin/bash

API_URL="${API_URL:-http://ec2-44-192-83-29.compute-1.amazonaws.com/api}"

echo "Testing Logo and Banner Upload on API: $API_URL"
echo "================================================="
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PHONE="9$(printf "%09d" $TIMESTAMP)"
TEST_PASSWORD="testpass123"

echo "Step 1: Register a test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User ${TIMESTAMP}\",
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

echo "Step 2: Create test image files..."
# Create a simple 1x1 PNG image (base64 encoded minimal PNG)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-logo.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-banner.png

echo "✅ Test images created"
echo ""

echo "Step 3: Upload logo image..."
LOGO_UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-logo.png")

LOGO_HTTP_CODE=$(echo "$LOGO_UPLOAD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
LOGO_BODY=$(echo "$LOGO_UPLOAD_RESPONSE" | sed '/HTTP_CODE/d')

echo "Logo Upload Response HTTP Code: $LOGO_HTTP_CODE"
echo "Logo Upload Response Body:"
echo "$LOGO_BODY" | jq '.' 2>/dev/null || echo "$LOGO_BODY"
echo ""

if [ "$LOGO_HTTP_CODE" != "200" ]; then
  echo "❌ Logo upload failed!"
  rm -f /tmp/test-logo.png /tmp/test-banner.png
  exit 1
fi

LOGO_URL=$(echo "$LOGO_BODY" | jq -r '.url' 2>/dev/null)

if [ -z "$LOGO_URL" ] || [ "$LOGO_URL" == "null" ]; then
  echo "❌ Failed to get logo URL from upload response"
  rm -f /tmp/test-logo.png /tmp/test-banner.png
  exit 1
fi

echo "✅ Logo uploaded successfully"
echo "Logo URL: $LOGO_URL"
echo ""

echo "Step 4: Upload banner image..."
BANNER_UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-banner.png")

BANNER_HTTP_CODE=$(echo "$BANNER_UPLOAD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BANNER_BODY=$(echo "$BANNER_UPLOAD_RESPONSE" | sed '/HTTP_CODE/d')

echo "Banner Upload Response HTTP Code: $BANNER_HTTP_CODE"
echo "Banner Upload Response Body:"
echo "$BANNER_BODY" | jq '.' 2>/dev/null || echo "$BANNER_BODY"
echo ""

if [ "$BANNER_HTTP_CODE" != "200" ]; then
  echo "❌ Banner upload failed!"
  rm -f /tmp/test-logo.png /tmp/test-banner.png
  exit 1
fi

BANNER_URL=$(echo "$BANNER_BODY" | jq -r '.url' 2>/dev/null)

if [ -z "$BANNER_URL" ] || [ "$BANNER_URL" == "null" ]; then
  echo "❌ Failed to get banner URL from upload response"
  rm -f /tmp/test-logo.png /tmp/test-banner.png
  exit 1
fi

echo "✅ Banner uploaded successfully"
echo "Banner URL: $BANNER_URL"
echo ""

echo "Step 5: Update user profile with logo and banner..."
UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$API_URL/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"logo_url\": \"$LOGO_URL\",
    \"banner_url\": \"$BANNER_URL\"
  }")

UPDATE_HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE/d')

echo "Update Profile Response HTTP Code: $UPDATE_HTTP_CODE"
echo "Update Profile Response Body:"
echo "$UPDATE_BODY" | jq '.' 2>/dev/null || echo "$UPDATE_BODY"
echo ""

if [ "$UPDATE_HTTP_CODE" == "200" ]; then
  UPDATED_LOGO=$(echo "$UPDATE_BODY" | jq -r '.logo_url' 2>/dev/null)
  UPDATED_BANNER=$(echo "$UPDATE_BODY" | jq -r '.banner_url' 2>/dev/null)
  
  echo "✅ Profile updated successfully!"
  echo "Updated Logo URL: $UPDATED_LOGO"
  echo "Updated Banner URL: $UPDATED_BANNER"
  
  if [ "$UPDATED_LOGO" == "$LOGO_URL" ] && [ "$UPDATED_BANNER" == "$BANNER_URL" ]; then
    echo "✅ Logo and banner URLs match uploaded images"
  else
    echo "⚠️  URL mismatch detected"
  fi
else
  echo "❌ Profile update failed"
fi

echo ""
echo "Step 6: Verify profile data..."
GET_ME_RESPONSE=$(curl -s -X GET "$API_URL/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Current Profile:"
echo "$GET_ME_RESPONSE" | jq '{name, email, logo_url, banner_url}' 2>/dev/null || echo "$GET_ME_RESPONSE"

echo ""
echo "Cleaning up test image files..."
rm -f /tmp/test-logo.png /tmp/test-banner.png
echo "✅ Test completed"
