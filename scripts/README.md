# Scripts Directory

This directory contains infrastructure and deployment utility scripts for the Siargao Trading Road project.

## Scripts

### AWS & Infrastructure

- **`add-aws-credentials-to-ssm.sh`** - Adds AWS credentials to AWS Systems Manager Parameter Store
  - Usage: `AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx ./scripts/add-aws-credentials-to-ssm.sh`

- **`check-server-status.sh`** - Checks the status of the server/API
  - Usage: `./scripts/check-server-status.sh`

- **`fix-502.sh`** - Fixes 502 errors (likely related to server/nginx issues)
  - Usage: `./scripts/fix-502.sh`

- **`verify-ssm-parameters.sh`** - Verifies SSM parameters are correctly set
  - Usage: `./scripts/verify-ssm-parameters.sh`

## Usage

All scripts should be run from the project root directory:

```bash
# From project root
./scripts/add-aws-credentials-to-ssm.sh

# Or with full path
bash scripts/add-aws-credentials-to-ssm.sh
```

## Notes

- Most scripts require appropriate environment variables or AWS credentials
- These scripts are for infrastructure/deployment management
- For API testing scripts, see `golang/scripts/`
- For Flutter scripts, see `flutter/scripts/`
