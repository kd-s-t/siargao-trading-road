import 'package:flutter/material.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:animate_gradient/animate_gradient.dart';
import 'package:siargao_trading_road/screens/dashboard_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart' show ProfileScreen, ProfileScreenState;
import 'package:siargao_trading_road/screens/analytics_screen.dart';
import 'package:siargao_trading_road/screens/schedule_editor_screen.dart';
import 'package:siargao_trading_road/screens/ratings_screen.dart';
import 'package:siargao_trading_road/navigation/smooth_page_route.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
class AdminDrawer extends StatefulWidget {
  const AdminDrawer({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  State<AdminDrawer> createState() => _AdminDrawerState();
}

class _AdminDrawerState extends State<AdminDrawer> {
  int _currentIndex = 0;
  late final PageController _pageController = PageController(initialPage: _currentIndex);
  final _profileEditKey = GlobalKey<ProfileScreenState>();

  late final List<Widget> _screens = [
    const DashboardScreen(useScaffold: false),
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

  AppBar? _buildAppBar(BuildContext context) {
    final isEditing = _profileEditKey.currentState?.isEditing ?? false;
    final isTablet = _isTablet(context);
    switch (_currentIndex) {
      case 0:
        return AppBar(
          title: _buildAppBarTitle(isTablet, 'Dashboard'),
          centerTitle: isTablet,
        );
      case 1:
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
    if (mounted) {
      final isTablet = _isTablet(context);
      setState(() {
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
      destinations: [
        const NavigationRailDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard),
          label: Text('Dashboard'),
        ),
        NavigationRailDestination(
          icon: _buildProfileIconForRail(authProvider, false, context, iconSize),
          selectedIcon: _buildProfileIconForRail(authProvider, true, context, iconSize),
          label: const Text('Profile'),
        ),
      ],
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
      navigatorKey: AdminDrawer.navigatorKey,
      home: Scaffold(
        extendBody: !isTablet,
        backgroundColor: _isTablet(context) ? Colors.transparent : Theme.of(context).scaffoldBackgroundColor,
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
                        children: _screens,
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
                children: _screens,
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
                    _buildAssetIcon('assets/products.png', _currentIndex == 0, context),
                    _buildProfileIcon(authProvider, _currentIndex == 1, context),
                  ],
                ),
              ),
      ),
      onGenerateRoute: (settings) {
        Widget screen;
        switch (settings.name) {
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
    return ImageIcon(
      AssetImage(assetPath),
      size: 30,
      color: isActive ? Theme.of(context).colorScheme.secondary : Colors.white,
    );
  }
}
