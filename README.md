<div align="center"> 
	<img src="./logo.png" width="100%" /> 
</div>

# Siargao Trading Road

Wholesale marketplace app connecting suppliers and stores in Siargao.

<div align="center"> 
	<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" /> 
	<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white" /> 
	<img src="https://img.shields.io/badge/React%20Native%20Paper-6200EE?style=for-the-badge&logo=react&logoColor=white" /> 
</div>

<div align="center"> 
	<img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Gin-009639?style=for-the-badge&logo=gin&logoColor=white" /> 
	<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /> 
	<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" /> 
</div>

<div align="center"> 
	<img src="https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" /> 
	<img src="https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white" /> 
	<img src="https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white" />
</div>

---

## Features

- **Supplier Management**: Register, add products via Excel/JSON/manual entry
- **Store Management**: Register, browse suppliers, purchase wholesale
- **Product Management**: Full CRUD operations with soft delete and restore
- **Authentication**: JWT-based secure authentication system
- **Multi-Platform**: React Native mobile app and Next.js web admin panel
- **RESTful API**: Golang backend with Gin framework

---

## Project Structure

```
siargaotradingroad/
├── mobile/               # React Native mobile app (Expo, Android APK)
├── go/                   # Golang REST API (Gin, PostgreSQL, JWT auth)
│   ├── handlers/         # API endpoints
│   ├── models/           # Database models
│   ├── middleware/       # Auth & validation middleware
│   ├── config/           # Configuration
│   └── database/         # DB connection
├── web/                  # Next.js admin panel (MUI5, TypeScript)
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # API client & utilities
│   └── contexts/         # React contexts
├── infrastructure/       # Infrastructure as Code
│   ├── terraform/        # AWS EC2 provisioning
│   └── github-actions/   # CI/CD workflows
└── docs/                 # Documentation
```

## User Types

- **Supplier**: Register, add items (Excel/JSON/manual)
- **Store**: Register, select supplier, buy wholesale

## Database Seeding

The database is automatically seeded when the server starts. Seeders create test data for development and testing.

### What Gets Seeded

- **1 Admin user**
- **3 Supplier users** (with products)
- **3 Store users**
- **10 Orders** (different supplier-store combinations with various statuses)

### Seeded Credentials

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Suppliers:**
1. Email: `supplier1@example.com` / Password: `supplier123` (Fresh Produce Co)
2. Email: `supplier2@example.com` / Password: `supplier123` (Meat & Seafood Supply)
3. Email: `supplier3@example.com` / Password: `supplier123` (Beverage Distributors)

**Stores:**
1. Email: `store1@example.com` / Password: `store123` (Supermarket Chain)
2. Email: `store2@example.com` / Password: `store123` (Convenience Store)
3. Email: `store3@example.com` / Password: `store123` (Restaurant Supply)

### Customizing Admin Credentials

You can customize the admin user credentials using environment variables:

```bash
export ADMIN_EMAIL=your-admin@example.com
export ADMIN_PASSWORD=your-password
export ADMIN_NAME=Your Admin Name
```

If not set, defaults are used: `admin@example.com` / `admin123`

### How Seeding Works

Seeders run automatically when the database connects. They check for existing records and skip creation if data already exists, making them safe to run multiple times.

To manually trigger seeding (if needed), restart the Go server:

```bash
cd go
go run main.go
```

## Testing

### Prerequisites

Ensure you have a test database configured. The tests use a separate database named `wholesale_test` by default. Set the following environment variables:

```bash
export DB_NAME=wholesale_test
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=test-secret-key
```

### Running Tests

#### Run All Tests

```bash
cd go
go test ./...
```

#### Run Tests with Verbose Output

```bash
go test ./... -v
```

#### Run Specific Test Suites

**Unit Tests:**
```bash
# Authentication tests
go test ./handlers -run TestRegister -v
go test ./handlers -run TestLogin -v

# Product tests
go test ./handlers -run TestCreateProduct -v
go test ./handlers -run TestGetProducts -v
go test ./handlers -run TestUpdateProduct -v

# Order tests
go test ./handlers -run TestCreateDraftOrder -v
go test ./handlers -run TestAddOrderItem -v
go test ./handlers -run TestUpdateOrderStatus -v
```

**End-to-End Tests:**
```bash
# Full business flow test
go test -run TestFullBusinessFlow -v
```

### Test Coverage

```bash
go test ./... -cover
```

### Test Structure

- **Unit Tests** (`handlers/*_test.go`): Test individual handler functions
  - `auth_test.go`: Registration and login
  - `product_test.go`: Product CRUD operations
  - `order_test.go`: Order management

- **E2E Tests** (`e2e_test.go`): Test complete business workflows
  - Supplier registration and product management
  - Store registration and order creation
  - Order status transitions (draft → preparing → in_transit → delivered)

- **Test Helpers** (`test_helpers.go`): Shared utilities for testing
  - Database setup and cleanup
  - HTTP client for API testing
  - Type conversion helpers

## Tech Stack

See [docs/TECH_STACK.md](./docs/TECH_STACK.md)

