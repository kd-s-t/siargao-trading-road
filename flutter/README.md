# Siargao Trading Road - Flutter App

![Flutter](https://img.shields.io/badge/Flutter-3.0+-02569B?logo=flutter&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-3.0+-0175C2?logo=dart&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)

Flutter version of the Siargao Trading Road mobile application, converted from React Native.

## 📁 Project Structure

```
flutter/
├── lib/
│   ├── main.dart                          # App entry point with error handling
│   │
│   ├── models/                            # Data models
│   │   ├── user.dart                      # User model with role, profile data
│   │   ├── product.dart                   # Product model with CRUD fields
│   │   ├── order.dart                     # Order, OrderItem, Message models
│   │   ├── rating.dart                    # Rating models and related entities
│   │   └── supplier.dart                  # Supplier model
│   │
│   ├── services/                          # API service layer
│   │   ├── api_service.dart               # Base HTTP client with auth interceptors
│   │   ├── auth_service.dart              # Authentication & user management
│   │   ├── product_service.dart           # Product CRUD operations
│   │   ├── order_service.dart             # Order management, draft orders, messages
│   │   ├── supplier_service.dart          # Supplier listing & products
│   │   ├── rating_service.dart           # Rating creation & retrieval
│   │   └── bug_report_service.dart        # Error reporting to backend
│   │
│   ├── providers/                        # State management (Provider pattern)
│   │   └── auth_provider.dart             # Authentication state & user management
│   │
│   ├── screens/                           # UI screens
│   │   ├── login_screen.dart              # Login with email/password
│   │   ├── register_screen.dart          # Registration with role selection
│   │   ├── products_screen.dart           # Product listing with delete/restore
│   │   ├── orders_screen.dart             # Order listing with status filters
│   │   ├── order_detail_screen.dart       # Order details with map & messaging
│   │   ├── dashboard_screen.dart          # Admin dashboard (placeholder)
│   │   ├── profile_screen.dart            # User profile management (placeholder)
│   │   ├── add_product_screen.dart        # Add new product (placeholder)
│   │   ├── edit_product_screen.dart       # Edit product (placeholder)
│   │   ├── suppliers_screen.dart          # Supplier listing (placeholder)
│   │   ├── supplier_products_screen.dart  # Supplier products view (placeholder)
│   │   ├── cart_screen.dart               # Shopping cart (placeholder)
│   │   ├── truck_screen.dart              # Truck tracking (placeholder)
│   │   └── ratings_list_screen.dart       # Ratings list (placeholder)
│   │
│   ├── widgets/                          # Reusable widgets
│   │   ├── drawer_content.dart           # Custom drawer with user info & menu
│   │   └── order_map.dart                # Google Maps with route visualization
│   │
│   ├── navigation/                       # Navigation setup
│   │   ├── app_navigator.dart            # Main navigation router
│   │   ├── store_drawer.dart             # Store role navigation
│   │   ├── supplier_drawer.dart         # Supplier role navigation
│   │   └── admin_drawer.dart            # Admin role navigation
│   │
│   └── utils/                            # Utilities
│       └── error_handler.dart            # Global error handling & bug reporting
│
├── assets/                               # App assets
│   └── splash.png                        # Splash screen
│
├── pubspec.yaml                          # Dependencies & project config
└── README.md                             # This file
```

## ✨ Features

- 🔐 **Authentication** - Login/Register with role-based access
- 👥 **Role-based Navigation** - Supplier, Store, and Admin dashboards
- 📦 **Product Management** - Full CRUD operations with soft delete/restore
- 📋 **Order Management** - Order tracking with status updates
- 🏪 **Supplier System** - Browse suppliers and their products
- ⭐ **Ratings System** - Rate orders after delivery
- 🗺️ **Maps Integration** - Google Maps with route visualization
- 🛒 **Cart Functionality** - Draft orders and cart management
- 👤 **Profile Management** - User profile with image uploads
- 🐛 **Bug Reporting** - Automatic error reporting to backend

## 🚀 Setup

### Prerequisites

- Flutter SDK 3.0 or higher
- Dart SDK 3.0 or higher
- Android Studio / Xcode (for mobile development)
- Google Maps API key (for maps functionality)

### Installation

1. **Install Flutter dependencies:**
```bash
cd flutter
flutter pub get
```

2. **Configure API URL (optional):**
   - Default: `http://192.168.31.76:3020/api`
   - Can be set via environment variable: `API_URL`
   - Or modify `lib/services/api_service.dart`

3. **Configure Google Maps (for maps feature):**
   - Add your Google Maps API key to platform-specific configs
   - Android: `android/app/src/main/AndroidManifest.xml`
   - iOS: `ios/Runner/AppDelegate.swift`

4. **Run the app:**
```bash
flutter run
```

## 📦 Dependencies

### Core
- `provider: ^6.1.1` - State management
- `http: ^1.1.0` - HTTP client for API calls
- `shared_preferences: ^2.2.2` - Local storage for tokens

### UI & Maps
- `google_maps_flutter: ^2.5.0` - Google Maps integration
- `geolocator: ^10.1.0` - Location services

### Media & Files
- `image_picker: ^1.0.7` - Image selection
- `file_picker: ^6.1.1` - File selection
- `path_provider: ^2.1.1` - File system paths

### Utilities
- `permission_handler: ^11.1.0` - Permission management
- `share_plus: ^7.2.1` - Share functionality
- `intl: ^0.19.0` - Internationalization
- `flutter_svg: ^2.0.9` - SVG support

See `pubspec.yaml` for complete list.

## 🏗️ Architecture

- **Models**: Data classes representing API responses
- **Services**: API communication layer with error handling
- **Providers**: State management using Provider pattern
- **Screens**: UI screens organized by feature
- **Widgets**: Reusable UI components
- **Navigation**: Role-based navigation structure

## 📝 Notes

- Some screens are placeholder implementations and need to be fully implemented based on the React Native versions
- The core architecture and API integration are complete
- Maps functionality requires Google Maps API key configuration
- Error handling and bug reporting are integrated throughout the app

## 🔄 Conversion Status

✅ **Completed:**
- Project structure and setup
- All data models
- API service layer
- Authentication system
- Navigation structure
- Core screens (Login, Register, Products, Orders)
- Maps widget
- Error handling

🚧 **In Progress:**
- Remaining screen implementations
- Advanced features (cart, ratings, etc.)

## 📄 License

MIT License - see LICENSE file for details
