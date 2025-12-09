import 'dart:convert';
import 'package:siargao_trading_road/models/supplier.dart';
import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class SupplierService {
  static Future<List<Supplier>> getSuppliers({
    String? search,
    String? status,
  }) async {
    final query = <String, String>{};
    if (search != null && search.trim().isNotEmpty) {
      query['search'] = search.trim();
    }
    if (status != null && status.trim().isNotEmpty) {
      query['status'] = status.trim();
    }
    final endpoint = query.isEmpty
        ? '/suppliers'
        : '/suppliers?${Uri(queryParameters: query).query}';
    final response = await ApiService.get(endpoint);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => Supplier.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load suppliers');
    }
  }

  static Future<List<Product>> getSupplierProducts(int supplierId) async {
    final response = await ApiService.get('/suppliers/$supplierId/products');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load supplier products');
    }
  }
}
