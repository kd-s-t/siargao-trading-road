# Fixing React Native Worklets Version Mismatch

## Problem

When running the React Native app, you may encounter this error:

```
ERROR [runtime not ready]: WorkletsError: [Worklets] Mismatch between JavaScript part and native part of Worklets (0.7.1 vs 0.5.1).
See `https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting#mismatch-between-javascript-part-and-native-part-of-worklets` for more details.
```

This happens when the JavaScript package version (`react-native-worklets`) doesn't match the native iOS code version. The native code is cached from a previous installation and hasn't been updated.

## Solution

Follow these steps to fix the version mismatch:

### 1. Delete iOS Pods and Podfile.lock

Remove the existing CocoaPods installation:

```bash
cd reactnative
rm -rf ios/Pods ios/Podfile.lock
```

This removes:
- The `Pods` directory containing all installed native dependencies
- The `Podfile.lock` file that locks dependency versions

### 2. Reinstall CocoaPods Dependencies

Reinstall all pods with the correct versions:

```bash
cd reactnative/ios
pod install
```

This will:
- Read the current `package.json` to get the correct `react-native-worklets` version
- Install all native dependencies including `RNWorklets` with the matching version
- Generate a new `Podfile.lock` with the correct versions

### 3. Clean Xcode Build Folder

Clean the Xcode build cache to ensure no old artifacts remain:

```bash
cd reactnative/ios
xcodebuild clean -workspace Siargao.xcworkspace -scheme Siargao
```

Alternatively, you can clean from Xcode:
- Open Xcode
- Go to **Product** → **Clean Build Folder** (or press `Shift + Command + K`)

### 4. Rebuild the App

After completing the above steps, rebuild your app:

```bash
cd reactnative
npm run ios
```

Or if using Expo:

```bash
cd reactnative
npx expo run:ios
```

## Why This Happens

The version mismatch occurs when:
1. The `react-native-worklets` package is updated in `package.json`
2. `npm install` or `yarn install` updates the JavaScript package
3. But the native iOS code (installed via CocoaPods) wasn't rebuilt
4. The old native code (e.g., 0.5.1) conflicts with the new JavaScript code (e.g., 0.7.1)

## Prevention

To avoid this issue in the future:

1. **Always run `pod install` after updating React Native dependencies:**
   ```bash
   cd reactnative/ios
   pod install
   ```

2. **Clean build folder when switching branches or after major dependency updates:**
   ```bash
   cd reactnative/ios
   xcodebuild clean -workspace Siargao.xcworkspace -scheme Siargao
   ```

3. **Use `npx expo install --fix` when updating Expo dependencies:**
   ```bash
   cd reactnative
   npx expo install --fix
   ```

## Quick Reference

Complete fix command sequence:

```bash
# Navigate to reactnative directory
cd reactnative

# Remove old pods
rm -rf ios/Pods ios/Podfile.lock

# Reinstall pods
cd ios
pod install

# Clean Xcode build
xcodebuild clean -workspace Siargao.xcworkspace -scheme Siargao

# Rebuild app
cd ..
npm run ios
```

## React Navigation Drawer with Reanimated 3/4

If you encounter this error after fixing the Worklets version mismatch:

```
ERROR [Error: The `useLegacyImplementation` prop is not available with Reanimated 3 as it no longer includes support for Reanimated 1 legacy API. Remove the `useLegacyImplementation` prop from `Drawer.Navigator` to be able to use it.]
```

**The Issue:**
The `@react-navigation/drawer` library auto-detects whether to use legacy implementation by checking if Reanimated is configured. If it's not detected properly, it defaults to legacy mode, which Reanimated 3/4 doesn't support.

**The Fix:**
Explicitly set `useLegacyImplementation={false}` on all `Drawer.Navigator` components in `App.tsx`:

```tsx
<Drawer.Navigator
  useLegacyImplementation={false}
  drawerContent={(props) => <DrawerContent {...props} />}
  // ... other props
>
```

This overrides the auto-detection and forces the drawer to use the modern Reanimated 3/4 implementation.

**Why it keeps coming back:**
- The drawer navigator auto-detects legacy mode if Reanimated isn't properly initialized
- Metro bundler cache might not be cleared
- The app needs a full rebuild after dependency changes

**Complete fix steps:**
1. Add `import 'react-native-reanimated';` at the top of `App.tsx` (after gesture-handler)
2. Set `useLegacyImplementation={false}` on all drawer navigators
3. Clear Metro cache: `npx expo start --clear`
4. Rebuild iOS app: `npx expo run:ios`

## Related Documentation

- [React Native Worklets Troubleshooting](https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting#mismatch-between-javascript-part-and-native-part-of-worklets)
- [Mobile App Release Guide](./RELEASE.md)
- [Tech Stack](./TECH_STACK.md)
