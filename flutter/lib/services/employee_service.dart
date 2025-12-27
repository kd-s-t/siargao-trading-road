import 'dart:convert';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class EmployeeService {
  static Future<List<Employee>> fetchEmployees() async {
    final response = await ApiService.get('/employees');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((e) => Employee.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Failed to fetch employees');
  }

  static Future<Employee> createEmployee({
    required String username,
    required String password,
    String? name,
    String? phone,
    String? role,
    bool canManageInventory = true,
    bool canManageOrders = true,
    bool canChat = true,
    bool canChangeStatus = true,
    bool statusActive = true,
  }) async {
    final body = <String, dynamic>{
      'username': username,
      'password': password,
      'name': name,
      'phone': phone,
      'role': role,
      'can_manage_inventory': canManageInventory,
      'can_manage_orders': canManageOrders,
      'can_chat': canChat,
      'can_change_status': canChangeStatus,
      'status_active': statusActive,
    };
    final response = await ApiService.post('/employees', body: body);
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Employee.fromJson(data);
    }
    final error = jsonDecode(response.body) as Map<String, dynamic>;
    throw Exception(error['error'] ?? 'Failed to create employee');
  }

  static Future<Employee> updateEmployee(
    int id, {
    String? username,
    String? password,
    String? name,
    String? phone,
    String? role,
    bool? canManageInventory,
    bool? canManageOrders,
    bool? canChat,
    bool? canChangeStatus,
    bool? statusActive,
  }) async {
    final body = <String, dynamic>{};
    if (username != null) body['username'] = username;
    if (password != null) body['password'] = password;
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (role != null) body['role'] = role;
    if (canManageInventory != null) body['can_manage_inventory'] = canManageInventory;
    if (canManageOrders != null) body['can_manage_orders'] = canManageOrders;
    if (canChat != null) body['can_chat'] = canChat;
    if (canChangeStatus != null) body['can_change_status'] = canChangeStatus;
    if (statusActive != null) body['status_active'] = statusActive;

    final response = await ApiService.patch('/employees/$id', body: body);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Employee.fromJson(data);
    }
    final error = jsonDecode(response.body) as Map<String, dynamic>;
    throw Exception(error['error'] ?? 'Failed to update employee');
  }

  static Future<Employee> getMyEmployee() async {
    final response = await ApiService.get('/me/employee');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Employee.fromJson(data);
    }
    final error = jsonDecode(response.body) as Map<String, dynamic>;
    throw Exception(error['error'] ?? 'Failed to get employee info');
  }
}

