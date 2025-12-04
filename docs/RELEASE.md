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
6. **Android Credentials Setup** - Run this once (interactive):
   ```bash
   cd reactnative
   eas credentials
   ```
   
   When prompted:
   - Select: **Android**
   - Choose: **Set up new credentials** (if you see "You don't have any Android Build Credentials", press any key and select "Set up new credentials")
   - Choose: **Let Expo manage credentials** (recommended for preview builds)
   - This will generate a keystore automatically

## Quick Start

### Build and Release for Android (Local - No Account Required)

```bash
cd reactnative
npm run release:local:android
```

This builds locally using your Android development environment (Android Studio/Gradle) and doesn't require an Expo account.

**Prerequisites for Local Builds:**
- Android Studio installed
- Android SDK configured
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` environment variable set

### Build and Release for Android (EAS Cloud)

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

## Android Build Process

This section details the complete process for building Android APK files.

### Pre-Build Checks

Before building, ensure TypeScript errors are resolved:

```bash
cd reactnative
npm run lint
```

This runs `tsc --noEmit` to check for TypeScript errors. The pre-push hook automatically runs this check.

### Building Android APK with EAS

The recommended method for building Android APKs is using EAS Build (Expo Application Services):

```bash
cd reactnative
eas build --platform android --profile preview --non-interactive
```

**What happens:**
1. EAS compresses and uploads your project files
2. Builds the app in the cloud (no local Android SDK required)
3. Generates a signed APK
4. Provides a download link when complete

**Build Output:**
- Build ID: `90553a72-a99e-4674-93b3-f025bccc1dba` (example)
- Build Page: `https://expo.dev/accounts/{username}/projects/{project}/builds/{build-id}`
- Download URL: `https://expo.dev/artifacts/eas/{artifact-id}.apk`

### Viewing Build Details

To check build status and get download links:

```bash
cd reactnative
eas build:view {BUILD_ID}
```

Example output:
```
ID                       90553a72-a99e-4674-93b3-f025bccc1dba
Platform                 Android
Status                   finished
Profile                  preview
Application Archive URL  https://expo.dev/artifacts/eas/iPJ3SoPGuM9D6fFpgz9Qof.apk
```

### Download Links

EAS provides two types of download links:

1. **Build Page URL** (requires login):
   - Format: `https://expo.dev/accounts/{username}/projects/{project}/builds/{build-id}`
   - Shows build details, logs, and download button
   - May require Expo account login

2. **Direct Artifact URL** (public):
   - Format: `https://expo.dev/artifacts/eas/{artifact-id}.apk`
   - Direct download link, publicly accessible
   - Can be used in landing pages or shared directly
   - **Note**: Each build gets a unique URL (not dynamic)

### Local Android Build (Alternative)

For local builds without EAS account:

```bash
cd reactnative
npm run release:local:android
```

**Prerequisites:**
- Android Studio installed
- Android SDK configured
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` environment variable set
- Java JDK 11 or 17 installed
- `JAVA_HOME` environment variable set

**What the script does:**
1. Auto-detects Android SDK location
2. Auto-detects Java JDK
3. Runs `npx expo prebuild` if needed
4. Builds APK using Gradle: `./gradlew assembleRelease`
5. Copies APK to `builds/android.apk`
6. Optionally uploads to S3

**Common Local Build Issues:**

1. **Gradle Plugin Errors:**
   ```
   Plugin [id: 'expo-module-gradle-plugin'] was not found
   ```
   - Solution: Run `npx expo install --fix` to update dependencies

2. **Java Compiler Not Found:**
   ```
   No Java compiler found, please ensure you are running Gradle with a JDK
   ```
   - Solution: Set `JAVA_HOME` to JDK path (not JRE)
   - macOS: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`

3. **Android SDK Not Found:**
   - Solution: Set `ANDROID_HOME` environment variable
   - macOS default: `~/Library/Android/sdk`
   - Linux default: `~/Android/Sdk`

### TypeScript Validation

Before building, ensure all TypeScript errors are fixed:

```bash
cd reactnative
npm run lint
```

Common issues to check:
- Unclosed JSX tags
- Missing type definitions
- Import errors
- Type mismatches

The pre-push hook automatically runs this check, but you can run it manually before building.

### Build Profiles

Three build profiles are available in `eas.json`:

1. **Development**:
   - Includes development client
   - APK format
   - For local testing

2. **Preview** (recommended for distribution):
   - APK format
   - Internal distribution
   - For testing and sharing

3. **Production**:
   - APK or AAB format
   - Store distribution
   - For Google Play submission

### Troubleshooting Android Builds

#### Build Fails with "Unknown error" in JavaScript Bundle Phase

**Cause**: TypeScript or JavaScript errors in the codebase

**Solution**:
1. Run `npm run lint` to check for TypeScript errors
2. Fix all reported errors
3. Common issues:
   - Unclosed JSX tags (e.g., missing `</View>`)
   - Missing type definitions for props
   - Import path errors

#### Build Fails with Gradle Errors

**Cause**: Native Android project configuration issues

**Solution**:
1. Clean build directories:
   ```bash
   cd reactnative
   rm -rf android/app/build android/.gradle
   ```
2. Update Expo dependencies:
   ```bash
   npx expo install --fix
   ```
3. Rebuild native project:
   ```bash
   npx expo prebuild --clean
   ```

#### EAS Build Succeeds but Local Build Fails

**Recommendation**: Use EAS Build for reliable builds. Local builds require:
- Proper Android SDK setup
- Correct Java/JDK configuration
- All native dependencies properly linked

EAS Build handles all of this automatically in the cloud.

### Download and Distribution

After a successful build, you can:

1. **Download from EAS Dashboard**:
   - Visit the build page URL
   - Click download button
   - Or use the direct artifact URL

2. **Use S3 Latest Link** (if using release script):
   - The release script uploads to S3
   - Latest build: `https://{bucket}.s3.{region}.amazonaws.com/android/latest.apk`
   - This URL is dynamic and always points to the latest build

3. **Share Direct Link**:
   - EAS artifact URLs are publicly accessible
   - Can be shared directly or embedded in landing pages
   - Note: Each build has a unique URL

### Integration with Landing Page

The landing page (`nextjs/app/page.tsx`) is configured to use S3 URLs for downloads:

```typescript
const DOWNLOAD_URLS = {
  android: `${baseUrl}/android/latest.apk`,
  ios: `${baseUrl}/ios/latest.ipa`,
};
```

To use EAS artifact URLs instead, you would need to:
1. Update the URL after each build
2. Or create an API endpoint that fetches the latest build URL from EAS

For dynamic "always latest" downloads, the S3 approach is recommended.

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
  
- `--local` - Build locally without EAS (no account required)
  - Requires Android Studio for Android builds
  - Requires Xcode (macOS) for iOS builds
  
- `--help` - Show help message

### Examples

```bash
# Build Android locally (no account needed)
npm run release:local:android

# Build Android for production (EAS)
npm run release -- --platform android --profile production --environment production

# Build iOS for staging (EAS)
npm run release -- --platform ios --profile preview --environment staging

# Build both platforms for development (EAS)
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

### Android Credentials Not Set Up

If you see:
```
Generating a new Keystore is not supported in --non-interactive mode
Error: build command failed.
```

**Solution:**

You need to set up Android credentials first (one-time setup):

```bash
cd reactnative
eas credentials
```

When prompted:
1. Select **Android**
2. Choose **Set up new credentials** or **Use existing credentials**
3. For preview builds, choose **Let Expo manage credentials** (recommended)
4. This will generate a keystore that Expo manages for you

After credentials are set up, you can run the release script in non-interactive mode.

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

