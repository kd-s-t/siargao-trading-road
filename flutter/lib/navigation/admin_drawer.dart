import 'package:flutter/material.dart';
import 'package:siargao_trading_road/screens/dashboard_screen.dart';
import 'package:siargao_trading_road/screens/profile_screen.dart';
import 'package:siargao_trading_road/widgets/drawer_content.dart';

class AdminDrawer extends StatelessWidget {
  const AdminDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        drawer: const DrawerContent(),
        body: Navigator(
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
