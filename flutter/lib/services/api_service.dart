import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://192.168.31.76:3020/api',
  );

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  static Future<http.Response> get(String endpoint) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      ).timeout(const Duration(seconds: 30));
      return response;
    } catch (e) {
      if (e is SocketException || e.toString().contains('Network Error')) {
        throw Exception('Cannot connect to server. Please check your API URL.');
      }
      rethrow;
    }
  }

  static Future<http.Response> post(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(const Duration(seconds: 30));
      return response;
    } catch (e) {
      if (e is SocketException || e.toString().contains('Network Error')) {
        throw Exception('Cannot connect to server. Please check your API URL.');
      }
      rethrow;
    }
  }

  static Future<http.Response> put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(const Duration(seconds: 30));
      return response;
    } catch (e) {
      if (e is SocketException || e.toString().contains('Network Error')) {
        throw Exception('Cannot connect to server. Please check your API URL.');
      }
      rethrow;
    }
  }

  static Future<http.Response> delete(String endpoint) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      ).timeout(const Duration(seconds: 30));
      return response;
    } catch (e) {
      if (e is SocketException || e.toString().contains('Network Error')) {
        throw Exception('Cannot connect to server. Please check your API URL.');
      }
      rethrow;
    }
  }

  static Future<http.Response> postMultipart(
    String endpoint,
    String filePath,
    String fieldName,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));
      
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      
      request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));
      
      final streamedResponse = await request.send().timeout(const Duration(seconds: 60));
      return await http.Response.fromStream(streamedResponse);
    } catch (e) {
      if (e is SocketException || e.toString().contains('Network Error')) {
        throw Exception('Cannot connect to server. Please check your API URL.');
      }
      rethrow;
    }
  }
}
