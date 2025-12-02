# Mobile App Release Guide

This guide explains how to build and release the Siargao Trading Road mobile app for Android and iOS.

## Prerequisites

Before you can release the mobile app, ensure you have:

1. **Node.js 18+** installed
2. **EAS CLI** installed globally:
   ```bash
   npm install -g eas-cli
   ```
3. **AWS CLI** installed and configured:
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   apt-get install awscli
   
   # Configure AWS credentials
   aws configure
   ```
4. **Expo Account** - Sign up at [expo.dev](https://expo.dev) if you don't have one
5. **EAS Project Initialized** - Run this once:
   ```bash
   cd reactnative
   eas login
   eas init
   ```

## Quick Start

### Build and Release for Android

```bash
cd reactnative
npm run release -- --platform android --profile preview
```

### Build and Release for iOS

```bash
cd reactnative
npm run release -- --platform ios --profile preview
```

### Build and Release for Both Platforms

```bash
cd reactnative
npm run release
```

## Release Script Options

The `npm run release` command supports the following options:

```bash
npm run release [OPTIONS]
```

### Options

- `--platform PLATFORM` - Platform to build (`android`, `ios`, or `all`)
  - Default: `all`
  
- `--profile PROFILE` - Build profile (`development`, `preview`, or `production`)
  - Default: `preview`
  
- `--environment ENV` - Environment (`development`, `staging`, or `production`)
  - Default: `development`
  
- `--region REGION` - AWS region for S3 upload
  - Default: `us-east-1`
  
- `--help` - Show help message

### Examples

```bash
# Build Android for production
npm run release -- --platform android --profile production --environment production

# Build iOS for staging
npm run release -- --platform ios --profile preview --environment staging

# Build both platforms for development
npm run release -- --profile development
```

## Build Profiles

### Development
- For local development and testing
- Includes development client
- Android: APK format
- iOS: Simulator builds

### Preview
- For internal testing and distribution
- Android: APK format
- iOS: Device builds (not simulator)
- Distribution: Internal (via EAS)

### Production
- For app store submission
- Android: APK/AAB format
- iOS: App Store builds
- Distribution: Store (Google Play / App Store)

## What the Release Script Does

1. **Validates Prerequisites**
   - Checks if EAS CLI is installed
   - Checks if AWS CLI is installed
   - Verifies EAS login status

2. **Builds the App**
   - Uses EAS Build service to compile the app
   - Waits for build completion
   - Downloads the build artifact

3. **Uploads to S3**
   - Uploads to two locations:
     - **Versioned**: `{platform}/siargao-trading-road-{version}-{commit}-{timestamp}.{ext}`
     - **Latest**: `{platform}/latest.{ext}` (always points to newest build)

4. **Provides Download URLs**
   - Prints versioned download URL
   - Prints latest download URL (used by landing page)

## S3 Bucket Structure

Builds are uploaded to:
```
s3://siargaotradingroad-mobile-builds-{environment}/
├── android/
│   ├── latest.apk (always latest)
│   └── siargao-trading-road-1.0.0-abc1234-20251202-143022.apk (versioned)
└── ios/
    ├── latest.ipa (always latest)
    └── siargao-trading-road-1.0.0-abc1234-20251202-143022.ipa (versioned)
```

## Environment Configuration

The release script automatically determines the S3 bucket based on the environment:

- **Development**: `siargaotradingroad-mobile-builds-development`
- **Staging**: `siargaotradingroad-mobile-builds-staging`
- **Production**: `siargaotradingroad-mobile-builds-production`

## Landing Page Integration

The landing page automatically uses the "latest" URLs, so you don't need to update links after each release:

- **Android**: `https://siargaotradingroad-mobile-builds-{environment}.s3.{region}.amazonaws.com/android/latest.apk`
- **iOS**: `https://siargaotradingroad-mobile-builds-{environment}.s3.{region}.amazonaws.com/ios/latest.ipa`

These URLs are configured via environment variables in the Next.js app:
- `NEXT_PUBLIC_ENVIRONMENT` (default: `development`)
- `NEXT_PUBLIC_AWS_REGION` (default: `us-east-1`)

## Troubleshooting

### EAS Project Not Configured

If you see:
```
EAS project not configured.
Must configure EAS project by running 'eas init'
```

**Solution:**
```bash
cd reactnative
eas login
eas init
```

When prompted:
- Choose to create a new project
- Select your Expo account
- The project will be created and linked automatically

### Invalid UUID appId Error

If you see:
```
Invalid UUID appId
Error: GraphQL request failed.
```

**Solution:**

1. Remove the invalid projectId from `app.json`:
   ```bash
   # Remove the "extra.eas.projectId" field from app.json
   ```

2. Re-initialize the EAS project:
   ```bash
   cd reactnative
   eas init
   ```

3. When prompted, choose to create a new project (not link to existing)

4. EAS will automatically add the correct UUID projectId to your `app.json`

### Not Logged In to EAS

If you see:
```
Not logged in to EAS. Please login...
```

**Solution:**
```bash
eas login
```

### AWS CLI Not Configured

If you see:
```
Error: AWS CLI is not installed
```

**Solution:**
```bash
# Install AWS CLI
brew install awscli  # macOS
apt-get install awscli  # Linux

# Configure credentials
aws configure
```

### Build Fails

Common issues:
- **Missing credentials**: Ensure EAS is logged in and AWS credentials are configured
- **Network issues**: Check your internet connection
- **EAS quota**: Check your Expo account limits

## Manual Release Process

If you prefer to build manually without the script:

1. **Build with EAS:**
   ```bash
   cd reactnative
   eas build --platform android --profile preview
   ```

2. **Wait for build and get build ID:**
   ```bash
   eas build:wait --id <BUILD_ID>
   ```

3. **Download build:**
   ```bash
   eas build:download --id <BUILD_ID> --output ./builds/android.apk
   ```

4. **Upload to S3:**
   ```bash
   aws s3 cp ./builds/android.apk s3://siargaotradingroad-mobile-builds-development/android/latest.apk
   ```

## CI/CD Integration

The release process can be automated via GitHub Actions. See `.github/workflows/mobile-build.yml` for the automated build workflow.

## Related Documentation

- [Mobile App Deployment](./reactnative/DEPLOYMENT.md) - Detailed deployment guide
- [EC2 Setup](./EC2_SETUP.md) - Server setup instructions
- [Tech Stack](./TECH_STACK.md) - Technology overview

