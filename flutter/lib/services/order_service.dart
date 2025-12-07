import 'dart:convert';
import 'package:siargao_trading_road/models/order.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class OrderService {
  static Future<List<Order>> getOrders() async {
    final response = await ApiService.get('/orders');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => Order.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load orders');
    }
  }

  static Future<Order> getOrder(int id) async {
    final response = await ApiService.get('/orders/$id');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else if (response.statusCode == 404) {
      final errorBody = jsonDecode(response.body) as Map<String, dynamic>?;
      final errorMsg = errorBody?['error'] as String?;
      throw Exception(errorMsg ?? 'Order not found');
    } else {
      try {
        final error = jsonDecode(response.body) as Map<String, dynamic>?;
        throw Exception(error?['error'] ?? 'Failed to load order');
      } catch (e) {
        throw Exception('Failed to load order: ${response.statusCode}');
      }
    }
  }

  static Future<Order> updateOrderStatus(int id, String status) async {
    final response = await ApiService.put(
      '/orders/$id/status',
      body: {'status': status},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to update order status');
    }
  }

  static Future<Order?> getDraftOrder({int? supplierId}) async {
    try {
      final endpoint = supplierId != null
          ? '/orders/draft?supplier_id=$supplierId'
          : '/orders/draft';
      final response = await ApiService.get(endpoint);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return Order.fromJson(data);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Failed to load draft order');
      }
    } catch (e) {
      if (e.toString().contains('404')) {
        return null;
      }
      rethrow;
    }
  }

  static Future<Order> createDraftOrder(int supplierId) async {
    final response = await ApiService.post(
      '/orders/draft',
      body: {'supplier_id': supplierId},
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to create draft order');
    }
  }

  static Future<Order> addOrderItem(int orderId, int productId, int quantity) async {
    final response = await ApiService.post(
      '/orders/$orderId/items',
      body: {
        'product_id': productId,
        'quantity': quantity,
      },
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to add item to order');
    }
  }

  static Future<Order> updateOrderItem(int itemId, int quantity) async {
    final response = await ApiService.put(
      '/orders/items/$itemId',
      body: {'quantity': quantity},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to update order item');
    }
  }

  static Future<void> removeOrderItem(int itemId) async {
    final response = await ApiService.delete('/orders/items/$itemId');

    if (response.statusCode != 200 && response.statusCode != 204) {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to remove order item');
    }
  }

  static Future<Order> submitOrder(
    int orderId, {
    required String paymentMethod,
    required String deliveryOption,
    double deliveryFee = 0.0,
    double distance = 0.0,
    String? shippingAddress,
    String? notes,
  }) async {
    final body = <String, dynamic>{
      'payment_method': paymentMethod,
      'delivery_option': deliveryOption,
      'delivery_fee': deliveryFee,
      'distance': distance,
    };
    if (shippingAddress != null && shippingAddress.isNotEmpty) {
      body['shipping_address'] = shippingAddress;
    }
    if (notes != null && notes.isNotEmpty) {
      body['notes'] = notes;
    }

    final response = await ApiService.post('/orders/$orderId/submit', body: body);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to submit order');
    }
  }

  static Future<List<Message>> getMessages(int orderId) async {
    final response = await ApiService.get('/orders/$orderId/messages');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data.map((json) => Message.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load messages');
    }
  }

  static Future<Message> createMessage(int orderId, String content) async {
    final response = await ApiService.post(
      '/orders/$orderId/messages',
      body: {'content': content},
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Message.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to send message');
    }
  }
}
