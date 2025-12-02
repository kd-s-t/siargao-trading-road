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
LOCAL_BUILD=false

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
    --local)
      LOCAL_BUILD=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --platform PLATFORM    Platform to build (android, ios, all) [default: all]"
      echo "  --profile PROFILE      Build profile (development, preview, production) [default: preview]"
      echo "  --environment ENV       Environment (development, staging, production) [default: development]"
      echo "  --region REGION        AWS region [default: us-east-1]"
      echo "  --local                Build locally without EAS (requires Android Studio/Xcode) [default: false]"
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
echo "Build Mode:  $([ "$LOCAL_BUILD" = true ] && echo "Local" || echo "EAS Cloud")"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI is not installed${NC}"
  echo "Install it with: brew install awscli (macOS) or apt-get install awscli (Linux)"
  exit 1
fi

# Check EAS requirements only if not building locally
if [ "$LOCAL_BUILD" = false ]; then
  # Check if EAS CLI is installed
  if ! command -v eas &> /dev/null; then
    echo -e "${RED}Error: EAS CLI is not installed${NC}"
    echo "Install it with: npm install -g eas-cli"
    echo "Or use --local flag to build locally without EAS"
    exit 1
  fi

  # Check if logged in to EAS
  if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to EAS. Please login...${NC}"
    eas login
  fi
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
  local OUTPUT
  local EXT
  local S3_PREFIX
  
  echo -e "${GREEN}🔨 Building for $platform...${NC}"
  
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
  
  if [ "$LOCAL_BUILD" = true ]; then
    # Local build using Expo
    echo -e "${GREEN}🔨 Building locally (no EAS account required)...${NC}"
    
    if [ "$platform" == "android" ]; then
      # Auto-detect Android SDK if not set
      if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        if [ -d "$HOME/Library/Android/sdk" ]; then
          export ANDROID_HOME="$HOME/Library/Android/sdk"
          export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
          echo -e "${GREEN}✓ Auto-detected Android SDK: $ANDROID_HOME${NC}"
        elif [ -d "$HOME/Android/Sdk" ]; then
          export ANDROID_HOME="$HOME/Android/Sdk"
          export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
          echo -e "${GREEN}✓ Auto-detected Android SDK: $ANDROID_HOME${NC}"
        else
          echo -e "${RED}Error: Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT${NC}"
          echo "Or install Android Studio and configure the SDK"
          exit 1
        fi
      fi
      
      # Build Android APK locally using Gradle directly
      echo "Building Android APK..."
      
      # Ensure native Android project exists
      if [ ! -d "android" ]; then
        echo "Creating native Android project..."
        npx expo prebuild --platform android
      fi
      
      # Build release APK using Gradle
      cd android
      ./gradlew assembleRelease
      cd ..
      
      # Find the APK file
      APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" 2>/dev/null | head -1)
      
      if [ -z "$APK_PATH" ]; then
        echo -e "${RED}Error: APK not found. Build may have failed.${NC}"
        echo "Check the build output above for errors."
        exit 1
      fi
      
      # Copy APK to builds directory
      cp "$APK_PATH" "$OUTPUT"
      echo -e "${GREEN}✅ Build completed: $APK_PATH${NC}"
      
    else
      # iOS local build (macOS only)
      if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${RED}Error: iOS builds require macOS${NC}"
        exit 1
      fi
      
      # Check if Xcode is available
      if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}Error: Xcode not found. Install Xcode from App Store${NC}"
        exit 1
      fi
      
      # Build iOS IPA locally
      echo "Building iOS IPA..."
      npx expo run:ios --configuration Release --no-install
      
      # Find the IPA file (this is more complex for iOS)
      # For now, we'll need to build and archive manually or use a different approach
      echo -e "${YELLOW}Note: iOS local builds require additional setup.${NC}"
      echo "Consider using EAS Build for iOS or building manually in Xcode."
      exit 1
    fi
    
  else
    # EAS Cloud build
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
    
    # Download build
    echo -e "${GREEN}📥 Downloading build...${NC}"
    eas build:download --id "$build_id" --output "$OUTPUT" --non-interactive
  fi
  
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

