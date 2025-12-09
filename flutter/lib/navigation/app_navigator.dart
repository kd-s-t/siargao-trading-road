import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/screens/login_screen.dart';
import 'package:siargao_trading_road/screens/register_screen.dart';
import 'package:siargao_trading_road/screens/onboarding_screen.dart';
import 'package:siargao_trading_road/navigation/store_drawer.dart';
import 'package:siargao_trading_road/navigation/supplier_drawer.dart';
import 'package:siargao_trading_road/navigation/admin_drawer.dart';
import 'package:siargao_trading_road/services/feature_flag_service.dart';

class AppNavigator extends StatelessWidget {
  const AppNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return const _MainApp();
  }
}

class _MainApp extends StatefulWidget {
  const _MainApp();

  @override
  State<_MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<_MainApp> {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        if (authProvider.loading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (authProvider.user == null) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              primarySwatch: Colors.blue,
              primaryColor: const Color(0xFF1976D2),
            ),
            initialRoute: '/login',
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
            },
          );
        }

        final user = authProvider.user!;
        final hasOnboardingFlag = user.featureFlags.contains('onboarding_completed');

        if (!hasOnboardingFlag) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              primarySwatch: Colors.blue,
              primaryColor: const Color(0xFF1976D2),
            ),
            home: OnboardingScreen(
              onComplete: () {
                if (!mounted) return;
                Provider.of<AuthProvider>(context, listen: false).addFeatureFlag('onboarding_completed');
                FeatureFlagService.completeOnboarding();
                setState(() {});
              },
            ),
          );
        }
        
        if (user.role == 'supplier') {
          return const SupplierDrawer();
        } else if (user.role == 'store') {
          return const StoreDrawer();
        } else {
          return const AdminDrawer();
        }
      },
    );
  }
}
