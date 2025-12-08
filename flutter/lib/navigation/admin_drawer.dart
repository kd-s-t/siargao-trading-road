import 'package:flutter/material.dart';
import 'dart:io';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:siargao_trading_road/screens/dashboard_screen.dart';
import 'package:siargao_trading_road/screens/order_detail_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart' show ProfileScreen, ProfileScreenState;
import 'package:siargao_trading_road/screens/analytics_screen.dart';
import 'package:siargao_trading_road/screens/schedule_editor_screen.dart';
import 'package:siargao_trading_road/navigation/smooth_page_route.dart';
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

  AppBar? _buildAppBar(BuildContext context) {
    final isEditing = _profileEditKey.currentState?.isEditing ?? false;
    switch (_currentIndex) {
      case 0:
        return AppBar(
          title: const Text('Dashboard'),
        );
      case 1:
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

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: AdminDrawer.navigatorKey,
      home: Scaffold(
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
            buttonBackgroundColor: Theme.of(context).colorScheme.secondary,
            animationCurve: Curves.easeInOut,
            animationDuration: const Duration(milliseconds: 300),
            items: const [
              Icon(Icons.dashboard, size: 30, color: Colors.white),
              Icon(Icons.account_circle, size: 30, color: Colors.white),
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
}
