## Development DB Migration (Golang CLI)

- Purpose: run GORM auto-migrations against the live development Postgres.
- Requirements: Go toolchain, network access to the dev RDS, credentials (host, user, password, db, port) from your secrets source.

### Steps
- From project root:
  - `cd golang`
  - `DB_HOST=<dev-host> DB_PORT=<port> DB_USER=<user> DB_PASSWORD=<password> DB_NAME=<db> go run main.go migrate`
- On success the CLI prints `Database migrations completed successfully`.

### Notes
- SSL mode auto-switches to `require` for non-local hosts.
- Seeder runs only when CI/GitHub Actions are not set; expect live data to remain unchanged unless you run reseed separately.
- Do not commit credentials; load them via env vars or your secret manager.
