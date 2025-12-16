#!/bin/bash

# Flutter APK Build and S3 Upload Script
# This script builds the Flutter app with production API URL and uploads to S3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
AWS_REGION="us-east-1"
API_URL="http://ec2-44-192-83-29.compute-1.amazonaws.com/api"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --environment ENV    Environment (development, staging, production) [default: production]"
      echo "  --region REGION     AWS region [default: us-east-1]"
      echo "  --api-url URL       API URL to use [default: http://ec2-44-192-83-29.compute-1.amazonaws.com/api]"
      echo "  --help              Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Set S3 bucket name
S3_BUCKET="siargaotradingroad-mobile-builds-${ENVIRONMENT}"

echo -e "${GREEN}Flutter APK Build and Upload${NC}"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "S3 Bucket:   $S3_BUCKET"
echo "AWS Region:  $AWS_REGION"
echo "API URL:     $API_URL"
echo ""

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
  if [ -f "/Users/sharkysharksharks/flutter/bin/flutter" ]; then
    FLUTTER_CMD="/Users/sharkysharksharks/flutter/bin/flutter"
    echo -e "${GREEN}✓ Using Flutter at: $FLUTTER_CMD${NC}"
  else
    echo -e "${RED}Error: Flutter is not installed or not in PATH${NC}"
    echo "Install Flutter from: https://flutter.dev/docs/get-started/install"
    exit 1
  fi
else
  FLUTTER_CMD="flutter"
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI is not installed${NC}"
  echo "Install it with: brew install awscli (macOS) or apt-get install awscli (Linux)"
  exit 1
fi

# Get version and commit info
VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //' | tr -d ' ')
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}Building Flutter APK...${NC}"
echo "Version: $VERSION"
echo "Commit:  $COMMIT_SHA"
echo ""

# Build APK with production API URL
echo -e "${GREEN}Building APK with API URL: $API_URL${NC}"
$FLUTTER_CMD build apk --release --dart-define=API_URL="$API_URL"

# Find the APK file
APK_PATH="build/app/outputs/flutter-apk/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
  echo -e "${RED}Error: APK not found at $APK_PATH${NC}"
  echo "Build may have failed. Check the output above for errors."
  exit 1
fi

echo -e "${GREEN}Build completed: $APK_PATH${NC}"

# Upload to S3
S3_KEY="android/siargao-trading-road-${VERSION}-${COMMIT_SHA}-${TIMESTAMP}.apk"
S3_KEY_LATEST="android/latest.apk"

echo ""
echo -e "${GREEN}Uploading to S3...${NC}"
echo "  Versioned: s3://${S3_BUCKET}/${S3_KEY}"
echo "  Latest:     s3://${S3_BUCKET}/${S3_KEY_LATEST}"

aws s3 cp "$APK_PATH" "s3://${S3_BUCKET}/${S3_KEY}" --region "$AWS_REGION" --profile 38park2309
aws s3 cp "$APK_PATH" "s3://${S3_BUCKET}/${S3_KEY_LATEST}" --region "$AWS_REGION" --profile 38park2309

# Generate URLs
DOWNLOAD_URL="https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${S3_KEY}"
LATEST_URL="https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${S3_KEY_LATEST}"

echo ""
echo -e "${GREEN}Upload complete!${NC}"
echo "  Download URL: $DOWNLOAD_URL"
echo "  Latest URL:    $LATEST_URL"
echo ""
echo -e "${GREEN}Build and upload completed!${NC}"
