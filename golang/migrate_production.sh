#!/bin/bash

# Production Database Migration Script
# This script runs migrations on the production database

export DB_HOST=siargaotradingroad-db-development.cyve06wmi6un.us-east-1.rds.amazonaws.com
export DB_USER=siargaotradingroad_admin
export DB_PASSWORD=ET5EktsEHKBbN7Q1
export DB_NAME=siargaotradingroad
export DB_PORT=5432

echo "🔄 Running production database migrations..."
cd golang
go run cmd/seed/main.go migrate

echo "✅ Production migrations completed"
