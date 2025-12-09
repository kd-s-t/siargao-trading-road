# Golang Backend API

RESTful API backend built with Go, Gin framework, PostgreSQL, and JWT authentication.

## Quick Start

```bash
cd golang
go run main.go
```

The server runs on port **3020** by default. The API will be available at `http://localhost:3020/api`.

## Environment Variables

Create `.env` file (optional):
```bash
PORT=3020
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=siargao_trading_road
JWT_SECRET=change-this-secret-key
```

## Database Seeding

The database is automatically seeded when the server starts.

### Seeded Credentials

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Suppliers:**
- `nike@example.com` / `supplier123` (Nike)
- `toms@example.com` / `supplier123` (Toms)
- `711@example.com` / `supplier123` (7-Eleven)
- `walmart@example.com` / `supplier123` (Walmart)

**Stores:**
- `ervies@example.com` / `store123` (Ervies)
- `sarisari@example.com` / `store123` (Sarisari)
- `kicks@example.com` / `store123` (Kicks)

### Reseeding Database

To reset and reseed the database, use the reseed script:

**Local:**
```bash
./golang/scripts/reseed.sh local
```

**Production:**
```bash
./golang/scripts/reseed.sh production
```

The script will prompt for production database credentials (host, port, user, password, database name).

Alternatively, you can run the seed command directly:
```bash
go run cmd/seed/main.go reset
```

### Customizing Admin Credentials

```bash
export ADMIN_EMAIL=your-admin@example.com
export ADMIN_PASSWORD=your-password
export ADMIN_NAME=Your Admin Name
```

## Testing

### Run All Tests
```bash
go test ./...
```

### Run Tests with Verbose Output
```bash
go test ./... -v
```

### Test Coverage
```bash
go test ./... -cover
```

## Test Database

For testing, use a separate database:
```bash
export DB_NAME=siargao_trading_road_test
export JWT_SECRET=test-secret-key
```
