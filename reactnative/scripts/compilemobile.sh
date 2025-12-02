#!/bin/bash

# Mobile SDK Compilation and S3 Upload Script
# This script builds the mobile app using EAS and uploads to S3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PLATFORM="all"
PROFILE="preview"
ENVIRONMENT="development"
AWS_REGION="us-east-1"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --platform PLATFORM    Platform to build (android, ios, all) [default: all]"
      echo "  --profile PROFILE      Build profile (development, preview, production) [default: preview]"
      echo "  --environment ENV       Environment (development, staging, production) [default: development]"
      echo "  --region REGION        AWS region [default: us-east-1]"
      echo "  --help                 Show this help message"
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

# Validate platform
if [[ ! "$PLATFORM" =~ ^(android|ios|all)$ ]]; then
  echo -e "${RED}Error: Platform must be 'android', 'ios', or 'all'${NC}"
  exit 1
fi

# Validate profile
if [[ ! "$PROFILE" =~ ^(development|preview|production)$ ]]; then
  echo -e "${RED}Error: Profile must be 'development', 'preview', or 'production'${NC}"
  exit 1
fi

# Set S3 bucket name
S3_BUCKET="siargaotradingroad-mobile-builds-${ENVIRONMENT}"

echo -e "${GREEN}🚀 Mobile SDK Compilation and Upload${NC}"
echo "=========================================="
echo "Platform:    $PLATFORM"
echo "Profile:     $PROFILE"
echo "Environment: $ENVIRONMENT"
echo "S3 Bucket:   $S3_BUCKET"
echo "AWS Region:  $AWS_REGION"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
  echo -e "${RED}Error: EAS CLI is not installed${NC}"
  echo "Install it with: npm install -g eas-cli"
  exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI is not installed${NC}"
  echo "Install it with: brew install awscli (macOS) or apt-get install awscli (Linux)"
  exit 1
fi

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
  echo -e "${YELLOW}Not logged in to EAS. Please login...${NC}"
  eas login
fi

# Create builds directory
mkdir -p builds

# Get version and commit info
VERSION=$(node -p "require('./app.json').expo.version")
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}📦 Building mobile app...${NC}"
echo "Version: $VERSION"
echo "Commit:  $COMMIT_SHA"
echo ""

# Function to build and upload for a platform
build_and_upload() {
  local platform=$1
  local build_id
  
  echo -e "${GREEN}🔨 Building for $platform...${NC}"
  
  # Build using EAS
  BUILD_OUTPUT=$(eas build --platform "$platform" \
    --profile "$PROFILE" \
    --non-interactive \
    --json)
  
  build_id=$(echo "$BUILD_OUTPUT" | jq -r '.id')
  
  if [ -z "$build_id" ] || [ "$build_id" == "null" ]; then
    echo -e "${RED}Error: Failed to get build ID${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Build started: $build_id${NC}"
  echo "Waiting for build to complete..."
  
  # Wait for build to complete
  eas build:wait --id "$build_id" --non-interactive
  
  echo -e "${GREEN}✅ Build completed: $build_id${NC}"
  
  # Determine file extension and output path
  if [ "$platform" == "android" ]; then
    EXT="apk"
    OUTPUT="./builds/android.apk"
    S3_PREFIX="android"
  else
    EXT="ipa"
    OUTPUT="./builds/ios.ipa"
    S3_PREFIX="ios"
  fi
  
  # Download build
  echo -e "${GREEN}📥 Downloading build...${NC}"
  eas build:download --id "$build_id" --output "$OUTPUT" --non-interactive
  
  # Upload to S3
  S3_KEY="${S3_PREFIX}/siargao-trading-road-${VERSION}-${COMMIT_SHA}-${TIMESTAMP}.${EXT}"
  S3_KEY_LATEST="${S3_PREFIX}/latest.${EXT}"
  
  echo -e "${GREEN}☁️  Uploading to S3...${NC}"
  echo "  Versioned: s3://${S3_BUCKET}/${S3_KEY}"
  echo "  Latest:     s3://${S3_BUCKET}/${S3_KEY_LATEST}"
  
  aws s3 cp "$OUTPUT" "s3://${S3_BUCKET}/${S3_KEY}" --region "$AWS_REGION"
  aws s3 cp "$OUTPUT" "s3://${S3_BUCKET}/${S3_KEY_LATEST}" --region "$AWS_REGION"
  
  # Generate URLs
  DOWNLOAD_URL="https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${S3_KEY}"
  LATEST_URL="https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${S3_KEY_LATEST}"
  
  echo ""
  echo -e "${GREEN}✅ Upload complete!${NC}"
  echo "  Download URL: $DOWNLOAD_URL"
  echo "  Latest URL:    $LATEST_URL"
  echo ""
}

# Build based on platform
if [ "$PLATFORM" == "all" ]; then
  build_and_upload "android"
  build_and_upload "ios"
else
  build_and_upload "$PLATFORM"
fi

echo -e "${GREEN}🎉 All builds completed and uploaded!${NC}"

