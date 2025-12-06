import 'dart:convert';
import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class ProductService {
  static Future<List<Product>> getProducts({bool includeDeleted = false}) async {
    final response = await ApiService.get(
      '/products?include_deleted=$includeDeleted',
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load products');
    }
  }

  static Future<Product> getProduct(int id) async {
    final response = await ApiService.get('/products/$id');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Product.fromJson(data);
    } else {
      throw Exception('Failed to load product');
    }
  }

  static Future<Product> createProduct({
    required String name,
    String? description,
    required String sku,
    required double price,
    int? stockQuantity,
    String? unit,
    String? category,
    String? imageUrl,
  }) async {
    final body = <String, dynamic>{
      'name': name,
      'sku': sku,
      'price': price,
    };
    
    if (description != null) body['description'] = description;
    if (stockQuantity != null) body['stock_quantity'] = stockQuantity;
    if (unit != null) body['unit'] = unit;
    if (category != null) body['category'] = category;
    if (imageUrl != null) body['image_url'] = imageUrl;

    final response = await ApiService.post('/products', body: body);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Product.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to create product');
    }
  }

  static Future<Product> updateProduct(int id, {
    String? name,
    String? description,
    String? sku,
    double? price,
    int? stockQuantity,
    String? unit,
    String? category,
    String? imageUrl,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (description != null) body['description'] = description;
    if (sku != null) body['sku'] = sku;
    if (price != null) body['price'] = price;
    if (stockQuantity != null) body['stock_quantity'] = stockQuantity;
    if (unit != null) body['unit'] = unit;
    if (category != null) body['category'] = category;
    if (imageUrl != null) body['image_url'] = imageUrl;

    final response = await ApiService.put('/products/$id', body: body);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Product.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to update product');
    }
  }

  static Future<void> deleteProduct(int id) async {
    final response = await ApiService.delete('/products/$id');

    if (response.statusCode != 200 && response.statusCode != 204) {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to delete product');
    }
  }

  static Future<Product> restoreProduct(int id) async {
    final response = await ApiService.post('/products/$id/restore', body: {});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Product.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to restore product');
    }
  }
}
