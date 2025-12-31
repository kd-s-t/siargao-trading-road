import 'dart:convert';
import 'package:siargao_trading_road/models/stock_history.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class StockHistoryService {
  static Future<List<StockHistory>> getProductStockHistory(int productId, {int? limit, int? offset, String? changeType}) async {
    final queryParams = <String, String>{};
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();
    if (changeType != null && changeType.isNotEmpty) queryParams['change_type'] = changeType;

    final query = queryParams.isEmpty ? '' : '?${Uri(queryParameters: queryParams).query}';
    final response = await ApiService.get('/products/$productId/stock-history$query');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => StockHistory.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to load stock history');
    }
  }
}

