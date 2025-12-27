import 'dart:convert';
import 'package:siargao_trading_road/models/audit_log.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class AuditLogService {
  static Future<Map<String, dynamic>> fetchAuditLogs({
    int? userId,
    int? employeeId,
    String? role,
    String? endpoint,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (userId != null) {
      queryParams['user_id'] = userId.toString();
    }
    if (employeeId != null) {
      queryParams['employee_id'] = employeeId.toString();
    }
    if (role != null && role.isNotEmpty) {
      queryParams['role'] = role;
    }
    if (endpoint != null && endpoint.isNotEmpty) {
      queryParams['endpoint'] = endpoint;
    }

    final queryString = queryParams.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');

    final response = await ApiService.get('/audit-logs?$queryString');
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final logs = (data['data'] as List<dynamic>)
          .map((e) => AuditLog.fromJson(e as Map<String, dynamic>))
          .toList();
      
      return {
        'logs': logs,
        'pagination': data['pagination'] as Map<String, dynamic>,
      };
    }
    
    final error = jsonDecode(response.body) as Map<String, dynamic>;
    throw Exception(error['error'] ?? 'Failed to fetch audit logs');
  }

  static Future<List<AuditLog>> fetchEmployeeAuditLogs(
    int employeeId, {
    int page = 1,
    int limit = 50,
  }) async {
    final result = await fetchAuditLogs(
      employeeId: employeeId,
      page: page,
      limit: limit,
    );
    return result['logs'] as List<AuditLog>;
  }
}

