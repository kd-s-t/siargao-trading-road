import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:siargao_trading_road/navigation/store_drawer.dart';
import 'package:siargao_trading_road/navigation/supplier_drawer.dart';
import 'package:siargao_trading_road/navigation/admin_drawer.dart';

class NotificationHandler {
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  static void handleNotification(RemoteMessage message) {
    if (kDebugMode) {
      print('Handling notification: ${message.data}');
    }

    final data = message.data;
    final type = data['type'] as String?;
    final orderId = data['order_id'] as String?;

    if (orderId == null) {
      if (kDebugMode) {
        print('No order_id in notification data');
      }
      return;
    }

    final orderIdInt = int.tryParse(orderId);
    if (orderIdInt == null) {
      if (kDebugMode) {
        print('Invalid order_id: $orderId');
      }
      return;
    }

    BuildContext? context = navigatorKey.currentContext;
    
    if (context == null) {
      context = StoreDrawer.navigatorKey.currentContext;
    }
    
    if (context == null) {
      context = SupplierDrawer.navigatorKey.currentContext;
    }
    
    if (context == null) {
      context = AdminDrawer.navigatorKey.currentContext;
    }

    if (context == null) {
      if (kDebugMode) {
        print('No navigator context available, cannot navigate');
      }
      return;
    }

    switch (type) {
      case 'new_order':
      case 'order_status_update':
      case 'new_message':
        _navigateToOrderDetail(context, orderIdInt);
        break;
      default:
        if (kDebugMode) {
          print('Unknown notification type: $type');
        }
        _navigateToOrderDetail(context, orderIdInt);
        break;
    }
  }

  static void _navigateToOrderDetail(BuildContext context, int orderId) {
    Navigator.of(context).pushNamed(
      '/order-detail',
      arguments: {'orderId': orderId},
    );
  }
}
