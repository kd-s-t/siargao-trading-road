import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siargao_trading_road/services/api_service.dart';
import 'package:siargao_trading_road/services/notification_handler.dart';

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  String? _fcmToken;
  StreamController<RemoteMessage>? _messageController;
  
  String? get fcmToken => _fcmToken;
  Stream<RemoteMessage>? get messageStream => _messageController?.stream;

  Future<void> initialize() async {
    try {
      await _requestPermissions();
      await _initializeLocalNotifications();
      await _getFCMToken();
      _setupMessageHandlers();
      _setupTokenRefresh();
    } catch (e) {
      if (kDebugMode) {
        print('FCM initialization error: $e');
      }
    }
  }

  Future<void> _requestPermissions() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (kDebugMode) {
      print('FCM Permission Status: ${settings.authorizationStatus}');
      print('FCM Alert: ${settings.alert}');
      print('FCM Badge: ${settings.badge}');
      print('FCM Sound: ${settings.sound}');
    }
  }

  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(initSettings);

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'siargao_trading_channel',
      'Siargao Trading Notifications',
      description: 'Notifications for orders, status updates, and messages',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<void> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      if (_fcmToken != null) {
        await _saveTokenToBackend(_fcmToken!);
        if (kDebugMode) {
          print('FCM Token: $_fcmToken');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error getting FCM token: $e');
      }
    }
  }

  Future<void> _saveTokenToBackend(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedToken = prefs.getString('fcm_token');
      
      if (savedToken != token) {
        await ApiService.post('/users/fcm-token', body: {'fcm_token': token});
        await prefs.setString('fcm_token', token);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error saving FCM token to backend: $e');
      }
    }
  }

  void _setupTokenRefresh() {
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      _fcmToken = newToken;
      _saveTokenToBackend(newToken);
      if (kDebugMode) {
        print('FCM Token refreshed: $newToken');
      }
    });
  }

  void _setupMessageHandlers() {
    _messageController = StreamController<RemoteMessage>.broadcast();

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _handleForegroundMessage(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationTap(message);
    });

    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        _handleNotificationTap(message);
      }
    });
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    if (kDebugMode) {
      print('Foreground message received: ${message.messageId}');
      print('Foreground message data: ${message.data}');
    }

    _messageController?.add(message);

    final notification = message.notification;
    final data = message.data;
    final type = data['type'] as String?;

    String title = notification?.title ?? 'New Message';
    String body = notification?.body ?? 'You have a new message';

    if (type == 'new_message' && notification == null) {
      title = 'New Message';
      body = 'You have a new message in your order';
    }

      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'siargao_trading_channel',
        'Siargao Trading Notifications',
        channelDescription: 'Notifications for orders, status updates, and messages',
        importance: Importance.high,
        priority: Priority.high,
        showWhen: true,
      );

      const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
        interruptionLevel: InterruptionLevel.active,
      );

      const NotificationDetails details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.show(
      message.hashCode,
      title,
      body,
        details,
      );
  }

  void _handleNotificationTap(RemoteMessage message) {
    if (kDebugMode) {
      print('Notification tapped: ${message.data}');
    }
    _messageController?.add(message);
    NotificationHandler.handleNotification(message);
  }

  Future<void> deleteToken() async {
    try {
      await _firebaseMessaging.deleteToken();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
      _fcmToken = null;
    } catch (e) {
      if (kDebugMode) {
        print('Error deleting FCM token: $e');
      }
    }
  }

  void dispose() {
    _messageController?.close();
    _messageController = null;
  }
}

Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  
  if (kDebugMode) {
    print('Background message received: ${message.messageId}');
    print('Background message data: ${message.data}');
    print('Background message notification: ${message.notification?.title} - ${message.notification?.body}');
  }

  final FlutterLocalNotificationsPlugin localNotifications = FlutterLocalNotificationsPlugin();
  
  const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
    requestAlertPermission: true,
    requestBadgePermission: true,
    requestSoundPermission: true,
  );

  const InitializationSettings initSettings = InitializationSettings(
    android: androidSettings,
    iOS: iosSettings,
  );

  await localNotifications.initialize(initSettings);

  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'siargao_trading_channel',
    'Siargao Trading Notifications',
    description: 'Notifications for orders, status updates, and messages',
    importance: Importance.high,
    playSound: true,
  );

  await localNotifications
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  final notification = message.notification;
  final data = message.data;
  final type = data['type'] as String?;
  
  String title = 'New Message';
  String body = 'You have a new message';
  
  if (notification != null) {
    title = notification.title ?? title;
    body = notification.body ?? body;
  } else if (type == 'new_message') {
    title = 'New Message';
    body = 'You have a new message in your order';
  }

  const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
    'siargao_trading_channel',
    'Siargao Trading Notifications',
    channelDescription: 'Notifications for orders, status updates, and messages',
    importance: Importance.high,
    priority: Priority.high,
    showWhen: true,
  );

  const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
    presentAlert: true,
    presentBadge: true,
    presentSound: true,
    interruptionLevel: InterruptionLevel.active,
  );

  const NotificationDetails details = NotificationDetails(
    android: androidDetails,
    iOS: iosDetails,
  );

  try {
    await localNotifications.show(
      message.hashCode,
      title,
      body,
      details,
    );
    if (kDebugMode) {
      print('Background notification shown successfully');
    }
  } catch (e) {
    if (kDebugMode) {
      print('Error showing background notification: $e');
    }
  }
}
