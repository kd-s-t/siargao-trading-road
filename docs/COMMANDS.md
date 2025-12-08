iOS/Android: flutter devices

Android: emulator -list-avds
Android: emulator -avd <avd_name>

iOS: xcrun simctl list devices
iOS: open -a Simulator


Any: flutter run -d <device_id>
Any: flutter run -d <device_id> --dart-define=BASE_URL=http://localhost:<port>
