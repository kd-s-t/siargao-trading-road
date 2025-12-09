#!/bin/bash

cd "$(dirname "$0")/.."

IOS_16E="51048D9B-F1F7-4519-9AD3-E07EC84A4739"
IOS_17_PRO="B4DAA5A1-D7D8-4014-B4B8-1A00BBD1D17E"
API_URL="http://localhost:3020/api"

echo "Running Flutter app on both iOS simulators"
echo "=========================================="
echo ""

echo "Starting iPhone 16e in background..."
flutter run -d $IOS_16E --dart-define=API_URL=$API_URL &
IOS_16E_PID=$!

echo "Starting iPhone 17 Pro..."
flutter run -d $IOS_17_PRO --dart-define=API_URL=$API_URL

wait $IOS_16E_PID
