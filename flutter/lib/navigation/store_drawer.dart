import 'package:flutter/material.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:animate_gradient/animate_gradient.dart';
import 'package:siargao_trading_road/screens/suppliers_screen.dart';
import 'package:siargao_trading_road/screens/supplier_products_screen.dart';
import 'package:siargao_trading_road/screens/orders_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/truck_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart' show ProfileScreen, ProfileScreenState;
import 'package:siargao_trading_road/screens/analytics_screen.dart';
import 'package:siargao_trading_road/screens/employees_screen.dart';
import 'package:siargao_trading_road/screens/schedule_editor_screen.dart';
import 'package:siargao_trading_road/screens/ratings_screen.dart';
import 'package:siargao_trading_road/navigation/smooth_page_route.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
class StoreDrawer extends StatefulWidget {
  const StoreDrawer({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  State<StoreDrawer> createState() => _StoreDrawerState();
}

class _StoreDrawerState extends State<StoreDrawer> {
  int _currentIndex = 0;
  late final PageController _pageController = PageController(initialPage: _currentIndex);
  final _profileEditKey = GlobalKey<ProfileScreenState>();

  List<Widget> _getTabletScreens(bool isEmployee) {
    if (isEmployee) {
      return [
        const SuppliersScreen(useScaffold: false),
        const OrdersScreen(useScaffold: false),
        ProfileScreen(
          key: _profileEditKey,
          useScaffold: false,
          editKey: _profileEditKey,
          onEditStateChanged: () => _safeSetState(() {}),
        ),
      ];
    }
    return [
      const SuppliersScreen(useScaffold: false),
      const OrdersScreen(useScaffold: false),
      const AnalyticsScreen(useScaffold: false),
      const EmployeesScreen(useScaffold: false),
      ProfileScreen(
        key: _profileEditKey,
        useScaffold: false,
        editKey: _profileEditKey,
        onEditStateChanged: () => _safeSetState(() {}),
      ),
    ];
  }

  List<Widget> _getPhoneScreens() {
    return [
      const SuppliersScreen(useScaffold: false),
      const OrdersScreen(useScaffold: false),
      ProfileScreen(
        key: _profileEditKey,
        useScaffold: false,
        editKey: _profileEditKey,
        onEditStateChanged: () => _safeSetState(() {}),
      ),
    ];
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _safeSetState(VoidCallback fn) {
    if (mounted) {
      setState(fn);
    }
  }

  Widget _buildAppBarTitle(bool isTablet, String? title) {
    if (isTablet) {
      return Image.asset(
        'assets/splash.png',
        height: 32,
        fit: BoxFit.contain,
      );
    }
    return title != null ? Text(title) : const SizedBox.shrink();
  }

  AppBar? _buildAppBar(BuildContext context, AuthProvider authProvider) {
    final isEditing = _profileEditKey.currentState?.isEditing ?? false;
    final isTablet = _isTablet(context);
    final isPhone = !isTablet;
    final isEmployee = authProvider.isEmployee;
    
    if (isEmployee) {
      switch (_currentIndex) {
        case 0:
          return AppBar(
            title: _buildAppBarTitle(isTablet, 'Suppliers'),
            centerTitle: isTablet,
            actions: [
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.red),
                tooltip: 'Logout',
                onPressed: () async {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                  }
                },
              ),
            ],
          );
        case 1:
          return AppBar(
            title: _buildAppBarTitle(isTablet, 'Orders'),
            centerTitle: isTablet,
            actions: [
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.red),
                tooltip: 'Logout',
                onPressed: () async {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                  }
                },
              ),
            ],
          );
        case 2:
          return AppBar(
            title: _buildAppBarTitle(isTablet, 'Profile'),
            centerTitle: isTablet,
            automaticallyImplyLeading: false,
            actions: [
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.red),
                tooltip: 'Logout',
                onPressed: () async {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                  }
                },
              ),
            ],
          );
        default:
          return null;
      }
    }
    
    switch (_currentIndex) {
      case 0:
        return AppBar(
          title: _buildAppBarTitle(isTablet, 'Suppliers'),
          centerTitle: isTablet,
        );
      case 1:
        return AppBar(
          title: _buildAppBarTitle(isTablet, 'Orders'),
          centerTitle: isTablet,
        );
      case 2:
        if (isPhone) {
          return AppBar(
            title: _buildAppBarTitle(isTablet, 'Profile'),
            centerTitle: isTablet,
            automaticallyImplyLeading: false,
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
        } else {
          return AppBar(
            title: _buildAppBarTitle(isTablet, 'Analytics'),
            centerTitle: isTablet,
          );
        }
      case 3:
        return AppBar(
          title: _buildAppBarTitle(isTablet, 'Manage Employees'),
          centerTitle: isTablet,
        );
      case 4:
        return AppBar(
          title: _buildAppBarTitle(isTablet, 'Profile'),
          centerTitle: isTablet,
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
          title: _buildAppBarTitle(isTablet, 'Siargao Trading Road'),
          centerTitle: isTablet,
        );
    }
  }

  bool _isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600;
  }

  void _onNavigationTap(int index) {
    if (!mounted || !_pageController.hasClients) return;
    final isTablet = _isTablet(context);
    _safeSetState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: isTablet 
        ? const Duration(milliseconds: 400)
        : const Duration(milliseconds: 300),
      curve: isTablet 
        ? Curves.easeOutCubic
        : Curves.easeInOut,
    ).catchError((_) {});
  }

  Widget _buildNavigationRail(AuthProvider authProvider, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;
    final iconSize = (28 * devicePixelRatio).round() / devicePixelRatio;
    final isEmployee = authProvider.isEmployee;
    
    final destinations = isEmployee
        ? [
            const NavigationRailDestination(
              icon: Icon(Icons.store_outlined),
              selectedIcon: Icon(Icons.store),
              label: Text('Suppliers'),
            ),
            const NavigationRailDestination(
              icon: Icon(Icons.shopping_cart_outlined),
              selectedIcon: Icon(Icons.shopping_cart),
              label: Text('Orders'),
            ),
            NavigationRailDestination(
              icon: _buildProfileIconForRail(authProvider, false, context, iconSize),
              selectedIcon: _buildProfileIconForRail(authProvider, true, context, iconSize),
              label: const Text('Profile'),
            ),
          ]
        : [
            const NavigationRailDestination(
              icon: Icon(Icons.store_outlined),
              selectedIcon: Icon(Icons.store),
              label: Text('Suppliers'),
            ),
            const NavigationRailDestination(
              icon: Icon(Icons.shopping_cart_outlined),
              selectedIcon: Icon(Icons.shopping_cart),
              label: Text('Orders'),
            ),
            const NavigationRailDestination(
              icon: Icon(Icons.analytics_outlined),
              selectedIcon: Icon(Icons.analytics),
              label: Text('Analytics'),
            ),
            const NavigationRailDestination(
              icon: Icon(Icons.people_outline),
              selectedIcon: Icon(Icons.people),
              label: Text('Employees'),
            ),
            NavigationRailDestination(
              icon: _buildProfileIconForRail(authProvider, false, context, iconSize),
              selectedIcon: _buildProfileIconForRail(authProvider, true, context, iconSize),
              label: const Text('Profile'),
            ),
          ];
    
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
      destinations: destinations,
      trailing: Expanded(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: IconButton(
                icon: const Icon(Icons.logout, color: Colors.red),
                tooltip: 'Logout',
                onPressed: () async {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isTablet = _isTablet(context);
    
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: StoreDrawer.navigatorKey,
      home: Scaffold(
        extendBody: !isTablet,
        backgroundColor: isTablet ? Colors.transparent : Theme.of(context).scaffoldBackgroundColor,
        appBar: _buildAppBar(context, authProvider),
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
                          _safeSetState(() {
                            _currentIndex = index;
                          });
                        },
                        children: _getTabletScreens(authProvider.isEmployee),
                      ),
                    ),
                  ],
                ),
              )
            : PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  _safeSetState(() {
                    _currentIndex = index;
                  });
                },
                children: _getPhoneScreens(),
              ),
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
                    _buildAssetIcon('assets/suppliers.png', _currentIndex == 0, context),
                    _buildAssetIcon('assets/orders.png', _currentIndex == 1, context),
                    _buildProfileIcon(authProvider, _currentIndex == 2, context),
                  ],
                ),
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

  Widget _buildProfileIconForRail(AuthProvider authProvider, bool isSelected, BuildContext context, double iconSize) {
    final logo = authProvider.user?.logoUrl;
    final colorScheme = Theme.of(context).colorScheme;
    
    if (logo != null && logo.isNotEmpty) {
      return ClipOval(
        child: Image.network(
          logo,
          width: iconSize,
          height: iconSize,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Icon(
              Icons.person_outline,
              size: iconSize,
              color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
            );
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Icon(
              Icons.person_outline,
              size: iconSize,
              color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
            );
          },
        ),
      );
    }
    return Icon(
      isSelected ? Icons.person : Icons.person_outline,
      size: iconSize,
      color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
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
