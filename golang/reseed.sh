#!/bin/bash

set -e

ENV="${1:-local}"

if [ "$ENV" != "local" ] && [ "$ENV" != "production" ]; then
    echo "Usage: $0 [local|production]"
    echo "  local      - Reseed local database (default)"
    echo "  production - Reseed production database"
    exit 1
fi

cd "$(dirname "$0")"

if [ "$ENV" = "local" ]; then
    echo "Reseeding local database..."
    go run cmd/seed/main.go reset
elif [ "$ENV" = "production" ]; then
    echo "Reseeding production database..."
    echo ""
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
        echo "Please provide production database credentials:"
        read -p "DB_HOST: " DB_HOST
        read -p "DB_PORT [5432]: " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        read -p "DB_USER: " DB_USER
        read -s -p "DB_PASSWORD: " DB_PASSWORD
        echo ""
        read -p "DB_NAME [siargaotradingroad]: " DB_NAME
        DB_NAME=${DB_NAME:-siargaotradingroad}
    else
        echo "Using environment variables for database credentials..."
        DB_PORT=${DB_PORT:-5432}
        DB_NAME=${DB_NAME:-siargaotradingroad}
    fi
    
    echo ""
    echo "Connecting to production database..."
    
    DB_HOST="$DB_HOST" \
    DB_PORT="$DB_PORT" \
    DB_USER="$DB_USER" \
    DB_PASSWORD="$DB_PASSWORD" \
    DB_NAME="$DB_NAME" \
    go run cmd/seed/main.go reset
fi

echo ""
echo "Database reseed completed successfully!"

