import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'package:siargao_trading_road/services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _loading = true;
  bool _isEmployee = false;

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  bool get isEmployee => _isEmployee;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      _isEmployee = prefs.getBool('is_employee') ?? false;
      
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
    await prefs.setBool('is_employee', false);
    _isEmployee = false;
    _user = await AuthService.getMe();
    notifyListeners();
  }

  Future<void> unifiedLogin(String emailOrUsername, String password) async {
    final response = await AuthService.unifiedLogin(emailOrUsername, password);
    final prefs = await SharedPreferences.getInstance();
    
    if (response is EmployeeLoginResponse) {
      await prefs.setString('token', response.token);
      await prefs.setBool('is_employee', true);
      _isEmployee = true;
      _user = response.user;
    } else if (response is LoginResponse) {
      await prefs.setString('token', response.token);
      await prefs.setBool('is_employee', false);
      _isEmployee = false;
      _user = response.user;
    }
    
    notifyListeners();
  }

  Future<void> employeeLogin({
    required String ownerEmail,
    required String username,
    required String password,
  }) async {
    final response = await AuthService.employeeLogin(
      ownerEmail: ownerEmail,
      username: username,
      password: password,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', response.token);
    await prefs.setBool('is_employee', true);
    _isEmployee = true;
    _user = await AuthService.getMe();
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
    await prefs.setBool('is_employee', false);
    _isEmployee = false;
    _user = await AuthService.getMe();
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
      debugPrint('Logout failed: $e');
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('is_employee');
    _user = null;
    _isEmployee = false;
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
      debugPrint('Refresh user failed: $e');
    }
  }
}
