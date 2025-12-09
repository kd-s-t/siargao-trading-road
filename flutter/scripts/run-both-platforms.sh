#!/bin/bash

cd "$(dirname "$0")/.."

echo "Starting Flutter app on both iOS and Android"
echo "============================================="
echo ""

IOS_DEVICE="51048D9B-F1F7-4519-9AD3-E07EC84A4739"
ANDROID_DEVICE=""

echo "Checking devices..."
flutter devices

echo ""
echo "Waiting for Android emulator..."
for i in {1..30}; do
    ANDROID_DEVICE=$(adb devices | grep emulator | head -1 | awk '{print $1}')
    if [ -n "$ANDROID_DEVICE" ]; then
        echo "✓ Android emulator found: $ANDROID_DEVICE"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 2
done

if [ -z "$ANDROID_DEVICE" ]; then
    echo "⚠ Android emulator not ready. Start manually: emulator -avd Medium_Phone_API_35"
fi

echo ""
echo "============================================="
echo "Run commands:"
echo ""
echo "iOS:"
echo "  flutter run -d $IOS_DEVICE --dart-define=API_URL=http://localhost:3020/api"
echo ""
if [ -n "$ANDROID_DEVICE" ]; then
    echo "Android:"
    echo "  flutter run -d $ANDROID_DEVICE --dart-define=API_URL=http://10.0.2.2:3020/api"
    echo ""
fi
echo "Or run both in separate terminals:"
echo "  Terminal 1: flutter run -d $IOS_DEVICE --dart-define=API_URL=http://localhost:3020/api"
if [ -n "$ANDROID_DEVICE" ]; then
    echo "  Terminal 2: flutter run -d $ANDROID_DEVICE --dart-define=API_URL=http://10.0.2.2:3020/api"
fi
echo ""
