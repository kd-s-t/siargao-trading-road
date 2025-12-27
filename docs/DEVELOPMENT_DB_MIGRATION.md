## Development DB Migration (Golang CLI)

- Purpose: run GORM auto-migrations against the live development Postgres.
- Requirements: Go toolchain, network access to the dev RDS, credentials (host, user, password, db, port) from your secrets source.

### Steps
- From project root:
  - `cd golang`
  - `DB_HOST=<dev-host> DB_PORT=<port> DB_USER=<user> DB_PASSWORD=<password> DB_NAME=<db> go run cmd/seed/main.go migrate`
- On success the CLI prints `Database migrations completed successfully`.

### Notes
- SSL mode auto-switches to `require` for non-local hosts.
- Migrations no longer automatically seed data. Seeding must be done explicitly.
- Do not commit credentials; load them via env vars or your secret manager.

## Database Seeding

Seeders are separated and can be run independently. This prevents overwriting user-uploaded data (like logos/banners).

### Available Seeder Commands

From the `golang` directory:

```bash
# Seed individual components
go run cmd/seed/main.go seed-admin      # Seed admin user only
go run cmd/seed/main.go seed-suppliers  # Seed suppliers only (preserves existing logo/banner URLs)
go run cmd/seed/main.go seed-stores     # Seed stores only (preserves existing logo/banner URLs)
go run cmd/seed/main.go seed-products   # Seed products only
go run cmd/seed/main.go seed-orders     # Seed orders only
go run cmd/seed/main.go seed-ratings    # Seed ratings only

# Reset and seed everything
go run cmd/seed/main.go reset           # Truncates all tables and seeds all data

# Other commands
go run cmd/seed/main.go migrate         # Run migrations only (no seeding)
go run cmd/seed/main.go                 # Show available commands
```

### Production Database Seeding

For production database, set environment variables:

```bash
cd golang
DB_HOST=<prod-host> \
DB_PORT=5432 \
DB_USER=<prod-user> \
DB_PASSWORD=<prod-password> \
DB_NAME=siargaotradingroad \
go run cmd/seed/main.go seed-suppliers
```

### Important Notes

- **Logo/Banner Preservation**: `seed-suppliers` and `seed-stores` only update logo/banner URLs if the seed data contains non-empty values. This prevents overwriting user-uploaded images.
- **No Automatic Seeding**: Migrations no longer automatically seed data. You must explicitly run seeders when needed.
- **Selective Seeding**: You can seed specific components without affecting others (e.g., seed products without touching user data).
