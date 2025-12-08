import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:siargao_trading_road/models/order.dart';
import 'package:siargao_trading_road/services/api_service.dart';
import 'package:siargao_trading_road/services/order_storage_service.dart';

class OrderService {
  static Future<List<Order>> getOrders({String? status}) async {
    final endpoint = status != null ? '/orders?status=$status' : '/orders';
    final response = await ApiService.get(endpoint);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      final orders = data.map((json) => Order.fromJson(json as Map<String, dynamic>)).toList();
      
      for (final order in orders) {
        await OrderStorageService.saveOrder(order);
      }
      
      return orders;
    } else {
      throw Exception('Failed to load orders');
    }
  }

  static Future<Order> getOrder(int id, {bool checkLocalFirst = false, bool fallbackToLocal = true, bool forceRefresh = false}) async {
    if (forceRefresh) {
      checkLocalFirst = false;
      fallbackToLocal = false;
    }
    
    if (checkLocalFirst) {
      final cachedOrder = await OrderStorageService.getOrder(id);
      if (cachedOrder != null) {
        return cachedOrder;
      }
    }

    try {
      if (kDebugMode) {
        print('Calling API: GET /orders/$id');
      }
      final response = await ApiService.get('/orders/$id');

      final responseBody = response.body;
      final statusCode = response.statusCode;

      if (onResponse != null) {
        onResponse(statusCode, responseBody);
      }

      if (kDebugMode) {
        print('API Response Status: $statusCode');
        print('API Response Body: $responseBody');
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(responseBody) as Map<String, dynamic>;
        if (kDebugMode) {
          print('API Response for order $id: ${jsonEncode(data)}');
        }
        final order = Order.fromJson(data);
        
        await OrderStorageService.saveOrder(order);
        
        return order;
      } else if (response.statusCode == 404) {
        if (kDebugMode) {
          print('Order $id not found in API (404). Response: ${response.body}');
        }
        if (fallbackToLocal) {
          final cachedOrder = await OrderStorageService.getOrder(id);
          if (cachedOrder != null) {
            if (kDebugMode) {
              print('Using cached order $id from local storage');
            }
            return cachedOrder;
          }
        }
        final errorBody = jsonDecode(response.body) as Map<String, dynamic>?;
        final errorMsg = errorBody?['error'] as String?;
        throw Exception(errorMsg ?? 'Order not found');
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        if (fallbackToLocal) {
          final cachedOrder = await OrderStorageService.getOrder(id);
          if (cachedOrder != null) {
            return cachedOrder;
          }
        }
        final errorBody = jsonDecode(response.body) as Map<String, dynamic>?;
        final errorMsg = errorBody?['error'] as String?;
        throw Exception(errorMsg ?? 'Unauthorized to view this order');
      } else {
        if (fallbackToLocal) {
          final cachedOrder = await OrderStorageService.getOrder(id);
          if (cachedOrder != null) {
            return cachedOrder;
          }
        }
        try {
          final error = jsonDecode(response.body) as Map<String, dynamic>?;
          throw Exception(error?['error'] ?? 'Failed to load order');
        } catch (e) {
          throw Exception('Failed to load order: ${response.statusCode}');
        }
      }
    } catch (e) {
      if (fallbackToLocal) {
        final cachedOrder = await OrderStorageService.getOrder(id);
        if (cachedOrder != null) {
          return cachedOrder;
        }
      }
      rethrow;
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
    String? paymentProofUrl,
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
    if (paymentProofUrl != null && paymentProofUrl.isNotEmpty) {
      body['payment_proof_url'] = paymentProofUrl;
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

  static Future<Order> markPaymentAsPaid(int orderId) async {
    final response = await ApiService.post('/orders/$orderId/payment/paid', body: {});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Order.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to mark payment as paid');
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

  static Future<Message> createMessage(int orderId, String content, {String? imageUrl}) async {
    final body = <String, dynamic>{'content': content};
    if (imageUrl != null && imageUrl.isNotEmpty) {
      body['image_url'] = imageUrl;
    }

    final response = await ApiService.post(
      '/orders/$orderId/messages',
      body: body,
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
