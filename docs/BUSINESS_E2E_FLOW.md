# Business End-to-End Flow - Siargao Trading Road

## Overview
This document outlines the complete business workflows for each user role in the Siargao Trading Road platform, including all available actions and their corresponding API endpoints.

---

## 1. Supplier Role

### 1.1 Profile Management

#### View Own Profile
- **Action**: View supplier's own profile information
- **API**: `GET /api/me`
- **Response**: User object with profile details, ratings, working hours, and open/closed status

#### Edit Profile
- **Action**: Update supplier profile information
- **API**: `PUT /api/me`
- **Request Body**:
  ```json
  {
    "name": "string",
    "phone": "string",
    "address": "string",
    "latitude": 0.0,
    "longitude": 0.0,
    "logo_url": "string",
    "banner_url": "string",
    "facebook": "string",
    "instagram": "string",
    "twitter": "string",
    "linkedin": "string",
    "youtube": "string",
    "tiktok": "string",
    "website": "string"
  }
  ```

#### Edit Working Hours
- **Action**: Update operating hours and days
- **API**: `PUT /api/me`
- **Request Body**:
  ```json
  {
    "working_days": "string",
    "opening_time": "string",
    "closing_time": "string"
  }
  ```

#### Open Store/Supplier
- **Action**: Mark supplier as open for business
- **API**: `POST /api/me/open`
- **Response**: Updated user object with `is_open: true`

#### Close Store/Supplier
- **Action**: Mark supplier as closed
- **API**: `POST /api/me/close`
- **Response**: Updated user object with `is_open: false`

#### Upload Image
- **Action**: Upload logo or banner image
- **API**: `POST /api/upload`
- **Request**: Multipart form data with image file

### 1.2 Product Management

#### View Own Products
- **Action**: List all products belonging to the supplier
- **API**: `GET /api/products`
- **Query Params**: `include_deleted=true` (optional, to include soft-deleted products)
- **Response**: Array of product objects

#### View Single Product
- **Action**: Get details of a specific product
- **API**: `GET /api/products/:id`
- **Response**: Product object with supplier information

#### Create Product
- **Action**: Add a new product to catalog
- **API**: `POST /api/products`
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "sku": "string",
    "price": 0.0,
    "stock_quantity": 0,
    "unit": "string",
    "category": "string",
    "image_url": "string"
  }
  ```

#### Bulk Create Products
- **Action**: Create multiple products at once
- **API**: `POST /api/products/bulk`
- **Request Body**: Array of product objects
- **Response**: Summary with created products and any errors

#### Update Product
- **Action**: Modify product details
- **API**: `PUT /api/products/:id`
- **Request Body**: Partial product object with fields to update

#### Delete Product
- **Action**: Soft delete a product
- **API**: `DELETE /api/products/:id`
- **Response**: Success message

#### Restore Product
- **Action**: Restore a soft-deleted product
- **API**: `POST /api/products/:id/restore`
- **Response**: Restored product object

### 1.3 Store Management

#### View Stores
- **Action**: List all stores in the platform
- **API**: `GET /api/stores`
- **Response**: Array of store objects with ratings, working hours, and open/closed status

### 1.4 Order Management

#### View Orders
- **Action**: List all orders received by the supplier
- **API**: `GET /api/orders`
- **Response**: Array of order objects with store, order items, and product details
- **Note**: Only returns orders where `supplier_id` matches the logged-in supplier

#### View Order Details
- **Action**: Get detailed information about a specific order
- **API**: `GET /api/orders/:id`
- **Response**: Order object with store, order items, products, and ratings

#### Update Order Status
- **Action**: Change order status (preparing, in_transit, delivered, cancelled)
- **API**: `PUT /api/orders/:id/status`
- **Request Body**:
  ```json
  {
    "status": "preparing" | "in_transit" | "delivered" | "cancelled"
  }
  ```
- **Valid Statuses**: `draft`, `preparing`, `in_transit`, `delivered`, `cancelled`

#### View Order Messages
- **Action**: Get all messages for a specific order
- **API**: `GET /api/orders/:id/messages`
- **Response**: Array of message objects with sender information
- **Response Format**:
  ```json
  [
    {
      "id": 0,
      "order_id": 0,
      "sender_id": 0,
      "sender": {
        "id": 0,
        "name": "string",
        "role": "supplier" | "store"
      },
      "content": "string",
      "read_at": "2024-01-01T00:00:00Z" | null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
  ```
- **Note**: Messages are ordered by `created_at` in ascending order (oldest first)

#### Send Order Message
- **Action**: Send a message to the store regarding an order
- **API**: `POST /api/orders/:id/messages`
- **Request Body**:
  ```json
  {
    "content": "string"
  }
  ```
- **Response**: Created message object with sender information
- **Constraints**: 
  - Message must be 1-5000 characters
  - For delivered orders, messaging closes 12 hours after delivery
  - Only supplier and store involved in the order can send messages

#### Send Invoice Email
- **Action**: Send invoice email to store
- **API**: `POST /api/orders/:id/send-invoice`
- **Response**: Success message with recipient email

### 1.5 Ratings

#### View Own Ratings
- **Action**: View all ratings received by the supplier
- **API**: `GET /api/me/ratings`
- **Response**: Array of rating objects with rater, rated user, and order information

#### Rate Store
- **Action**: Rate a store after order delivery
- **API**: `POST /api/orders/:id/rating`
- **Request Body**:
  ```json
  {
    "rating": 1-5,
    "comment": "string"
  }
  ```
- **Constraints**:
  - Only allowed for delivered orders
  - One rating per order per user
  - Store rates supplier, supplier rates store

### 1.6 Analytics

#### View Analytics
- **Action**: View supplier's business analytics
- **API**: `GET /api/me/analytics`
- **Response**:
  ```json
  {
    "total_orders": 0,
    "total_earnings": 0.0,
    "total_products_bought": 0,
    "orders": [],
    "products_bought": [],
    "recent_orders": [],
    "average_rating": 0.0,
    "rating_count": 0
  }
  ```

---

## 2. Store Role

### 2.1 Profile Management

#### View Own Profile
- **Action**: View store's own profile information
- **API**: `GET /api/me`
- **Response**: User object with profile details, ratings, working hours, and open/closed status

#### Edit Profile
- **Action**: Update store profile information
- **API**: `PUT /api/me`
- **Request Body**: Same as supplier profile edit

#### Edit Working Hours
- **Action**: Update operating hours and days
- **API**: `PUT /api/me`
- **Request Body**: Same as supplier working hours edit

#### Open Store
- **Action**: Mark store as open for business
- **API**: `POST /api/me/open`
- **Response**: Updated user object with `is_open: true`

#### Close Store
- **Action**: Mark store as closed
- **API**: `POST /api/me/close`
- **Response**: Updated user object with `is_open: false`

#### Upload Image
- **Action**: Upload logo or banner image
- **API**: `POST /api/upload`
- **Request**: Multipart form data with image file

### 2.2 Supplier Management

#### View Suppliers
- **Action**: List all suppliers in the platform
- **API**: `GET /api/suppliers`
- **Response**: Array of supplier objects with ratings, working hours, open/closed status, and product count

#### View Supplier Products
- **Action**: View all products from a specific supplier
- **API**: `GET /api/suppliers/:id/products`
- **Response**: Array of product objects

### 2.3 Order Management

#### View Orders
- **Action**: List all orders placed by the store
- **API**: `GET /api/orders`
- **Response**: Array of order objects with supplier, order items, and product details
- **Note**: Only returns orders where `store_id` matches the logged-in store

#### View Order Details
- **Action**: Get detailed information about a specific order
- **API**: `GET /api/orders/:id`
- **Response**: Order object with supplier, order items, products, and ratings

#### Create Draft Order
- **Action**: Create a new draft order for a supplier
- **API**: `POST /api/orders/draft`
- **Request Body**:
  ```json
  {
    "supplier_id": 0
  }
  ```
- **Note**: If a draft order already exists for this supplier, returns the existing draft

#### Get Draft Order
- **Action**: Retrieve the current draft order for a supplier
- **API**: `GET /api/orders/draft?supplier_id=:id`
- **Response**: Draft order object with supplier and order items

#### Add Item to Order
- **Action**: Add a product to the draft order
- **API**: `POST /api/orders/:id/items`
- **Request Body**:
  ```json
  {
    "product_id": 0,
    "quantity": 0
  }
  ```
- **Constraints**:
  - Only works on draft orders
  - Validates stock availability
  - Updates product stock quantity automatically
  - If item already exists, increases quantity

#### Update Order Item
- **Action**: Modify quantity of an item in draft order
- **API**: `PUT /api/orders/items/:item_id`
- **Request Body**:
  ```json
  {
    "quantity": 0
  }
  ```
- **Constraints**: Only works on draft orders

#### Remove Order Item
- **Action**: Remove an item from draft order
- **API**: `DELETE /api/orders/items/:item_id`
- **Response**: Success message
- **Note**: Restores product stock quantity

#### Submit Order
- **Action**: Submit draft order for processing
- **API**: `POST /api/orders/:id/submit`
- **Request Body**:
  ```json
  {
    "payment_method": "cash_on_delivery" | "gcash",
    "delivery_option": "pickup" | "deliver",
    "delivery_fee": 0.0,
    "distance": 0.0,
    "shipping_address": "string",
    "notes": "string"
  }
  ```
- **Constraints**:
  - Order must have at least one item
  - **Minimum order amount: ₱5,000.00** (subtotal before delivery fee)
  - Orders below minimum cannot be submitted
  - Changes status from `draft` to `preparing`
- **Delivery Fee Calculation**:
  - When `delivery_option` is `"deliver"`, delivery fee is automatically calculated
  - **Formula**: Total quantity of all items × ₱20.00
  - Example: 300 sacks × ₱20.00 = ₱6,000.00 delivery fee
  - When `delivery_option` is `"pickup"`, delivery fee is ₱0.00
  - Final total = Subtotal + Delivery Fee
- **Shipping Address**:
  - Required when `delivery_option` is `"deliver"`
  - Optional when `delivery_option` is `"pickup"`

#### Update Order Status
- **Action**: Change order status (cancelled only for stores)
- **API**: `PUT /api/orders/:id/status`
- **Request Body**:
  ```json
  {
    "status": "cancelled"
  }
  ```

#### View Order Messages
- **Action**: Get all messages for a specific order
- **API**: `GET /api/orders/:id/messages`
- **Response**: Array of message objects with sender information
- **Response Format**:
  ```json
  [
    {
      "id": 0,
      "order_id": 0,
      "sender_id": 0,
      "sender": {
        "id": 0,
        "name": "string",
        "role": "supplier" | "store"
      },
      "content": "string",
      "read_at": "2024-01-01T00:00:00Z" | null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
  ```
- **Note**: Messages are ordered by `created_at` in ascending order (oldest first)

#### Send Order Message
- **Action**: Send a message to the supplier regarding an order
- **API**: `POST /api/orders/:id/messages`
- **Request Body**:
  ```json
  {
    "content": "string"
  }
  ```
- **Response**: Created message object with sender information
- **Constraints**: 
  - Message must be 1-5000 characters
  - For delivered orders, messaging closes 12 hours after delivery
  - Only supplier and store involved in the order can send messages

### 2.4 Ratings

#### View Own Ratings
- **Action**: View all ratings received by the store
- **API**: `GET /api/me/ratings`
- **Response**: Array of rating objects with rater, rated user, and order information

#### Rate Supplier
- **Action**: Rate a supplier after order delivery
- **API**: `POST /api/orders/:id/rating`
- **Request Body**:
  ```json
  {
    "rating": 1-5,
    "comment": "string"
  }
  ```
- **Constraints**: Same as supplier rating

### 2.5 Analytics

#### View Analytics
- **Action**: View store's business analytics
- **API**: `GET /api/me/analytics`
- **Response**:
  ```json
  {
    "total_orders": 0,
    "total_earnings": 0.0,
    "total_products_bought": 0,
    "orders": [],
    "products_bought": [],
    "recent_orders": [],
    "average_rating": 0.0,
    "rating_count": 0
  }
  ```
- **Note**: For stores, `total_earnings` represents total amount spent

---

## 3. Common Features (All Roles)

### 3.1 Authentication

#### Register
- **Action**: Create a new account
- **API**: `POST /api/register`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "name": "string",
    "role": "supplier" | "store",
    "phone": "string",
    "address": "string"
  }
  ```

#### Login
- **Action**: Authenticate and receive JWT token
- **API**: `POST /api/login`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: JWT token and user object

### 3.2 Order Status Flow

The order status flow follows this progression:

1. **draft** - Order is being created by store
2. **preparing** - Order submitted, supplier is preparing
3. **in_transit** - Order is being delivered
4. **delivered** - Order has been delivered
5. **cancelled** - Order was cancelled (can occur at any stage)

### 3.3 Rating System

- Ratings can only be created for **delivered** orders
- Each order can have up to 2 ratings:
  - One from the store (rating the supplier)
  - One from the supplier (rating the store)
- Rating values: 1-5 stars
- Optional comment field for text review

### 3.4 Messaging System

- **Messages Table Structure**:
  - Messages are stored in the `messages` table
  - Each message is linked to an order via `order_id`
  - Each message has a `sender_id` referencing the user who sent it
  - Messages include `read_at` timestamp for read receipts (nullable)
  - Messages support soft deletes via `deleted_at` timestamp

- **Message Object Fields**:
  - `id`: Unique message identifier
  - `order_id`: Reference to the order
  - `sender_id`: Reference to the user who sent the message
  - `sender`: Sender user object (id, name, role)
  - `content`: Message text content (1-5000 characters)
  - `read_at`: Timestamp when message was read (nullable)
  - `created_at`: Message creation timestamp

- **Messaging Rules**:
  - Messages are tied to specific orders
  - Both store and supplier can send messages for their orders
  - For delivered orders, messaging closes 12 hours after delivery
  - Message content: 1-5000 characters
  - Messages are ordered chronologically (oldest first)
  - Only users involved in the order (store or supplier) can view and send messages

### 3.5 Minimum Order Amount and Delivery Fee

- **Minimum Order Amount**: Wholesale orders require a minimum subtotal of **₱5,000.00**
  - Orders below this amount cannot be submitted
  - Validation occurs at order submission
  - Minimum is calculated on subtotal (before delivery fee)

- **Delivery Fee Calculation**:
  - Delivery fee is automatically calculated when `delivery_option` is `"deliver"`
  - **Formula**: Total quantity of all items in order × ₱20.00 per item
  - Example: If order contains 300 sacks, delivery fee = 300 × ₱20.00 = ₱6,000.00
  - When `delivery_option` is `"pickup"`, delivery fee is ₱0.00
  - Final order total = Subtotal + Delivery Fee

---

## 4. API Authentication

All protected endpoints require:
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- Token obtained from `/api/login`
- Token contains user ID and role information

---

## 5. Error Responses

Standard error response format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - OK`: Success
- `201` - Created`: Resource created successfully
- `400` - Bad Request`: Invalid request data
- `401` - Unauthorized`: Authentication required
- `403` - Forbidden`: Insufficient permissions
- `404` - Not Found`: Resource not found
- `409` - Conflict`: Resource conflict (e.g., duplicate SKU)
- `500` - Internal Server Error`: Server error

---

## 6. Notes

- All timestamps are in `Asia/Manila` timezone
- Soft deletes are used for products and users (preserves data)
- Product stock is automatically updated when items are added/removed from draft orders
- Order totals include delivery fees when submitted
- Ratings affect the average rating displayed on supplier/store profiles
- Working hours and open/closed status are displayed to other users when browsing suppliers/stores

