import 'package:flutter/material.dart';
import 'package:siargao_trading_road/screens/suppliers_screen.dart';
import 'package:siargao_trading_road/screens/supplier_products_screen.dart';
import 'package:siargao_trading_road/screens/orders_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/truck_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart';
import 'package:siargao_trading_road/widgets/drawer_content.dart';

class StoreDrawer extends StatelessWidget {
  const StoreDrawer({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        drawer: DrawerContent(navigatorKey: navigatorKey),
        body: Navigator(
          key: navigatorKey,
          onGenerateRoute: (settings) {
            Widget screen;
            switch (settings.name) {
              case '/':
              case '/suppliers':
                screen = const SuppliersScreen();
                break;
              case '/supplier-products':
                final args = settings.arguments as Map<String, dynamic>?;
                final supplierId = args?['supplierId'] as int?;
                if (supplierId == null || supplierId <= 0) {
                  screen = const Scaffold(
                    body: Center(
                      child: Text('Invalid supplier ID'),
                    ),
                  );
                } else {
                  screen = SupplierProductsScreen(supplierId: supplierId);
                }
                break;
              case '/orders':
                screen = const OrdersScreen();
                break;
              case '/truck':
                screen = TruckScreen();
                break;
              case '/profile':
                screen = const ProfileScreen();
                break;
              case '/order-detail':
                screen = OrderDetailScreen();
                break;
              default:
                screen = const SuppliersScreen();
            }
            return MaterialPageRoute(
              builder: (_) => screen,
              settings: settings,
            );
          },
          initialRoute: '/suppliers',
        ),
      ),
    );
  }
}
