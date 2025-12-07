import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/navigation/app_navigator.dart';
import 'package:siargao_trading_road/utils/error_handler.dart';
import 'package:siargao_trading_road/screens/add_product_screen.dart';
import 'package:siargao_trading_road/screens/edit_product_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/supplier_products_screen.dart';
import 'package:siargao_trading_road/screens/truck_screen.dart';
import 'package:siargao_trading_road/screens/analytics_screen.dart';

void main() {
  ErrorHandler.setupErrorHandling();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Siargao Trading Road',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          primaryColor: const Color(0xFF1976D2),
          scaffoldBackgroundColor: Colors.white,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1976D2),
            primary: const Color(0xFF1976D2),
            secondary: const Color(0xFF38B2AC),
          ),
          useMaterial3: true,
        ),
        home: const AppNavigator(),
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/add-product':
              return MaterialPageRoute(builder: (_) => const AddProductScreen());
            case '/edit-product':
              final args = settings.arguments as Map<String, dynamic>?;
              return MaterialPageRoute(
                builder: (_) => EditProductScreen(product: args?['product']),
              );
            case '/order-detail':
              return MaterialPageRoute(builder: (_) => const OrderDetailScreen());
            case '/supplier-products':
              final args = settings.arguments as Map<String, dynamic>?;
              final supplierId = args?['supplierId'] as int?;
              if (supplierId == null) {
                return MaterialPageRoute(
                  builder: (_) => const Scaffold(
                    body: Center(child: Text('Supplier ID is required')),
                  ),
                );
              }
              return MaterialPageRoute(
                builder: (_) => SupplierProductsScreen(supplierId: supplierId),
              );
            case '/truck':
              return MaterialPageRoute(builder: (_) => const TruckScreen());
            case '/analytics':
              return MaterialPageRoute(builder: (_) => const AnalyticsScreen());
            default:
              return null;
          }
        },
      ),
    );
  }
}
