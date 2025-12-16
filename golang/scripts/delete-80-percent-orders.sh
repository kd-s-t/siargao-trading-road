#!/bin/bash

set -e

if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_USER=${DB_USER:-postgres}
    DB_PASSWORD=${DB_PASSWORD:-postgres}
    DB_NAME=${DB_NAME:-siargaotradingroad}
else
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-siargaotradingroad}
fi

if [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ]; then
    echo "WARNING: DB_HOST is not localhost. This script is designed for local database only."
    echo "Current DB_HOST: $DB_HOST"
    read -p "Continue anyway? (yes/no): " response
    if [ "$response" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
fi

export PGPASSWORD="$DB_PASSWORD"

TOTAL_ORDERS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM orders;" | xargs)

if [ "$TOTAL_ORDERS" -eq 0 ]; then
    echo "No orders found in database."
    exit 0
fi

ORDERS_TO_DELETE=$((TOTAL_ORDERS * 80 / 100))
ORDERS_TO_KEEP=$((TOTAL_ORDERS - ORDERS_TO_DELETE))

echo "Total orders: $TOTAL_ORDERS"
echo "Orders to delete: $ORDERS_TO_DELETE (80%)"
echo "Orders to keep: $ORDERS_TO_KEEP (20%)"
read -p "Continue with deletion? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "Deleting messages..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    DELETE FROM messages 
    WHERE order_id IN (
        SELECT id FROM orders ORDER BY id ASC LIMIT $ORDERS_TO_DELETE
    );
" > /dev/null
echo "Deleted messages for orders"

echo "Deleting ratings..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    DELETE FROM ratings 
    WHERE order_id IN (
        SELECT id FROM orders ORDER BY id ASC LIMIT $ORDERS_TO_DELETE
    );
" > /dev/null
echo "Deleted ratings for orders"

echo "Deleting order items..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    DELETE FROM order_items 
    WHERE order_id IN (
        SELECT id FROM orders ORDER BY id ASC LIMIT $ORDERS_TO_DELETE
    );
" > /dev/null
echo "Deleted order items for orders"

echo "Deleting orders..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    DELETE FROM orders 
    WHERE id IN (
        SELECT id FROM orders ORDER BY id ASC LIMIT $ORDERS_TO_DELETE
    );
" > /dev/null
echo "Deleted orders"

REMAINING_ORDERS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM orders;" | xargs)
echo "Remaining orders: $REMAINING_ORDERS"
echo "Done!"

