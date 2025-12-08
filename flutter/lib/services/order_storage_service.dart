import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siargao_trading_road/models/order.dart';

class OrderStorageService {
  static const String _ordersKey = 'cached_orders';
  static const String _orderPrefix = 'order_';

  static Future<void> saveOrder(Order order) async {
    final prefs = await SharedPreferences.getInstance();
    final orderJson = jsonEncode(order.toJson());
    await prefs.setString('$_orderPrefix${order.id}', orderJson);
    
    final cachedIds = prefs.getStringList(_ordersKey) ?? [];
    if (!cachedIds.contains(order.id.toString())) {
      cachedIds.add(order.id.toString());
      await prefs.setStringList(_ordersKey, cachedIds);
    }
  }

  static Future<Order?> getOrder(int orderId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final orderJson = prefs.getString('$_orderPrefix$orderId');
      
      if (orderJson != null) {
        final orderMap = jsonDecode(orderJson) as Map<String, dynamic>;
        return Order.fromJson(orderMap);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<Order>> getAllCachedOrders() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedIds = prefs.getStringList(_ordersKey) ?? [];
      final orders = <Order>[];
      
      for (final idStr in cachedIds) {
        final order = await getOrder(int.parse(idStr));
        if (order != null) {
          orders.add(order);
        }
      }
      
      return orders;
    } catch (e) {
      return [];
    }
  }

  static Future<void> removeOrder(int orderId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_orderPrefix$orderId');
    
    final cachedIds = prefs.getStringList(_ordersKey) ?? [];
    cachedIds.remove(orderId.toString());
    await prefs.setStringList(_ordersKey, cachedIds);
  }

  static Future<void> clearAllOrders() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedIds = prefs.getStringList(_ordersKey) ?? [];
    
    for (final idStr in cachedIds) {
      await prefs.remove('$_orderPrefix$idStr');
    }
    
    await prefs.remove(_ordersKey);
  }
}
