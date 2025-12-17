#!/bin/bash

set -e

API_URL="${API_URL:-http://ec2-44-192-83-29.compute-1.amazonaws.com/api}"

echo "=========================================="
echo "List and Delete Test Users"
echo "API URL: $API_URL"
echo "=========================================="
echo ""

# Test email patterns
TEST_PATTERNS=(
  "supplier-test-"
  "store-test-"
  "test-login-"
  "test@example.com"
)

echo "Step 1: Finding test users..."
echo "-------------------"

# We need admin access to list users, so we'll create a SQL script instead
# that can be run directly on the database

SQL_FILE="/tmp/delete_test_users.sql"

cat > "$SQL_FILE" << 'EOF'
-- Delete test users created during testing
-- This script soft-deletes users matching test email patterns

-- Test email patterns:
-- - supplier-test-*@example.com
-- - store-test-*@example.com  
-- - test-login-*@example.com

UPDATE users 
SET deleted_at = NOW() 
WHERE (
  email LIKE 'supplier-test-%@example.com' OR
  email LIKE 'store-test-%@example.com' OR
  email LIKE 'test-login-%@example.com' OR
  email LIKE 'test%@example.com'
)
AND deleted_at IS NULL;

-- Show what was deleted
SELECT id, email, name, role, created_at, deleted_at 
FROM users 
WHERE deleted_at IS NOT NULL 
AND (
  email LIKE 'supplier-test-%@example.com' OR
  email LIKE 'store-test-%@example.com' OR
  email LIKE 'test-login-%@example.com' OR
  email LIKE 'test%@example.com'
)
ORDER BY deleted_at DESC;
EOF

echo "✓ SQL script created: $SQL_FILE"
echo ""
echo "To delete test users, you need to run this SQL on the production database."
echo ""
echo "Option 1: Run SQL directly on the database server"
echo "  psql -h <db-host> -U <username> -d <database> -f $SQL_FILE"
echo ""
echo "Option 2: Use the Go migration tool (if you have DB access configured)"
echo "  cd golang && go run main.go migrate"
echo ""
echo "Option 3: Connect via SSH to EC2 and run SQL"
echo "  ssh <ec2-user>@ec2-44-192-83-29.compute-1.amazonaws.com"
echo "  # Then connect to RDS and run the SQL"
echo ""
echo "SQL Script Contents:"
echo "-------------------"
cat "$SQL_FILE"
echo ""
echo "=========================================="
echo "Note: This script only lists the SQL needed."
echo "You'll need database access to execute it."
echo "=========================================="
