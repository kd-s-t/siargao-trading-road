-- Delete specific products from production
-- Products to delete: 51, 52, 53, 56 (supplier_id 16)
-- This uses soft delete (sets deleted_at timestamp)

-- First, check if these products have any order_items
SELECT 
    p.id as product_id,
    p.name,
    p.supplier_id,
    COUNT(oi.id) as order_items_count
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.id IN (51, 52, 53, 56)
GROUP BY p.id, p.name, p.supplier_id;

-- Check stock history for these products
SELECT 
    product_id,
    COUNT(*) as history_count
FROM products_stocks_history
WHERE product_id IN (51, 52, 53, 56)
GROUP BY product_id;

-- Soft delete the products (sets deleted_at timestamp)
UPDATE products 
SET deleted_at = NOW()
WHERE id IN (51, 52, 53, 56)
AND deleted_at IS NULL;

-- Verify deletion
SELECT id, name, supplier_id, deleted_at 
FROM products 
WHERE id IN (51, 52, 53, 56);

