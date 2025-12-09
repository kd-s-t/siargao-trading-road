#!/bin/bash

echo "Checking FCM Setup for Local Development"
echo "========================================"
echo ""

echo "1. Checking if emulator is running..."
if adb devices | grep -q "emulator"; then
    DEVICE=$(adb devices | grep emulator | head -1 | awk '{print $1}')
    echo "   ✓ Emulator found: $DEVICE"
else
    echo "   ✗ No emulator running. Start with: emulator -avd Medium_Phone_API_35"
    exit 1
fi

echo ""
echo "2. Checking Google Play Services..."
GPS_PACKAGE=$(adb shell pm list packages | grep -i "com.google.android.gms" | head -1)
if [ -n "$GPS_PACKAGE" ]; then
    echo "   ✓ Google Play Services found: $GPS_PACKAGE"
    
    GPS_VERSION=$(adb shell dumpsys package com.google.android.gms | grep versionName | head -1 | awk -F'=' '{print $2}')
    echo "   ✓ Version: $GPS_VERSION"
else
    echo "   ✗ Google Play Services not found!"
    echo "   This means you're using AOSP image, not Google Play image"
    exit 1
fi

echo ""
echo "3. Checking Play Store..."
PLAY_STORE=$(adb shell pm list packages | grep -i "com.android.vending")
if [ -n "$PLAY_STORE" ]; then
    echo "   ✓ Play Store found"
else
    echo "   ✗ Play Store not found!"
    echo "   You need a Google Play system image, not AOSP"
    exit 1
fi

echo ""
echo "4. Checking if Google Play Services is enabled..."
GPS_ENABLED=$(adb shell pm list packages -e | grep -i "com.google.android.gms")
if [ -n "$GPS_ENABLED" ]; then
    echo "   ✓ Google Play Services is enabled"
else
    echo "   ✗ Google Play Services is disabled"
    echo "   Enable it in: Settings → Apps → Google Play Services"
    exit 1
fi

echo ""
echo "5. Testing FCM connectivity..."
echo "   Run your Flutter app and check logs for FCM token"
echo "   Look for: 'FCM Token: <token>' in the console"

echo ""
echo "========================================"
echo "Setup looks good! Next steps:"
echo "1. Run: cd flutter && flutter run -d $DEVICE"
echo "2. Check console for FCM token"
echo "3. Test notification using Firebase Console or curl"
echo ""
