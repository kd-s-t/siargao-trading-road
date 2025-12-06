import 'dart:convert';
import 'package:siargao_trading_road/models/user.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class LoginResponse {
  final String token;
  final User user;

  LoginResponse({
    required this.token,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class AuthService {
  static Future<LoginResponse> login(String email, String password) async {
    final response = await ApiService.post(
      '/login',
      body: {
        'email': email,
        'password': password,
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return LoginResponse.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Login failed');
    }
  }

  static Future<LoginResponse> register({
    required String email,
    required String password,
    required String name,
    required String phone,
    required String role,
  }) async {
    final response = await ApiService.post(
      '/register',
      body: {
        'email': email,
        'password': password,
        'name': name,
        'phone': phone,
        'role': role,
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return LoginResponse.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Registration failed');
    }
  }

  static Future<User> getMe() async {
    final response = await ApiService.get('/me');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return User.fromJson(data);
    } else {
      throw Exception('Failed to get user info');
    }
  }

  static Future<User> updateMe({
    String? name,
    String? phone,
    String? logoUrl,
    String? bannerUrl,
    String? facebook,
    String? instagram,
    String? twitter,
    String? linkedin,
    String? youtube,
    String? tiktok,
    String? website,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (logoUrl != null) body['logo_url'] = logoUrl;
    if (bannerUrl != null) body['banner_url'] = bannerUrl;
    if (facebook != null) body['facebook'] = facebook;
    if (instagram != null) body['instagram'] = instagram;
    if (twitter != null) body['twitter'] = twitter;
    if (linkedin != null) body['linkedin'] = linkedin;
    if (youtube != null) body['youtube'] = youtube;
    if (tiktok != null) body['tiktok'] = tiktok;
    if (website != null) body['website'] = website;

    final response = await ApiService.put('/me', body: body);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return User.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to update profile');
    }
  }

  static Future<Map<String, String>> uploadImage(String filePath) async {
    final response = await ApiService.postMultipart('/upload', filePath, 'file');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return {
        'url': data['url'] as String,
        'key': data['key'] as String,
      };
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to upload image');
    }
  }

  static Future<void> logout() async {
    await ApiService.post('/logout');
  }
}
