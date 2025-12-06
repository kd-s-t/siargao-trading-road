import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/navigation/app_navigator.dart';
import 'package:siargao_trading_road/utils/error_handler.dart';

void main() {
  ErrorHandler.setupErrorHandling();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Siargao Trading Road',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          primaryColor: const Color(0xFF1976D2),
          scaffoldBackgroundColor: Colors.white,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1976D2),
            primary: const Color(0xFF1976D2),
            secondary: const Color(0xFF38B2AC),
          ),
          useMaterial3: true,
        ),
        home: const AppNavigator(),
      ),
    );
  }
}
