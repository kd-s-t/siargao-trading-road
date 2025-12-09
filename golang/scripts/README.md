# Golang Scripts

This directory contains scripts for the Golang backend API.

## Scripts

### Development & Database

- **`run.sh`** - Runs the Go application locally
  - Usage: `./golang/scripts/run.sh`

- **`reseed.sh`** - Reseeds the database with sample data
  - Usage: `./golang/scripts/reseed.sh [local|production]`
  - Example: `./golang/scripts/reseed.sh local`

- **`migrate_production.sh.example`** - Example script for production database migrations
  - Copy to `migrate_production.sh` and configure with your production credentials

### API Testing

- **`test-logo-banner-upload.sh`** - Tests logo and banner image upload functionality via API
  - Tests the `/api/upload` endpoint
  - Usage: `./golang/scripts/test-logo-banner-upload.sh`

- **`test-product-with-image.sh`** - Tests product creation with image upload via API
  - Tests product creation with image upload
  - Usage: `./golang/scripts/test-product-with-image.sh`

- **`test-register-prod.sh`** - Tests user registration on production API
  - Tests the `/api/register` endpoint
  - Usage: `./golang/scripts/test-register-prod.sh`

## Usage

All scripts should be run from the project root directory:

```bash
# From project root
./golang/scripts/run.sh
./golang/scripts/reseed.sh local
```

## Notes

- Test scripts target the production API by default (`https://siargaotradingroad.com/api`)
- Some scripts require environment variables or AWS credentials
- Test scripts use unique timestamps to avoid conflicts
