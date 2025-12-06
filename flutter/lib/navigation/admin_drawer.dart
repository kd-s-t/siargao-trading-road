import 'package:flutter/material.dart';
import 'package:siargao_trading_road/screens/dashboard_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart';
import 'package:siargao_trading_road/widgets/drawer_content.dart';

class AdminDrawer extends StatelessWidget {
  const AdminDrawer({super.key});

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
              case '/dashboard':
                screen = const DashboardScreen();
                break;
              case '/profile':
                screen = const ProfileScreen();
                break;
              default:
                screen = const DashboardScreen();
            }
            return MaterialPageRoute(builder: (_) => screen);
          },
          initialRoute: '/dashboard',
        ),
      ),
    );
  }
}
