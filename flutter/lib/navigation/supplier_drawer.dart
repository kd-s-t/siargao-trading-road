import 'package:flutter/material.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:siargao_trading_road/screens/products_screen.dart';
import 'package:siargao_trading_road/screens/add_product_screen.dart';
import 'package:siargao_trading_road/screens/edit_product_screen.dart';
import 'package:siargao_trading_road/screens/orders_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart' show ProfileScreen, ProfileScreenState;
import 'package:siargao_trading_road/screens/analytics_screen.dart';
import 'package:siargao_trading_road/screens/schedule_editor_screen.dart';
import 'package:siargao_trading_road/screens/ratings_screen.dart';
import 'package:siargao_trading_road/navigation/smooth_page_route.dart';
import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
class SupplierDrawer extends StatefulWidget {
  const SupplierDrawer({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  State<SupplierDrawer> createState() => _SupplierDrawerState();
}

class _SupplierDrawerState extends State<SupplierDrawer> {
  int _currentIndex = 0;
  late final PageController _pageController = PageController(initialPage: _currentIndex);
  final _profileEditKey = GlobalKey<ProfileScreenState>();
  final _productsScreenKey = GlobalKey();

  late final List<Widget> _screens = [
    ProductsScreen(key: _productsScreenKey, useScaffold: false),
    const OrdersScreen(useScaffold: false),
    ProfileScreen(
      key: _profileEditKey,
      useScaffold: false,
      editKey: _profileEditKey,
      onEditStateChanged: () => setState(() {}),
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  AppBar? _buildAppBar(BuildContext context) {
    final isEditing = _profileEditKey.currentState?.isEditing ?? false;
    switch (_currentIndex) {
      case 0:
        return AppBar(
          title: const Text('My Products'),
        );
      case 1:
        return AppBar(
          title: const Text('Orders'),
        );
      case 2:
        return AppBar(
          title: const Text('Profile'),
          actions: [
            if (isEditing)
              TextButton(
                onPressed: () {
                  final state = _profileEditKey.currentState;
                  if (state != null) {
                    state.toggleEdit();
                  }
                },
                child: const Text('Cancel'),
              ),
            if (!isEditing)
              TextButton(
                onPressed: () {
                  final state = _profileEditKey.currentState;
                  if (state != null) {
                    state.toggleEdit();
                  }
                },
                child: const Text('Edit'),
              ),
            if (isEditing)
              TextButton(
                onPressed: () {
                  final state = _profileEditKey.currentState;
                  if (state != null) {
                    state.handleSave();
                  }
                },
                child: const Text('Save'),
              ),
          ],
        );
      default:
        return AppBar(
          title: const Text('Siargao Trading Road'),
        );
    }
  }

  Widget? _buildFloatingActionButton() {
    if (_currentIndex == 0) {
      return FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.pushNamed(context, '/add-product');
          if (result is Product) {
            final state = _productsScreenKey.currentState;
            if (state != null) {
              (state as dynamic).addProduct(result);
            }
          }
        },
        child: const Icon(Icons.add),
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: SupplierDrawer.navigatorKey,
      home: Scaffold(
        extendBody: true,
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: _buildAppBar(context),
        body: PageView(
          controller: _pageController,
          onPageChanged: (index) {
            if (mounted) {
              setState(() {
                _currentIndex = index;
              });
            }
          },
          children: _screens,
        ),
        floatingActionButton: _buildFloatingActionButton(),
        bottomNavigationBar: SafeArea(
          bottom: !Platform.isIOS,
          child: CurvedNavigationBar(
            index: _currentIndex,
            onTap: (index) {
              if (mounted) {
                setState(() {
                  _currentIndex = index;
                });
                _pageController.animateToPage(
                  index,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              }
            },
            backgroundColor: Colors.transparent,
            color: Theme.of(context).colorScheme.primary,
            buttonBackgroundColor: Colors.white.withValues(alpha: 0.9),
            animationCurve: Curves.easeInOut,
            animationDuration: const Duration(milliseconds: 300),
            items: [
              _buildAssetIcon('assets/products.png', _currentIndex == 0, context),
              _buildAssetIcon('assets/orders.png', _currentIndex == 1, context),
              _buildProfileIcon(authProvider, _currentIndex == 2, context),
            ],
          ),
        ),
      ),
      onGenerateRoute: (settings) {
        Widget screen;
        switch (settings.name) {
          case '/add-product':
            screen = const AddProductScreen();
            break;
          case '/edit-product':
            screen = EditProductScreen(
              product: (settings.arguments as Map?)?['product'],
            );
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
          case '/ratings':
            screen = const RatingsScreen();
            break;
          default:
            return null;
        }
        return SmoothPageRoute(
          child: screen,
          settings: settings,
        );
      },
    );
  }

  Widget _buildProfileIcon(AuthProvider authProvider, bool isActive, BuildContext context) {
    final logo = authProvider.user?.logoUrl;
    if (logo != null && logo.isNotEmpty) {
      return Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
            width: 2,
          ),
          color: Colors.white,
        ),
        child: ClipOval(
          child: Image.network(
            logo,
            fit: BoxFit.cover,
          ),
        ),
      );
    }
    return Icon(Icons.account_circle, size: 30, color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white);
  }

  Widget _buildAssetIcon(String assetPath, bool isActive, BuildContext context) {
    return ImageIcon(
      AssetImage(assetPath),
      size: 30,
      color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
    );
  }
}
