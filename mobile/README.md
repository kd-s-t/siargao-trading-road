# Wholesale Mobile App

React Native mobile app for the Wholesale platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Environment Variables

Create a `.env` file in the mobile directory:
```
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

For physical devices, use your computer's IP address:
```
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:8080/api
```

## Features

- Login/Logout authentication
- JWT token management
- User profile display
- Material Design UI with React Native Paper

