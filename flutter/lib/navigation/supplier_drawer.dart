import 'package:flutter/material.dart';
import 'package:siargao_trading_road/screens/products_screen.dart';
import 'package:siargao_trading_road/screens/add_product_screen.dart';
import 'package:siargao_trading_road/screens/edit_product_screen.dart';
import 'package:siargao_trading_road/screens/orders_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart';
import 'package:siargao_trading_road/widgets/drawer_content.dart';

class SupplierDrawer extends StatelessWidget {
  const SupplierDrawer({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: DefaultTabController(
        length: 2,
        child: Scaffold(
          drawer: DrawerContent(navigatorKey: navigatorKey),
          body: Navigator(
            key: navigatorKey,
            onGenerateRoute: (settings) {
              Widget screen;
              switch (settings.name) {
                case '/':
                case '/products':
                  screen = const ProductsScreen();
                  break;
                case '/orders':
                  screen = const OrdersScreen();
                  break;
                case '/add-product':
                  screen = const AddProductScreen();
                  break;
                case '/edit-product':
                  screen = EditProductScreen(
                    product: (settings.arguments as Map?)?['product'],
                  );
                  break;
                case '/profile':
                  screen = const ProfileScreen();
                  break;
                default:
                  screen = const ProductsScreen();
              }
              return MaterialPageRoute(builder: (_) => screen);
            },
            initialRoute: '/products',
          ),
        ),
      ),
    );
  }
}
