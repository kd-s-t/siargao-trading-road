#!/bin/bash

API_URL="https://siargaotradingroad.com/api"

echo "Testing Registration on Production API"
echo "========================================"
echo "API URL: $API_URL"
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_NAME="Test User ${TIMESTAMP}"
TEST_PHONE="9606075119"
TEST_PASSWORD="testpass123"
TEST_ROLE="supplier"

echo "Test Data:"
echo "  Email: $TEST_EMAIL"
echo "  Name: $TEST_NAME"
echo "  Phone: $TEST_PHONE"
echo "  Role: $TEST_ROLE"
echo ""

echo "Sending registration request..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"$TEST_NAME\",
    \"phone\": \"$TEST_PHONE\",
    \"role\": \"$TEST_ROLE\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo ""
echo "Response HTTP Code: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" == "201" ]; then
  echo ""
  echo "✅ Registration successful!"
  TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null)
  if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "Token received: ${TOKEN:0:20}..."
  fi
elif [ "$HTTP_CODE" == "409" ]; then
  echo ""
  echo "⚠️  User already exists (expected if email/phone is taken)"
elif [ "$HTTP_CODE" == "400" ]; then
  echo ""
  echo "❌ Bad request - validation error"
else
  echo ""
  echo "❌ Registration failed"
fi
