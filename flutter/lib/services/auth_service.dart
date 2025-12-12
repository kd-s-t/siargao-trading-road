import 'dart:convert';
import 'dart:io';
import 'package:image/image.dart' as img;
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

    if (response.statusCode == 200 || response.statusCode == 201) {
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
    double? latitude,
    double? longitude,
  }) async {
    final body = <String, dynamic>{
      'email': email,
      'password': password,
      'name': name,
      'phone': phone,
      'role': role,
    };
    if (latitude != null && longitude != null) {
      body['latitude'] = latitude;
      body['longitude'] = longitude;
    }
    final response = await ApiService.post(
      '/register',
      body: body,
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
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
    String? address,
    String? logoUrl,
    String? bannerUrl,
    double? latitude,
    double? longitude,
    String? facebook,
    String? instagram,
    String? twitter,
    String? linkedin,
    String? youtube,
    String? tiktok,
    String? website,
    String? openingTime,
    String? closingTime,
    String? closedDaysOfWeek,
    bool? isOpen,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (address != null) body['address'] = address;
    if (logoUrl != null) body['logo_url'] = logoUrl;
    if (bannerUrl != null) body['banner_url'] = bannerUrl;
    if (latitude != null) body['latitude'] = latitude;
    if (longitude != null) body['longitude'] = longitude;
    if (facebook != null) body['facebook'] = facebook;
    if (instagram != null) body['instagram'] = instagram;
    if (twitter != null) body['twitter'] = twitter;
    if (linkedin != null) body['linkedin'] = linkedin;
    if (youtube != null) body['youtube'] = youtube;
    if (tiktok != null) body['tiktok'] = tiktok;
    if (website != null) body['website'] = website;
    if (openingTime != null) body['opening_time'] = openingTime;
    if (closingTime != null) body['closing_time'] = closingTime;
    if (closedDaysOfWeek != null) body['closed_days_of_week'] = closedDaysOfWeek;
    if (isOpen != null) body['is_open'] = isOpen;

    final response = await ApiService.put('/me', body: body);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return User.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to update profile');
    }
  }

  static Future<Map<String, String>> uploadImage(String filePath, {String? imageType}) async {
    final originalFile = File(filePath);
    final originalBytes = await originalFile.readAsBytes();
    final decoded = img.decodeImage(originalBytes);
    if (decoded == null) {
      throw Exception('Failed to process image');
    }

    img.Image processed;
    
    if (imageType == 'banner') {
      const targetWidth = 1200;
      const targetHeight = 675;
      const aspectRatio = targetWidth / targetHeight;
      final imageAspectRatio = decoded.width / decoded.height;
      
      int cropWidth, cropHeight, cropX, cropY;
      
      if (imageAspectRatio > aspectRatio) {
        cropHeight = decoded.height;
        cropWidth = (decoded.height * aspectRatio).round();
        cropX = (decoded.width - cropWidth) ~/ 2;
        cropY = 0;
      } else {
        cropWidth = decoded.width;
        cropHeight = (decoded.width / aspectRatio).round();
        cropX = 0;
        cropY = (decoded.height - cropHeight) ~/ 2;
      }
      
      final cropped = img.copyCrop(
        decoded,
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      );
      
      processed = img.copyResize(
        cropped,
        width: targetWidth,
        height: targetHeight,
      );
    } else {
      final squareSize = decoded.width < decoded.height ? decoded.width : decoded.height;
      final cropped = img.copyCrop(
        decoded,
        x: (decoded.width - squareSize) ~/ 2,
        y: (decoded.height - squareSize) ~/ 2,
        width: squareSize,
        height: squareSize,
      );

      const targetSize = 512;
      processed = squareSize > targetSize
        ? img.copyResize(
              cropped,
              width: targetSize,
              height: targetSize,
          )
          : cropped;
    }

    final compressedBytes = img.encodeJpg(processed, quality: 80);
    final tempPath = '${Directory.systemTemp.path}/str_upload_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final tempFile = File(tempPath);
    await tempFile.writeAsBytes(compressedBytes, flush: true);

    final response = await ApiService.postMultipart('/upload', tempFile.path, 'file');

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

  static Future<User> openStore() async {
    final response = await ApiService.post('/me/open', body: {});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return User.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to open store');
    }
  }

  static Future<User> closeStore() async {
    final response = await ApiService.post('/me/close', body: {});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return User.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to close store');
    }
  }

  static Future<void> logout() async {
    await ApiService.post('/logout');
  }
}
