#!/bin/bash

cd "$(dirname "$0")/.."

echo "Waiting for Android emulator..."
echo "Make sure the emulator window is open and booting"
echo ""

MAX_WAIT=180
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    ANDROID_DEVICE=$(adb devices | grep emulator | head -1 | awk '{print $1}')
    
    if [ -n "$ANDROID_DEVICE" ]; then
        echo "✓ Android emulator found: $ANDROID_DEVICE"
        echo ""
        echo "Verifying Google Play Services..."
        sleep 5
        
        GPS_CHECK=$(adb shell pm list packages | grep -i "com.google.android.gms")
        if [ -n "$GPS_CHECK" ]; then
            echo "✓ Google Play Services ready"
        else
            echo "⚠ Google Play Services not ready yet, but continuing..."
        fi
        
        echo ""
        echo "Running Flutter app..."
        echo "Watch for 'FCM Token: ...' in the console"
        echo ""
        
        flutter run -d $ANDROID_DEVICE --dart-define=API_URL=http://10.0.2.2:3020/api
        exit 0
    fi
    
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "Still waiting... ($WAITED/$MAX_WAIT seconds)"
        echo "Is the emulator window visible? It may take 1-2 minutes to boot."
    fi
done

echo "✗ Android emulator did not appear within $MAX_WAIT seconds"
echo "Please start it manually: emulator -avd Medium_Phone_API_35"
exit 1
