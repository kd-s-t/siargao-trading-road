# React Native Mobile App

React Native mobile application for Siargao Trading Road wholesale marketplace. Built with Expo, React Navigation, and Material Design UI.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (can use npx, no global install needed)
- Backend API running on `http://localhost:3020`
- For iOS development: macOS with Xcode (iOS Simulator)
- For Android development: Android Studio with Android SDK and emulator, or physical Android device
- For physical device testing: Expo Go app installed on your device

## Quick Start

1. **Install dependencies:**
```bash
cd reactnative
npm install
```

2. **Start the development server:**
```bash
npm start
```

3. **Run on your preferred platform:**
   - Press `i` in the terminal to open iOS Simulator
   - Press `a` in the terminal to open Android Emulator
   - Scan the QR code with Expo Go app on your physical device

## Environment Variables

Create a `.env` file in the `reactnative` directory:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3020/api
```

### For Physical Devices

When testing on a physical device, use your computer's local IP address instead of `localhost`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3020/api
```

To find your local IP address:
- **macOS/Linux:** Run `ifconfig` or `ip addr` and look for your network interface
- **Windows:** Run `ipconfig` and look for IPv4 Address

### Production Environment

For production builds, update the API URL to your production backend:

```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Start and open iOS Simulator
- `npm run android` - Start and open Android Emulator
- `npm run web` - Start web version (for testing)
- `npm run build:android` - Build Android APK/AAB using EAS Build
- `npm run build:ios` - Build iOS app using EAS Build
- `npm run build:all` - Build for both platforms
- `npm run submit:android` - Submit Android build to Play Store
- `npm run submit:ios` - Submit iOS build to App Store
- `npm run storybook` - Start Storybook for component development and testing

## Running on Different Platforms

### iOS Simulator (macOS only)

```bash
npm run ios
```

Requires:
- macOS
- Xcode installed and fully configured
- iOS Simulator runtime installed

**First-time Setup:**

1. **Install Xcode** from the App Store if not already installed

2. **Set Xcode Developer Path:**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

3. **Install iOS Simulator Runtime:**
   ```bash
   xcodebuild -downloadPlatform iOS
   ```
   This will download the iOS Simulator runtime (approximately 8GB). The first time may take a while.

4. **Verify Setup:**
   ```bash
   xcrun simctl list devices
   ```
   This should show available iOS simulators.

**Note:** If you see "No iOS devices available in Simulator.app", you need to install the iOS Simulator runtime using the command above.

### Android Emulator

```bash
npm run android
```

Requires:
- Android Studio installed
- Android SDK configured
- Android Virtual Device (AVD) created

### Physical Device

1. Install Expo Go app from App Store (iOS) or Play Store (Android)
2. Start the development server: `npm start`
3. Scan the QR code displayed in the terminal with:
   - **iOS:** Camera app
   - **Android:** Expo Go app

### Web Browser

```bash
npm run web
```

Opens the app in your default web browser for testing.

## Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure build:**
```bash
eas build:configure
```

4. **Build for your platform:**
```bash
npm run build:android
npm run build:ios
npm run build:all
```

Build configuration is stored in `eas.json`. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Local Builds

For local Android builds, you can use:
```bash
npx expo run:android
```

For local iOS builds (macOS only):
```bash
npx expo run:ios
```

## Project Structure

```
reactnative/
├── assets/              # Images, icons, splash screens
├── contexts/            # React contexts (AuthContext)
├── lib/                 # API client libraries
│   ├── api.ts          # Base API configuration
│   ├── auth.ts         # Authentication functions
│   ├── orders.ts       # Order management
│   ├── products.ts     # Product management
│   └── suppliers.ts    # Supplier management
├── screens/            # Screen components
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ProductsScreen.tsx
│   ├── OrdersScreen.tsx
│   └── ...
├── App.tsx             # Main app component
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
└── package.json        # Dependencies and scripts
```

## Features

### Authentication
- Login/Logout with JWT tokens
- Secure token storage using AsyncStorage
- Automatic token refresh
- Protected routes

### User Roles
- **Supplier:** Manage products, view orders, track inventory
- **Store:** Browse suppliers, add to cart, place orders

### Core Features
- Product browsing and search
- Shopping cart management
- Order placement and tracking
- Supplier selection
- User profile management
- Material Design UI with React Native Paper

## Storybook

This project uses [Storybook](https://storybook.js.org/) for component development and testing. Storybook allows you to develop and test UI components in isolation.

### Running Storybook

```bash
npm run storybook
```

Storybook runs on port **7007** at `http://localhost:7007`.

This will start the Storybook server where you can:
- View and interact with components in isolation
- Test different component states and props
- Document component usage and examples
- Develop components without running the full app

### Available Component Stories

- **Buttons** - All variants (contained, outlined, text), sizes, states, with icons, login buttons
- **Headers** - Admin, Store, Supplier headers with different colors, products header
- **Logo** - Different sizes and background contexts
- **Tables/Cards** - Products list, orders list with status chips, empty states
- **Navigation** - Admin, Store, and Supplier navigation drawers

### Creating Stories

Stories are located alongside their components. For example, `LoginScreen.stories.tsx` is located in the `screens/` directory alongside `LoginScreen.tsx`.

To create a new story:

1. Create a `.stories.tsx` file next to your component
2. Import your component and Storybook types
3. Define the meta configuration and stories

Example:
```typescript
import type { Meta, StoryObj } from '@storybook/react-native';
import MyComponent from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {};
```

## React Native Paper

This project uses [React Native Paper](https://reactnativepaper.com/) as the UI component library. React Native Paper is a high-quality, standard-compliant Material Design library that provides:

### Features

- **Material Design 3 (Material You) Support** - Latest Material Design standards with customizable colors, typography, and animations
- **Platform Adaptation** - Components automatically adapt to iOS and Android design guidelines
- **Full Theming Support** - Easy customization of colors, typography, and component styles
- **Accessibility** - Built-in support for screen readers and accessibility standards
- **RTL Support** - Right-to-left language support
- **55,000+ Weekly Downloads** - Actively maintained and widely used

### Key Components Used

- `Button` - Material Design buttons with multiple variants
- `TextInput` - Text input fields with outlined and flat modes
- `Card` - Material Design cards for content containers
- `List` - Lists with icons, avatars, and actions
- `Dialog` - Modal dialogs and alerts
- `Snackbar` - Toast notifications
- `Appbar` - App bars and navigation headers
- `FAB` - Floating action buttons
- And many more Material Design components

### Documentation

For complete component documentation and examples, visit:
- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [React Native Paper Website](https://reactnativepaper.com/)

## Troubleshooting

### Metro Bundler Issues

If you encounter bundler errors, try:
```bash
npm start -- --reset-cache
```

### iOS Build Issues

**Xcode Path Configuration:**
- Ensure Xcode developer path is set correctly:
  ```bash
  sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
  ```
- Verify with: `xcode-select -p` (should show `/Applications/Xcode.app/Contents/Developer`)

**iOS Simulator Not Available:**
- Install iOS Simulator runtime: `xcodebuild -downloadPlatform iOS`
- Verify simulators are available: `xcrun simctl list devices`

**Package Version Mismatches:**
- If Expo reports package version mismatches, ensure you have the correct versions:
  - `@react-native-async-storage/async-storage`: 1.23.1
  - `expo-asset`: ~11.0.5
  - `react-native`: 0.76.9
- Run `npm install` to ensure all dependencies are correctly installed

**Other Issues:**
- Ensure Xcode Command Line Tools are installed: `xcode-select --install`
- Clean build folder: `cd ios && xcodebuild clean`
- Open Xcode at least once to accept license agreements

### Android Build Issues

- Ensure Android SDK is properly configured
- Check that `ANDROID_HOME` environment variable is set
- Verify Java/JDK is installed and configured

### Network Connection Issues

- Ensure backend API is running and accessible
- For physical devices, verify both device and computer are on the same network
- Check firewall settings if connection fails

### Expo Go App Issues

- Update Expo Go app to the latest version
- Clear Expo Go app cache
- Restart the development server

## Tech Stack

- **Expo** ~52.0.0 - Development platform and tooling
- **React Native** 0.76.9 - Mobile framework
- **React Navigation** - Navigation library
- **React Native Paper** ^5.12.3 - Material Design 3 component library
- **Storybook** ^8.6.4 - Component development and testing tool
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **AsyncStorage** - Local storage

## Development Tips

1. **Hot Reload:** Changes are automatically reflected. Shake device or press `r` in terminal to reload.

2. **Debugging:** 
   - Press `j` to open React Native Debugger
   - Use `console.log()` statements (visible in terminal)
   - React DevTools available in Expo Go

3. **Testing on Multiple Devices:** You can run the dev server once and connect multiple devices by scanning the QR code.

4. **Environment Variables:** Remember to restart the dev server after changing `.env` file.

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [React Native Paper Website](https://reactnativepaper.com/)
- [Storybook Documentation](https://storybook.js.org/)
- [Storybook for React Native](https://storybook.js.org/docs/react-native/get-started/introduction)
