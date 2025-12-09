#!/bin/bash

cd "$(dirname "$0")/.."

echo "FCM Android Testing Setup"
echo "========================="
echo ""

echo "1. Starting Android emulator (if not running)..."
if ! adb devices | grep -q "emulator"; then
    echo "   Starting Medium_Phone_API_35..."
    emulator -avd Medium_Phone_API_35 > /dev/null 2>&1 &
    echo "   Waiting for emulator to boot (30-60 seconds)..."
    
    for i in {1..60}; do
        if adb devices | grep -q "emulator"; then
            DEVICE=$(adb devices | grep emulator | head -1 | awk '{print $1}')
            echo "   ✓ Emulator ready: $DEVICE"
            break
        fi
        sleep 1
    done
else
    DEVICE=$(adb devices | grep emulator | head -1 | awk '{print $1}')
    echo "   ✓ Emulator already running: $DEVICE"
fi

if [ -z "$DEVICE" ]; then
    echo "   ✗ Emulator failed to start"
    exit 1
fi

echo ""
echo "2. Verifying Google Play Services..."
sleep 5
GPS_CHECK=$(adb shell pm list packages | grep -i "com.google.android.gms")
if [ -n "$GPS_CHECK" ]; then
    echo "   ✓ Google Play Services installed"
else
    echo "   ✗ Google Play Services not found"
    exit 1
fi

echo ""
echo "3. Running Flutter app..."
echo "   Watch for 'FCM Token: ...' in the console"
echo ""
flutter run -d $DEVICE --dart-define=API_URL=http://10.0.2.2:3020/api
