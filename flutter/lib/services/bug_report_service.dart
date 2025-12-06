import 'dart:convert';
import 'dart:io';
import 'package:siargao_trading_road/services/api_service.dart';

class BugReportService {
  static Future<void> reportError(
    Object error,
    String title, {
    StackTrace? stackTrace,
  }) async {
    try {
      final deviceInfo = <String, dynamic>{
        'platform': Platform.operatingSystem,
        'version': Platform.operatingSystemVersion,
      };

      await ApiService.post('/bug-reports', body: {
        'platform': Platform.operatingSystem,
        'title': title,
        'description': error.toString(),
        'error_type': error.runtimeType.toString(),
        'stack_trace': stackTrace?.toString() ?? '',
        'device_info': jsonEncode(deviceInfo),
        'app_version': '1.0.0',
        'os_version': Platform.operatingSystemVersion,
      });
    } catch (e) {
      print('Failed to report bug: $e');
    }
  }
}
