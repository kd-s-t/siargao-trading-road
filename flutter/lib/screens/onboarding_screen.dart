import 'package:flutter/material.dart';
import 'package:introduction_screen/introduction_screen.dart';
import 'package:siargao_trading_road/services/feature_flag_service.dart';

class OnboardingScreen extends StatelessWidget {
  final VoidCallback? onComplete;
  
  const OnboardingScreen({super.key, this.onComplete});

  static Future<bool> shouldShowOnboarding() async {
    return await FeatureFlagService.shouldShowOnboarding();
  }

  static Future<void> completeOnboarding() async {
    await FeatureFlagService.completeOnboarding();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: IntroductionScreen(
      pages: [
        PageViewModel(
          title: 'Welcome to Siargao Trading Road',
          body: 'Connect with local suppliers and stores in Siargao. Buy and sell products with ease.',
          image: Image.asset('assets/logov3.png', height: 200),
          decoration: const PageDecoration(
            titleTextStyle: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            bodyTextStyle: TextStyle(fontSize: 16),
          ),
        ),
        PageViewModel(
          title: 'Manage Your Products',
          body: 'Add, edit, and manage your product inventory. Keep track of stock and prices.',
          image: const Icon(Icons.inventory_2, size: 120, color: Color(0xFF1976D2)),
          decoration: const PageDecoration(
            titleTextStyle: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            bodyTextStyle: TextStyle(fontSize: 16),
          ),
        ),
        PageViewModel(
          title: 'Track Your Orders',
          body: 'Monitor order status from preparation to delivery. Stay updated in real-time.',
          image: const Icon(Icons.list_alt, size: 120, color: Color(0xFF1976D2)),
          decoration: const PageDecoration(
            titleTextStyle: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            bodyTextStyle: TextStyle(fontSize: 16),
          ),
        ),
        PageViewModel(
          title: 'Get Started',
          body: 'Create your account and start trading today!',
          image: const Icon(Icons.rocket_launch, size: 120, color: Color(0xFF1976D2)),
          decoration: const PageDecoration(
            titleTextStyle: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            bodyTextStyle: TextStyle(fontSize: 16),
          ),
        ),
      ],
      onDone: () async {
        await completeOnboarding();
        if (context.mounted) {
          onComplete?.call();
        }
      },
      onSkip: () async {
        await completeOnboarding();
        if (context.mounted) {
          onComplete?.call();
        }
      },
      showSkipButton: true,
      skip: const Text('Skip'),
      next: const Padding(
        padding: EdgeInsets.all(16.0),
        child: Icon(Icons.arrow_forward, size: 28.0),
      ),
      done: const Text('Done', style: TextStyle(fontWeight: FontWeight.bold)),
      dotsDecorator: const DotsDecorator(
        size: Size(10.0, 10.0),
        color: Color(0xFFBDBDBD),
        activeColor: Color(0xFF1976D2),
        activeSize: Size(22.0, 10.0),
        activeShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(25.0)),
        ),
      ),
        ),
      ),
    );
  }
}
