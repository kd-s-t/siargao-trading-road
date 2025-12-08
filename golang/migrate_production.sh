#!/bin/bash

# Production Database Migration Script
# This script runs migrations on the production database
# Database credentials are loaded from environment variables or SSM Parameter Store

set -e

ENVIRONMENT="${ENVIRONMENT:-development}"
SSM_PATH="/siargaotradingroad/${ENVIRONMENT}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔄 Loading database credentials from SSM Parameter Store..."
echo "SSM Path: $SSM_PATH"
echo "Region: $AWS_REGION"

# Load credentials from SSM Parameter Store
if command -v aws &> /dev/null; then
  echo "Loading from SSM..."
  aws ssm get-parameters-by-path \
    --path "$SSM_PATH" \
    --recursive \
    --region "$AWS_REGION" \
    --with-decryption \
    --query 'Parameters[*].[Name,Value]' \
    --output text | awk -F '\t' '{split($1,a,"/"); print a[length(a)] "=" $2}' > /tmp/migration-env.sh || {
    echo "⚠️  Failed to load from SSM, using environment variables"
  }
  
  if [ -f /tmp/migration-env.sh ]; then
    source /tmp/migration-env.sh
    rm -f /tmp/migration-env.sh
  fi
else
  echo "⚠️  AWS CLI not found, using environment variables"
fi

# Verify required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "❌ Error: Required database environment variables are not set"
  echo "Please set: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
  echo "Or ensure AWS CLI is configured and SSM parameters exist at $SSM_PATH"
  exit 1
fi

# Export variables (in case they weren't already exported)
export DB_HOST
export DB_USER
export DB_PASSWORD
export DB_NAME
export DB_PORT="${DB_PORT:-5432}"

echo "✅ Database credentials loaded"
echo "🔄 Running production database migrations..."

cd "$(dirname "$0")" || exit 1
go run cmd/seed/main.go migrate

echo "✅ Production migrations completed"
