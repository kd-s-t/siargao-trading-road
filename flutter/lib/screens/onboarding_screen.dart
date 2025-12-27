import 'package:flutter/material.dart';
import 'package:siargao_trading_road/services/feature_flag_service.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback? onComplete;
  
  const OnboardingScreen({super.key, this.onComplete});

  static Future<bool> shouldShowOnboarding() async {
    return await FeatureFlagService.shouldShowOnboarding();
  }

  static Future<void> completeOnboarding() async {
    await FeatureFlagService.completeOnboarding();
  }

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: 'Welcome to Siargao Trading Road',
      body: 'Connect with local suppliers and stores in Siargao. Buy and sell products with ease.',
      image: const Icon(Icons.store, size: 120, color: Color(0xFF1976D2)),
    ),
    OnboardingPage(
      title: 'Manage Your Products',
      body: 'Add, edit, and manage your product inventory. Keep track of stock and prices.',
      image: const Icon(Icons.inventory_2, size: 120, color: Color(0xFF1976D2)),
    ),
    OnboardingPage(
      title: 'Track Your Orders',
      body: 'Monitor order status from preparation to delivery. Stay updated in real-time.',
      image: const Icon(Icons.list_alt, size: 120, color: Color(0xFF1976D2)),
    ),
    OnboardingPage(
      title: 'Get Started',
      body: 'Create your account and start trading today!',
      image: const Icon(Icons.rocket_launch, size: 120, color: Color(0xFF1976D2)),
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _handleDone() async {
    await OnboardingScreen.completeOnboarding();
    if (mounted) {
      widget.onComplete?.call();
    }
  }

  void _handleSkip() async {
    await OnboardingScreen.completeOnboarding();
    if (mounted) {
      widget.onComplete?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Column(
          children: [
            if (_currentPage < _pages.length - 1)
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: _handleSkip,
                  child: const Text('Skip'),
                ),
              ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          color: Colors.transparent,
                          child: page.image,
                        ),
                        const SizedBox(height: 48),
                        Text(
                          page.title,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          page.body,
                          style: const TextStyle(fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _pages.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentPage == index ? 22 : 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? const Color(0xFF1976D2)
                        : const Color(0xFFBDBDBD),
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage > 0)
                    IconButton(
                      onPressed: () {
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      icon: const Icon(Icons.arrow_back),
                    )
                  else
                    const SizedBox(width: 48),
                  if (_currentPage < _pages.length - 1)
                    IconButton(
                      onPressed: () {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      icon: const Icon(Icons.arrow_forward),
                    )
                  else
                    ElevatedButton(
                      onPressed: _handleDone,
                      child: const Text(
                        'Done',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class OnboardingPage {
  final String title;
  final String body;
  final Widget image;

  OnboardingPage({
    required this.title,
    required this.body,
    required this.image,
  });
}
