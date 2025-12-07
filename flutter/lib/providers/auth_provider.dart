import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'package:siargao_trading_road/services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _loading = true;

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token != null) {
        try {
          final userData = await AuthService.getMe().timeout(
            const Duration(seconds: 2),
            onTimeout: () {
              throw Exception('Auth check timeout');
            },
          );
          _user = userData;
        } catch (e) {
          await prefs.remove('token');
        }
      }
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final response = await AuthService.login(email, password);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', response.token);
    _user = response.user;
    notifyListeners();
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    required String phone,
    required String role,
  }) async {
    final response = await AuthService.register(
      email: email,
      password: password,
      name: name,
      phone: phone,
      role: role,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', response.token);
    _user = response.user;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await AuthService.logout();
    } catch (e) {
      // Ignore logout errors - proceed with local logout
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _user = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await AuthService.getMe();
      notifyListeners();
    } catch (e) {
      // Ignore refresh errors - keep existing user data
    }
  }
}
