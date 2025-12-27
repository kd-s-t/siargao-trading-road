# iOS/Android: flutter devices  

# Android
```bash
emulator -list-avds
emulator -avd Medium_Phone_API_35
emulator -avd Pixel_Tablet_API_35
flutter run -d "emulator-5554"
flutter run -d "emulator-5554" --dart-define=API_URL=http://10.0.2.2:3020/api
flutter run -d "emulator-5554" --dart-define=API_URL=http://ec2-44-192-83-29.compute-1.amazonaws.com/api
```

## iOS
```bash
xcrun simctl list devices
open -a Simulator
flutter run -d "51048D9B-F1F7-4519-9AD3-E07EC84A4739"
flutter run -d "51048D9B-F1F7-4519-9AD3-E07EC84A4739" --dart-define=API_URL=http://ec2-44-192-83-29.compute-1.amazonaws.com/api

```

```bash
flutter devices
flutter run -d <device_id>
flutter run -d <device_id> --dart-define=API_URL=http://10.0.2.2:3020/api
```