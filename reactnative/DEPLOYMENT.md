# Mobile App Deployment

This mobile app is built with Expo and deployed using EAS Build.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```
3. **Login to Expo**:
   ```bash
   eas login
   ```

## Build Profiles

Three build profiles are configured in `eas.json`:

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

## Local Builds

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

### Both Platforms
```bash
npm run build:all
```

## Environment Variables

Set the API URL for production builds:

```bash
export EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

Or create a `.env` file:
```
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

## GitHub Actions

The mobile app builds automatically via GitHub Actions when:
- Pushing to `main` or `develop` branches
- Changes are made to `mobile/**` directory
- Manual workflow dispatch

### Required Secrets

Add these secrets to your GitHub repository:

1. **EXPO_TOKEN**: Your Expo access token
   - Get it from: https://expo.dev/accounts/[your-account]/settings/access-tokens

2. **AWS_ACCESS_KEY_ID**: AWS access key for S3 uploads
   - Create IAM user with S3 write permissions

3. **AWS_SECRET_ACCESS_KEY**: AWS secret key

4. **AWS_REGION**: AWS region (default: `us-east-1`)

5. **S3_MOBILE_BUILDS_BUCKET**: S3 bucket name for mobile builds
   - Created automatically by Terraform: `wholesale-mobile-builds-{environment}`
   - Get from Terraform output: `terraform output mobile_builds_bucket_name`

6. **API_DOMAIN**: Your production API domain (e.g., `api.siargaotradingroad.com`)

7. **API_URL** (optional): Staging API URL for preview builds

### Manual Builds

You can trigger builds manually from GitHub Actions:
1. Go to Actions tab
2. Select "Mobile Build" workflow
3. Click "Run workflow"
4. Choose platform (android/ios/all) and profile (preview/production)

## App Store Submission

### Android (Google Play)

1. Build production APK/AAB:
   ```bash
   eas build --platform android --profile production
   ```

2. Submit to Google Play:
   ```bash
   npm run submit:android
   ```

### iOS (App Store)

1. Build production IPA:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store:
   ```bash
   npm run submit:ios
   ```

## Distribution Methods

### S3 Downloads (Automatic)
Builds are automatically uploaded to S3 after completion:
- **Versioned builds**: `android/wholesale-{version}-{commit}-{timestamp}.apk`
- **Latest builds**: `android/latest.apk` and `ios/latest.ipa`
- **Public URLs**: Direct download links posted in PR comments

Example URLs:
- Android: `https://wholesale-mobile-builds-production.s3.us-east-1.amazonaws.com/android/latest.apk`
- iOS: `https://wholesale-mobile-builds-production.s3.us-east-1.amazonaws.com/ios/latest.ipa`

### Internal Testing
- **S3 Downloads**: Use the latest.apk/latest.ipa links
- **EAS Build**: Download APK/IPA from Expo dashboard
- **TestFlight** (iOS): Submit preview build to TestFlight
- **Firebase App Distribution**: Upload APK/IPA manually

### Production
- **Google Play Store**: Submit via EAS or manually
- **Apple App Store**: Submit via EAS or App Store Connect

## Configuration

### Update API URL

For production builds, update `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-api-domain.com/api"
      }
    }
  }
}
```

### Update Version

Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

## Troubleshooting

### Build Fails
- Check Expo token is valid
- Verify app.json configuration
- Check EAS build logs in Expo dashboard

### API Connection Issues
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Check API server is accessible
- Verify CORS settings on backend

