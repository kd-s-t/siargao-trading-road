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
    double? latitude,
    double? longitude,
  }) async {
    final response = await AuthService.register(
      email: email,
      password: password,
      name: name,
      phone: phone,
      role: role,
      latitude: latitude,
      longitude: longitude,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', response.token);
    _user = response.user;
    notifyListeners();
  }

  void addFeatureFlag(String flag) {
    if (_user == null) return;
    if (_user!.featureFlags.contains(flag)) return;
    _user = User(
      id: _user!.id,
      email: _user!.email,
      name: _user!.name,
      phone: _user!.phone,
      address: _user!.address,
      latitude: _user!.latitude,
      longitude: _user!.longitude,
      logoUrl: _user!.logoUrl,
      bannerUrl: _user!.bannerUrl,
      facebook: _user!.facebook,
      instagram: _user!.instagram,
      twitter: _user!.twitter,
      linkedin: _user!.linkedin,
      youtube: _user!.youtube,
      tiktok: _user!.tiktok,
      website: _user!.website,
      role: _user!.role,
      openingTime: _user!.openingTime,
      closingTime: _user!.closingTime,
      closedDaysOfWeek: _user!.closedDaysOfWeek,
      isOpen: _user!.isOpen,
      createdAt: _user!.createdAt,
      updatedAt: _user!.updatedAt,
      averageRating: _user!.averageRating,
      ratingCount: _user!.ratingCount,
      featureFlags: [..._user!.featureFlags, flag],
    );
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
      final existingFlags = _user?.featureFlags ?? const [];
      final refreshed = await AuthService.getMe();
      // getMe currently returns the user payload without feature flags; preserve existing flags
      final mergedUser = (existingFlags.isNotEmpty && refreshed.featureFlags.isEmpty)
          ? User(
              id: refreshed.id,
              email: refreshed.email,
              name: refreshed.name,
              phone: refreshed.phone,
              address: refreshed.address,
              latitude: refreshed.latitude,
              longitude: refreshed.longitude,
              logoUrl: refreshed.logoUrl,
              bannerUrl: refreshed.bannerUrl,
              facebook: refreshed.facebook,
              instagram: refreshed.instagram,
              twitter: refreshed.twitter,
              linkedin: refreshed.linkedin,
              youtube: refreshed.youtube,
              tiktok: refreshed.tiktok,
              website: refreshed.website,
              role: refreshed.role,
              openingTime: refreshed.openingTime,
              closingTime: refreshed.closingTime,
              closedDaysOfWeek: refreshed.closedDaysOfWeek,
              isOpen: refreshed.isOpen,
              createdAt: refreshed.createdAt,
              updatedAt: refreshed.updatedAt,
              averageRating: refreshed.averageRating,
              ratingCount: refreshed.ratingCount,
              featureFlags: existingFlags,
            )
          : refreshed;

      _user = mergedUser;
      notifyListeners();
    } catch (e) {
      // Ignore refresh errors - keep existing user data
    }
  }
}
