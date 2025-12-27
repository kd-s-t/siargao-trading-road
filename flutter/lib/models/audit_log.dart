class AuditLog {
  final int id;
  final int? userId;
  final int? employeeId;
  final String? role;
  final String action;
  final String endpoint;
  final String method;
  final int statusCode;
  final String ipAddress;
  final String userAgent;
  final String? requestBody;
  final String? responseBody;
  final int durationMs;
  final String? errorMessage;
  final DateTime createdAt;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? employee;

  AuditLog({
    required this.id,
    this.userId,
    this.employeeId,
    this.role,
    required this.action,
    required this.endpoint,
    required this.method,
    required this.statusCode,
    required this.ipAddress,
    required this.userAgent,
    this.requestBody,
    this.responseBody,
    required this.durationMs,
    this.errorMessage,
    required this.createdAt,
    this.user,
    this.employee,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(String key) {
      final value = json[key];
      if (value is String) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    return AuditLog(
      id: json['id'] as int,
      userId: json['user_id'] as int?,
      employeeId: json['employee_id'] as int?,
      role: json['role'] as String?,
      action: json['action'] as String,
      endpoint: json['endpoint'] as String,
      method: json['method'] as String,
      statusCode: json['status_code'] as int,
      ipAddress: json['ip_address'] as String? ?? '',
      userAgent: json['user_agent'] as String? ?? '',
      requestBody: json['request_body'] as String?,
      responseBody: json['response_body'] as String?,
      durationMs: json['duration_ms'] as int? ?? 0,
      errorMessage: json['error_message'] as String?,
      createdAt: parseDate('created_at'),
      user: json['user'] as Map<String, dynamic>?,
      employee: json['employee'] as Map<String, dynamic>?,
    );
  }

  String get statusEmoji {
    if (statusCode >= 200 && statusCode < 300) return '✅';
    if (statusCode >= 300 && statusCode < 400) return '🔄';
    if (statusCode >= 400 && statusCode < 500) return '⚠️';
    if (statusCode >= 500) return '❌';
    return '❓';
  }

  String get methodColor {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'blue';
      case 'POST':
        return 'green';
      case 'PUT':
      case 'PATCH':
        return 'orange';
      case 'DELETE':
        return 'red';
      default:
        return 'grey';
    }
  }
}

