import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:siargao_trading_road/screens/suppliers_screen.dart';
import 'package:siargao_trading_road/screens/supplier_products_screen.dart';
import 'package:siargao_trading_road/screens/orders_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/truck_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart';
import 'package:siargao_trading_road/screens/analytics_screen.dart';
import 'package:siargao_trading_road/screens/schedule_editor_screen.dart';

class StoreDrawer extends StatefulWidget {
  const StoreDrawer({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  State<StoreDrawer> createState() => _StoreDrawerState();
}

class _StoreDrawerState extends State<StoreDrawer> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SuppliersScreen(useScaffold: false),
    const OrdersScreen(useScaffold: false),
    const ProfileScreen(useScaffold: false),
  ];

  AppBar? _buildAppBar() {
    switch (_currentIndex) {
      case 0:
        return AppBar(
          title: const Text('Suppliers'),
        );
      case 1:
        return AppBar(
          title: const Text('Orders'),
        );
      case 2:
        return AppBar(
          title: const Text('Profile'),
        );
      default:
        return AppBar(title: const Text('Siargao Trading Road'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: StoreDrawer.navigatorKey,
      home: Scaffold(
        appBar: _buildAppBar(),
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
        bottomNavigationBar: CurvedNavigationBar(
          index: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          backgroundColor: Colors.transparent,
          color: Theme.of(context).colorScheme.primary,
          buttonBackgroundColor: Theme.of(context).colorScheme.secondary,
          animationCurve: Curves.easeInOut,
          animationDuration: const Duration(milliseconds: 300),
          items: const [
            Icon(Icons.store, size: 30, color: Colors.white),
            Icon(Icons.list_alt, size: 30, color: Colors.white),
            Icon(Icons.account_circle, size: 30, color: Colors.white),
          ],
        ),
      ),
      onGenerateRoute: (settings) {
        Widget screen;
        switch (settings.name) {
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
          case '/truck':
            screen = const TruckScreen();
            break;
          case '/order-detail':
            screen = const OrderDetailScreen();
            break;
          case '/analytics':
            screen = const AnalyticsScreen();
            break;
          case '/schedule':
            screen = const ScheduleEditorScreen();
            break;
          default:
            return null;
        }
        return MaterialPageRoute(
          builder: (_) => screen,
          settings: settings,
        );
      },
    );
  }
}
