import 'package:flutter/foundation.dart';
import 'package:siargao_trading_road/services/bug_report_service.dart';

class ErrorHandler {
  static void setupErrorHandling() {
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      BugReportService.reportError(
        details.exception,
        'Flutter Error',
        stackTrace: details.stack,
      );
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      BugReportService.reportError(
        error,
        'Platform Error',
        stackTrace: stack,
      );
      return true;
    };
  }
}
