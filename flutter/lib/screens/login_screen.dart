import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_gradient/animate_gradient.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/navigation/app_navigator.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;
  AnimationController? _animationController;
  Animation<double> _logoFadeAnimation = const AlwaysStoppedAnimation(1.0);
  Animation<double> _logoScaleAnimation = const AlwaysStoppedAnimation(1.0);
  Animation<double> _cardFadeAnimation = const AlwaysStoppedAnimation(1.0);
  Animation<Offset> _cardSlideAnimation = const AlwaysStoppedAnimation(Offset.zero);
  bool _animationsInitialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_animationsInitialized) {
        _initializeAnimations();
        _animationsInitialized = true;
      }
    });
  }

  bool _isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600;
  }

  void _initializeAnimations() {
    if (_animationController != null) {
      return;
    }
    
    final context = this.context;
    if (!mounted) return;
    
    final isTablet = _isTablet(context);
    _animationController = AnimationController(
      vsync: this,
      duration: isTablet 
          ? const Duration(milliseconds: 400)
          : const Duration(milliseconds: 1200),
    );

    final curve = isTablet ? Curves.easeOutCubic : Curves.easeOut;

    _logoFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Interval(0.0, 0.5, curve: curve),
    ));

    _logoScaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Interval(0.0, 0.5, curve: curve),
    ));

    _cardFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Interval(0.3, 1.0, curve: curve),
    ));

    _cardSlideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Interval(0.3, 1.0, curve: curve),
    ));

    _animationController!.forward();
  }

  @override
  void dispose() {
    if (_animationController != null && _animationController!.isAnimating) {
      _animationController!.stop();
    }
    _animationController?.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Widget _buildLoginCard(BuildContext context) {
    final isTablet = _isTablet(context);
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: isTablet ? 520 : 620),
        child: Card(
          elevation: isTablet ? 1 : 3,
          shape: isTablet 
              ? RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                )
              : null,
          child: Padding(
            padding: EdgeInsets.all(isTablet ? 32 : 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Sign in to continue',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
                SizedBox(height: isTablet ? 32 : 24),
                AnimatedSwitcher(
                  duration: Duration(milliseconds: isTablet ? 400 : 200),
                  switchInCurve: isTablet ? Curves.easeOutCubic : Curves.easeOut,
                  switchOutCurve: isTablet ? Curves.easeOutCubic : Curves.easeOut,
                  transitionBuilder: (child, animation) {
                    final offsetAnimation = Tween<Offset>(
                      begin: const Offset(0, -0.1),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: animation,
                      curve: isTablet ? Curves.easeOutCubic : Curves.easeOut,
                    ));
                    return FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: offsetAnimation,
                        child: child,
                      ),
                    );
                  },
                  child: _error == null
                      ? const SizedBox.shrink()
                      : Container(
                          key: const ValueKey('error-banner'),
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  _error!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Colors.red,
                                  ),
                                ),
                              ),
                              IconButton(
                                visualDensity: VisualDensity.compact,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                icon: const Icon(
                                  Icons.close,
                                  color: Colors.red,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _error = null;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                ),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.text,
                  decoration: const InputDecoration(
                    labelText: 'Email or Username',
                    border: OutlineInputBorder(),
                    helperText: 'Enter your email (for owners) or username (for employees)',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email or username';
                    }
                    return null;
                  },
                ),
                SizedBox(height: isTablet ? 20 : 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
                SizedBox(height: isTablet ? 32 : 24),
                ElevatedButton(
                  onPressed: _loading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A3A5F),
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      vertical: isTablet ? 16 : 12,
                      horizontal: isTablet ? 24 : 16,
                    ),
                    shape: isTablet
                        ? RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(28),
                          )
                        : null,
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Sign In', style: TextStyle(color: Colors.white)),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Don't have an account? ",
                      style: TextStyle(color: Colors.grey),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      child: const Text('Register'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _error = null;
      _loading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.unifiedLogin(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const AppNavigator()),
        (route) => false,
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = _isTablet(context);
    
    return Scaffold(
      body: AnimateGradient(
        primaryColors: const [
          Color(0xFF1A3A5F),
          Color(0xFF38B2AC),
        ],
        secondaryColors: const [
          Color(0xFF38B2AC),
          Color(0xFF1A3A5F),
        ],
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: isTablet ? 48 : 24,
                vertical: isTablet ? 48 : 32,
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 600 : 640,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(height: isTablet ? 20 : 10),
                      FadeTransition(
                        opacity: _logoFadeAnimation,
                        child: ScaleTransition(
                          scale: _logoScaleAnimation,
                          child: Image.asset(
                            'assets/splash.png',
                            width: isTablet ? 360 : 320,
                            height: isTablet ? 144 : 128,
                          ),
                        ),
                      ),
                      SizedBox(height: isTablet ? 24 : 14),
                      FadeTransition(
                        opacity: _cardFadeAnimation,
                      child: SlideTransition(
                        position: _cardSlideAnimation,
                        child: _buildLoginCard(context),
                      ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
