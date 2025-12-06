# Database Schema - Siargao Trading Road

## Overview
PostgreSQL database using GORM for ORM. All tables include soft deletes via `deleted_at` timestamp.

## Tables

### users
Base user table for both suppliers and stores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| email | VARCHAR | UNIQUE, NOT NULL | User email address |
| password | VARCHAR | NOT NULL | Bcrypt hashed password |
| name | VARCHAR | NOT NULL | User's full name |
| phone | VARCHAR | | Contact phone number |
| address | VARCHAR | | Delivery/warehouse address |
| latitude | DECIMAL(10,8) | | GPS latitude coordinate (nullable) |
| longitude | DECIMAL(11,8) | | GPS longitude coordinate (nullable) |
| logo_url | VARCHAR | | Logo image URL (nullable) |
| banner_url | VARCHAR | | Banner image URL (nullable) |
| facebook | VARCHAR | | Facebook profile URL (nullable) |
| instagram | VARCHAR | | Instagram profile URL (nullable) |
| twitter | VARCHAR | | Twitter/X profile URL (nullable) |
| linkedin | VARCHAR | | LinkedIn profile URL (nullable) |
| youtube | VARCHAR | | YouTube channel URL (nullable) |
| tiktok | VARCHAR | | TikTok profile URL (nullable) |
| website | VARCHAR | | Website URL (nullable) |
| role | VARCHAR(20) | NOT NULL | User role: 'supplier' or 'store' |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `email` (unique)
- `deleted_at` (for soft delete queries)
- `(latitude, longitude)` (composite index for location-based queries)

**User Roles:**
- `supplier`: Business supplying products
- `store`: Store purchasing products

**Supplier-specific fields** (stored in users table when role='supplier'):
- `business_name`: Name of supplier business
- `tax_id`: Tax identification number (optional)

**Store-specific fields** (stored in users table when role='store'):
- `store_name`: Name of the store
- `business_license`: Business license number (optional)

## Future Tables (Planned)

### products
Products catalog managed by suppliers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Product ID |
| supplier_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to users.id (role='supplier') |
| name | VARCHAR | NOT NULL | Product name |
| description | TEXT | | Product description |
| sku | VARCHAR | UNIQUE | Stock keeping unit |
| price | DECIMAL(10,2) | NOT NULL | Unit price |
| stock_quantity | INTEGER | NOT NULL, DEFAULT 0 | Available stock |
| unit | VARCHAR(20) | | Unit of measurement (kg, piece, box, etc.) |
| category | VARCHAR(50) | | Product category |
| image_url | VARCHAR | | Product image URL (S3) |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `supplier_id`
- `sku` (unique)
- `category`
- `deleted_at`

### orders
Orders placed by stores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Order ID |
| store_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to users.id (role='store') |
| supplier_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to users.id (role='supplier') |
| status | VARCHAR(20) | NOT NULL | Order status: 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled' |
| total_amount | DECIMAL(10,2) | NOT NULL | Total order amount |
| shipping_address | TEXT | NOT NULL | Delivery address |
| notes | TEXT | | Order notes |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `store_id`
- `supplier_id`
- `status`
- `created_at`
- `deleted_at`

### order_items
Individual items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Order item ID |
| order_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to orders.id |
| product_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to products.id |
| quantity | INTEGER | NOT NULL | Quantity ordered |
| unit_price | DECIMAL(10,2) | NOT NULL | Price at time of order |
| subtotal | DECIMAL(10,2) | NOT NULL | quantity * unit_price |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |

**Indexes:**
- `order_id`
- `product_id`

### transactions
Payment transactions for orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Transaction ID |
| order_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to orders.id |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount |
| payment_method | VARCHAR(20) | NOT NULL | Payment method: 'cash', 'bank_transfer', 'online' |
| status | VARCHAR(20) | NOT NULL | Transaction status: 'pending', 'completed', 'failed', 'refunded' |
| reference_number | VARCHAR(100) | | Payment reference number |
| transaction_date | TIMESTAMP | NOT NULL | Transaction timestamp |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `order_id`
- `status`
- `transaction_date`
- `deleted_at`

### messages
Chat messages between stores and suppliers for orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Message ID |
| order_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to orders.id |
| sender_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to users.id (who sent the message) |
| content | TEXT | NOT NULL | Message content |
| read_at | TIMESTAMP | INDEX | Timestamp when message was read (nullable) |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `order_id`
- `sender_id`
- `read_at`
- `deleted_at`

### ratings
Two-way ratings between stores and suppliers for delivered orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing rating ID |
| order_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to orders.id |
| rater_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to users.id (who gave the rating) |
| rated_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to users.id (who received the rating) |
| rating | INTEGER | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Rating value (1-5 stars) |
| comment | TEXT | | Optional text review |
| created_at | TIMESTAMP | | Record creation timestamp |
| updated_at | TIMESTAMP | | Record update timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `order_id`
- `rater_id`
- `rated_id`
- `(order_id, rater_id)` (unique - prevents duplicate ratings from same rater for same order)
- `deleted_at`

**Notes:**
- Each delivered order can have up to 2 ratings: one from store (rating supplier) and one from supplier (rating store)
- Rating constraint ensures values are between 1 and 5

### audit_logs
Activity logs for all API calls to track user, admin, and employee actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing log ID |
| user_id | INTEGER | FOREIGN KEY, INDEX | Reference to users.id (nullable for unauthenticated requests) |
| user | User | FOREIGN KEY | User who performed the action |
| role | VARCHAR(20) | INDEX | User role (admin, supplier, store) - nullable for unauthenticated requests |
| action | VARCHAR(255) | NOT NULL | HTTP method + endpoint path |
| endpoint | VARCHAR(255) | NOT NULL | API endpoint path |
| method | VARCHAR(10) | NOT NULL | HTTP method (GET, POST, PUT, DELETE, etc.) |
| status_code | INTEGER | NOT NULL | HTTP response status code |
| ip_address | VARCHAR(45) | | Client IP address |
| user_agent | TEXT | | Browser/client user agent string |
| request_body | TEXT | | Request body content (truncated if > 10KB) |
| response_body | TEXT | | Response body content (truncated if > 10KB) |
| duration_ms | BIGINT | NOT NULL | Request processing time in milliseconds |
| error_message | TEXT | | Error message if request failed |
| created_at | TIMESTAMP | INDEX | Record creation timestamp |
| deleted_at | TIMESTAMP | INDEX | Soft delete timestamp |

**Indexes:**
- `user_id`
- `role`
- `created_at`
- `deleted_at`

**Notes:**
- Logs all API calls automatically via middleware
- Request/response bodies truncated at 10KB to prevent excessive storage
- Logs created asynchronously to avoid impacting API performance
- User ID is nullable for unauthenticated endpoints (login, register)

## Relationships

```
users (supplier)
  └── products (one-to-many)
        └── order_items (one-to-many)
              └── orders (many-to-one)
                    └── transactions (one-to-many)
                    └── messages (one-to-many)

users (store)
  └── orders (one-to-many)
        └── order_items (one-to-many)
              └── products (many-to-one)
        └── messages (one-to-many)

orders
  └── messages (one-to-many)
  └── ratings (one-to-many, max 2 per order)

users (supplier/store)
  └── ratings_given (one-to-many via rater_id)
  └── ratings_received (one-to-many via rated_id)
  └── audit_logs (one-to-many via user_id)
```

## Notes

- All monetary values use `DECIMAL(10,2)` for precision
- Soft deletes are implemented using GORM's `DeletedAt` field
- Foreign key relationships enforce referential integrity
- Timezone is set to `Asia/Manila` in database connection
- Product images and Excel/JSON uploads stored in S3, URLs stored in database

