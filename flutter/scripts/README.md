# Flutter Scripts

This directory contains Flutter-specific utility and testing scripts.

## Scripts

### FCM (Firebase Cloud Messaging) Testing

- **`check-fcm-setup.sh`** - Checks FCM setup for local development
  - Verifies Google Play Services, Play Store, and FCM connectivity
  - Usage: `./flutter/scripts/check-fcm-setup.sh`

- **`test-fcm-android.sh`** - Tests FCM on Android emulator
  - Starts emulator, verifies setup, and runs Flutter app
  - Usage: `./flutter/scripts/test-fcm-android.sh`

- **`wait-and-run-android.sh`** - Waits for Android emulator and runs Flutter app
  - Automatically detects when emulator is ready
  - Usage: `./flutter/scripts/wait-and-run-android.sh`

### Platform Testing

- **`run-both-platforms.sh`** - Helper script to run on both iOS and Android
  - Shows commands for running on both platforms
  - Usage: `./flutter/scripts/run-both-platforms.sh`

- **`run-ios-both.sh`** - Runs Flutter app on both iOS simulators
  - Usage: `./flutter/scripts/run-ios-both.sh`

### Build & Deployment

- **`build-and-upload.sh`** - Builds Flutter app and uploads to S3
  - Usage: `./flutter/scripts/build-and-upload.sh [options]`
  - See script for full options

### E2E Testing

- **`test-prod-flow.sh`** - End-to-end production test flow
  - Tests complete order lifecycle: register supplier → add products → register store → create order → submit → status updates → payment
  - Usage: `./flutter/scripts/test-prod-flow.sh [--environment local|prod] [--url URL]`
  - Example: `./flutter/scripts/test-prod-flow.sh --environment prod`

## Usage

All scripts should be run from the project root directory:

```bash
# From project root
./flutter/scripts/test-prod-flow.sh

# Or with full path
bash flutter/scripts/test-prod-flow.sh
```

## Notes

- FCM scripts require Android emulator with Google Play Services
- iOS simulators cannot receive real FCM push notifications (requires physical device)
- Test scripts use unique timestamps to avoid conflicts
