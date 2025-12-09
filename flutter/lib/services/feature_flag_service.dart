import 'dart:convert';
import 'package:siargao_trading_road/services/api_service.dart';

class FeatureFlagService {
  static const String onboardingFlag = 'onboarding_completed';

  static Future<bool> checkFeatureFlag(String flag) async {
    try {
      final response = await ApiService.get('/feature-flags/$flag');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final exists = data['exists'] as bool? ?? false;
        return exists;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static Future<void> setFeatureFlag(String flag) async {
    try {
      await ApiService.post('/feature-flags/$flag', body: {});
    } catch (e) {
      // Silently fail - not critical
    }
  }

  static Future<bool> shouldShowOnboarding() async {
    try {
      final exists = await checkFeatureFlag(onboardingFlag);
      return !exists;
    } catch (e) {
      return true;
    }
  }

  static Future<void> completeOnboarding() async {
    await setFeatureFlag(onboardingFlag);
  }
}
