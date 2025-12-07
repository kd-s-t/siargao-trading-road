import 'dart:convert';
import 'package:siargao_trading_road/models/schedule_exception.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class ScheduleService {
  static Future<List<ScheduleException>> getScheduleExceptions() async {
    final response = await ApiService.get('/schedule/exceptions');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => ScheduleException.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to fetch schedule exceptions');
    }
  }

  static Future<ScheduleException> createScheduleException({
    required DateTime date,
    required bool isClosed,
    String? openingTime,
    String? closingTime,
    String notes = '',
  }) async {
    final response = await ApiService.post(
      '/schedule/exceptions',
      body: {
        'date': date.toIso8601String().split('T')[0],
        'is_closed': isClosed,
        'opening_time': openingTime,
        'closing_time': closingTime,
        'notes': notes,
      },
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return ScheduleException.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to create schedule exception');
    }
  }

  static Future<ScheduleException> updateScheduleException({
    required int id,
    bool? isClosed,
    String? openingTime,
    String? closingTime,
    String? notes,
  }) async {
    final body = <String, dynamic>{};
    if (isClosed != null) body['is_closed'] = isClosed;
    if (openingTime != null) body['opening_time'] = openingTime;
    if (closingTime != null) body['closing_time'] = closingTime;
    if (notes != null) body['notes'] = notes;

    final response = await ApiService.put(
      '/schedule/exceptions/$id',
      body: body,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return ScheduleException.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to update schedule exception');
    }
  }

  static Future<void> deleteScheduleException(int id) async {
    final response = await ApiService.delete('/schedule/exceptions/$id');

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to delete schedule exception');
    }
  }

  static Future<List<ScheduleException>> bulkCreateScheduleExceptions({
    required List<DateTime> dates,
    required bool isClosed,
    String notes = '',
  }) async {
    final response = await ApiService.post(
      '/schedule/exceptions/bulk',
      body: {
        'dates': dates.map((d) => d.toIso8601String().split('T')[0]).toList(),
        'is_closed': isClosed,
        'notes': notes,
      },
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final exceptions = data['exceptions'] as List<dynamic>;
      return exceptions.map((json) => ScheduleException.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to create schedule exceptions');
    }
  }
}
