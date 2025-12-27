import 'package:flutter/material.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:animate_gradient/animate_gradient.dart';
import 'package:siargao_trading_road/screens/products_screen.dart';
import 'package:siargao_trading_road/screens/add_product_screen.dart';
import 'package:siargao_trading_road/screens/edit_product_screen.dart';
import 'package:siargao_trading_road/screens/orders_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart' show ProfileScreen, ProfileScreenState;
import 'package:siargao_trading_road/screens/analytics_screen.dart';
import 'package:siargao_trading_road/screens/employees_screen.dart';
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

  late final List<Widget> _tabletScreens = [
    ProductsScreen(key: _productsScreenKey, useScaffold: false),
    const OrdersScreen(useScaffold: false),
    const AnalyticsScreen(useScaffold: false),
    const EmployeesScreen(useScaffold: false),
    ProfileScreen(
      key: _profileEditKey,
      useScaffold: false,
      editKey: _profileEditKey,
      onEditStateChanged: () => setState(() {}),
    ),
  ];

  late final List<Widget> _phoneScreens = [
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
          title: const Text('Analytics'),
        );
      case 3:
        return AppBar(
          title: const Text('Manage Employees'),
        );
      case 4:
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

  bool _isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600;
  }

  void _onNavigationTap(int index) {
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
  }

  Widget _buildNavigationRail(AuthProvider authProvider, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;
    final iconSize = (28 * devicePixelRatio).round() / devicePixelRatio;
    return NavigationRail(
      selectedIndex: _currentIndex,
      onDestinationSelected: _onNavigationTap,
      labelType: NavigationRailLabelType.all,
      backgroundColor: Colors.white,
      selectedIconTheme: IconThemeData(
        color: colorScheme.primary,
        size: iconSize,
      ),
      unselectedIconTheme: IconThemeData(
        color: colorScheme.onSurfaceVariant,
        size: iconSize,
      ),
      selectedLabelTextStyle: TextStyle(
        color: colorScheme.primary,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
      unselectedLabelTextStyle: TextStyle(
        color: colorScheme.onSurfaceVariant,
        fontSize: 12,
      ),
      destinations: const [
        NavigationRailDestination(
          icon: Icon(Icons.inventory_2_outlined),
          selectedIcon: Icon(Icons.inventory_2),
          label: Text('Products'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.shopping_cart_outlined),
          selectedIcon: Icon(Icons.shopping_cart),
          label: Text('Orders'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.analytics_outlined),
          selectedIcon: Icon(Icons.analytics),
          label: Text('Analytics'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.people_outline),
          selectedIcon: Icon(Icons.people),
          label: Text('Employees'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: Text('Profile'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isTablet = _isTablet(context);
    
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: SupplierDrawer.navigatorKey,
      home: Scaffold(
        extendBody: !isTablet,
        backgroundColor: isTablet ? Colors.transparent : Theme.of(context).scaffoldBackgroundColor,
        appBar: _buildAppBar(context),
        body: isTablet
            ? AnimateGradient(
                primaryColors: const [
                  Color(0xFF1A3A5F),
                  Color(0xFF38B2AC),
                ],
                secondaryColors: const [
                  Color(0xFF38B2AC),
                  Color(0xFF1A3A5F),
                ],
                child: Row(
                  children: [
                    _buildNavigationRail(authProvider, context),
                    const VerticalDivider(width: 1, thickness: 1),
                    Expanded(
                      child: PageView(
                        controller: _pageController,
                        onPageChanged: (index) {
                          if (mounted) {
                            setState(() {
                              _currentIndex = index;
                            });
                          }
                        },
                        children: _tabletScreens,
                      ),
                    ),
                  ],
                ),
              )
            : PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  if (mounted) {
                    setState(() {
                      _currentIndex = index;
                    });
                  }
                },
                children: _phoneScreens,
              ),
        floatingActionButton: _buildFloatingActionButton(),
        bottomNavigationBar: isTablet
            ? null
            : SafeArea(
                bottom: !Platform.isIOS,
                child: CurvedNavigationBar(
                  index: _currentIndex,
                  onTap: _onNavigationTap,
                  backgroundColor: Colors.transparent,
                  color: Theme.of(context).colorScheme.primary,
                  buttonBackgroundColor: Colors.white.withValues(alpha: 0.9),
                  animationCurve: Curves.easeInOut,
                  animationDuration: const Duration(milliseconds: 300),
                  items: [
                    _buildAssetIcon('assets/products.png', _currentIndex == 0, context),
                    _buildAssetIcon('assets/orders.png', _currentIndex == 1, context),
                    _buildProfileIcon(authProvider, _currentIndex == 4, context),
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
      return Image.network(
        logo,
        width: 30,
        height: 30,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Icon(
            Icons.account_circle,
            size: 30,
            color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
          );
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Icon(
            Icons.account_circle,
            size: 30,
            color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
          );
        },
      );
    }
    return Icon(
      Icons.account_circle,
      size: 30,
      color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
    );
  }

  Widget _buildAssetIcon(String assetPath, bool isActive, BuildContext context) {
    IconData fallbackIcon;
    if (assetPath.contains('suppliers')) {
      fallbackIcon = Icons.store;
    } else if (assetPath.contains('orders')) {
      fallbackIcon = Icons.shopping_cart;
    } else if (assetPath.contains('products')) {
      fallbackIcon = Icons.inventory;
    } else {
      fallbackIcon = Icons.category;
    }
    
    return Image.asset(
      assetPath,
      width: 30,
      height: 30,
      errorBuilder: (context, error, stackTrace) {
        return Icon(
          fallbackIcon,
          size: 30,
          color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
        );
      },
    );
  }

}
