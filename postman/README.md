# Postman Collection with Newman Tests

This directory contains the Postman collection for the Siargao Trading Road API with comprehensive Newman test scripts.

## Installation

Install Newman globally:
```bash
npm install -g newman
```

Or install locally in your project:
```bash
npm install --save-dev newman
```

## Running Tests

### Basic Run
```bash
newman run Siargao_Trading_Road_API.postman_collection.json
```

### With Environment File
```bash
newman run Siargao_Trading_Road_API.postman_collection.json -e Siargao_Trading_Road_Local.postman_environment.json
```

### With Reporters
```bash
# HTML Report
newman run Siargao_Trading_Road_API.postman_collection.json -r html --reporter-html-export report.html

# JSON Report
newman run Siargao_Trading_Road_API.postman_collection.json -r json --reporter-json-export report.json

# CLI Report (default)
newman run Siargao_Trading_Road_API.postman_collection.json -r cli
```

### With Multiple Reporters
```bash
newman run Siargao_Trading_Road_API.postman_collection.json -r html,json,cli --reporter-html-export report.html --reporter-json-export report.json
```

## Test Coverage

The collection includes tests for:

- **Authentication**: Register, Login, Get Me, Update Me, Get My Analytics, Upload Image
- **Products**: CRUD operations, Bulk create, Restore
- **Orders**: Get, Create, Update status, Add/Update/Remove items, Submit, Messages, Send invoice
- **Suppliers**: Get suppliers, Get supplier products
- **Stores**: Get stores
- **Users (Admin)**: Get all users, Get user by ID, Get user analytics, Admin register user
- **Dashboard (Admin)**: Get dashboard analytics

## Test Assertions

Each endpoint includes:
- Status code validation
- Response time checks (when applicable)
- Response structure validation
- Data type checks

## Environment Variables

The collection uses the following environment variables:
- `base_url`: API base URL
- `token`: Authentication token (auto-set on login/register)
- `user_id`: Current user ID (auto-set on login/register)
- `user_role`: Current user role (auto-set on login/register)

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run API Tests
  run: |
    npm install -g newman
    newman run postman/Siargao_Trading_Road_API.postman_collection.json \
      -e postman/Siargao_Trading_Road_Local.postman_environment.json \
      -r html,json \
      --reporter-html-export newman-report.html \
      --reporter-json-export newman-report.json
```

### Exit Codes
Newman exits with:
- `0`: All tests passed
- `1`: One or more tests failed
- `2`: Collection run was interrupted

## Options

Common Newman options:
- `-e, --environment <path>`: Environment file path
- `-r, --reporters <reporters>`: Specify reporters (cli, html, json, junit)
- `-n, --iteration-count <count>`: Number of iterations
- `-d, --data <path>`: Data file for iterations
- `--delay-request <ms>`: Delay between requests
- `--timeout-request <ms>`: Request timeout
- `--bail`: Stop on first failure
- `--verbose`: Verbose output

## Example Commands

```bash
# Run with local environment
newman run Siargao_Trading_Road_API.postman_collection.json \
  -e Siargao_Trading_Road_Local.postman_environment.json

# Run with production environment
newman run Siargao_Trading_Road_API.postman_collection.json \
  -e Siargao_Trading_Road_Production.postman_environment.json \
  -r html \
  --reporter-html-export production-test-report.html

# Run with verbose output and stop on first failure
newman run Siargao_Trading_Road_API.postman_collection.json \
  -e Siargao_Trading_Road_Local.postman_environment.json \
  --verbose \
  --bail
```

