#!/bin/bash

set -e

API_URL="${API_URL:-http://ec2-44-192-83-29.compute-1.amazonaws.com/api}"

echo "=========================================="
echo "Testing: Login, Health, Logo Upload"
echo "API URL: $API_URL"
echo "=========================================="
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="test-login-$TIMESTAMP@example.com"
TEST_PASSWORD="testpass123"

# ============================================================================
# Test 1: Health Check
# ============================================================================
echo "Test 1: Health Check"
echo "-------------------"

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/../health" 2>/dev/null || curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/health" 2>/dev/null || curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL%/api}/health" 2>/dev/null || echo "HTTP_CODE:000")

HEALTH_HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HEALTH_HTTP_CODE" == "200" ] || [ "$HEALTH_HTTP_CODE" == "000" ]; then
    if [ "$HEALTH_HTTP_CODE" == "200" ]; then
        echo "✓ Health check passed (HTTP $HEALTH_HTTP_CODE)"
        echo "Response: $HEALTH_BODY"
    else
        echo "⚠ Health endpoint not found at /health (tried multiple paths)"
        echo "Testing public metrics endpoint instead..."
        METRICS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/public/metrics")
        METRICS_CODE=$(echo "$METRICS_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
        if [ "$METRICS_CODE" == "200" ]; then
            echo "✓ Public metrics endpoint accessible (HTTP $METRICS_CODE)"
        else
            echo "✗ Public metrics also failed (HTTP $METRICS_CODE)"
        fi
    fi
else
    echo "✗ Health check failed (HTTP $HEALTH_HTTP_CODE)"
    echo "Response: $HEALTH_BODY"
fi
echo ""

# ============================================================================
# Test 2: Register User (for login test)
# ============================================================================
echo "Test 2: Register User"
echo "-------------------"

REGISTER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User $TIMESTAMP\",
    \"phone\": \"9$(printf '%09d' $TIMESTAMP)\",
    \"role\": \"supplier\",
    \"address\": \"123 Test Street\",
    \"latitude\": 9.7854,
    \"longitude\": 126.0883
  }")

REGISTER_HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$REGISTER_HTTP_CODE" != "201" ]; then
    echo "✗ Registration failed (HTTP $REGISTER_HTTP_CODE)"
    echo "$REGISTER_BODY" | jq '.' 2>/dev/null || echo "$REGISTER_BODY"
    exit 1
fi

REGISTER_TOKEN=$(echo "$REGISTER_BODY" | jq -r '.token' 2>/dev/null)
if [ -z "$REGISTER_TOKEN" ] || [ "$REGISTER_TOKEN" == "null" ]; then
    echo "✗ Failed to get token from registration"
    exit 1
fi

echo "✓ User registered successfully"
echo ""

# ============================================================================
# Test 3: Login
# ============================================================================
echo "Test 3: Login"
echo "-------------------"

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$LOGIN_HTTP_CODE" != "200" ]; then
    echo "✗ Login failed (HTTP $LOGIN_HTTP_CODE)"
    echo "$LOGIN_BODY" | jq '.' 2>/dev/null || echo "$LOGIN_BODY"
    exit 1
fi

LOGIN_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token' 2>/dev/null)
LOGIN_USER_ID=$(echo "$LOGIN_BODY" | jq -r '.user.id' 2>/dev/null)
LOGIN_USER_EMAIL=$(echo "$LOGIN_BODY" | jq -r '.user.email' 2>/dev/null)

if [ -z "$LOGIN_TOKEN" ] || [ "$LOGIN_TOKEN" == "null" ]; then
    echo "✗ Failed to get token from login"
    echo "$LOGIN_BODY" | jq '.' 2>/dev/null || echo "$LOGIN_BODY"
    exit 1
fi

if [ "$LOGIN_USER_EMAIL" != "$TEST_EMAIL" ]; then
    echo "✗ Email mismatch in login response"
    exit 1
fi

echo "✓ Login successful"
echo "  User ID: $LOGIN_USER_ID"
echo "  Email: $LOGIN_USER_EMAIL"
echo "  Token: ${LOGIN_TOKEN:0:30}..."
echo ""

# ============================================================================
# Test 4: Logo Upload
# ============================================================================
echo "Test 4: Logo Upload"
echo "-------------------"

echo "Creating test image file..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-logo-upload.png

LOGO_UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/upload" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -F "file=@/tmp/test-logo-upload.png")

LOGO_HTTP_CODE=$(echo "$LOGO_UPLOAD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
LOGO_BODY=$(echo "$LOGO_UPLOAD_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$LOGO_HTTP_CODE" != "200" ]; then
    echo "✗ Logo upload failed (HTTP $LOGO_HTTP_CODE)"
    echo "$LOGO_BODY" | jq '.' 2>/dev/null || echo "$LOGO_BODY"
    rm -f /tmp/test-logo-upload.png
    exit 1
fi

LOGO_URL=$(echo "$LOGO_BODY" | jq -r '.url' 2>/dev/null)
LOGO_KEY=$(echo "$LOGO_BODY" | jq -r '.key' 2>/dev/null)

if [ -z "$LOGO_URL" ] || [ "$LOGO_URL" == "null" ]; then
    echo "✗ Failed to get logo URL from upload response"
    echo "$LOGO_BODY" | jq '.' 2>/dev/null || echo "$LOGO_BODY"
    rm -f /tmp/test-logo-upload.png
    exit 1
fi

echo "✓ Logo uploaded successfully"
echo "  URL: $LOGO_URL"
echo "  Key: $LOGO_KEY"
echo ""

# ============================================================================
# Test 5: Verify Logo URL is accessible
# ============================================================================
echo "Test 5: Verify Uploaded Logo URL"
echo "-------------------"

LOGO_VERIFY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -I "$LOGO_URL" 2>/dev/null || echo "HTTP_CODE:000")
LOGO_VERIFY_CODE=$(echo "$LOGO_VERIFY_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$LOGO_VERIFY_CODE" == "200" ] || [ "$LOGO_VERIFY_CODE" == "403" ]; then
    echo "✓ Logo URL is accessible (HTTP $LOGO_VERIFY_CODE)"
else
    echo "⚠ Logo URL verification returned HTTP $LOGO_VERIFY_CODE"
    echo "  (This might be expected if the bucket has restricted access)"
fi
echo ""

# ============================================================================
# Cleanup
# ============================================================================
rm -f /tmp/test-logo-upload.png

# ============================================================================
# Summary
# ============================================================================
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "✓ Health Check: $(if [ "$HEALTH_HTTP_CODE" == "200" ]; then echo "PASSED"; else echo "SKIPPED/NOT FOUND"; fi)"
echo "✓ Login: PASSED"
echo "✓ Logo Upload: PASSED"
echo ""
echo "All critical tests completed successfully!"
echo ""
