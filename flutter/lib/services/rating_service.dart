import 'dart:convert';
import 'package:siargao_trading_road/models/rating.dart';
import 'package:siargao_trading_road/services/api_service.dart';

class RatingService {
  static Future<List<OrderRating>> getMyRatings() async {
    final response = await ApiService.get('/me/ratings');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final ratings = data['ratings'] as List<dynamic>;
      return ratings.map((json) => OrderRating.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load ratings');
    }
  }

  static Future<OrderRating> createRating({
    required int orderId,
    required int ratedId,
    required int rating,
    String? comment,
  }) async {
    final body = <String, dynamic>{
      'rated_id': ratedId,
      'rating': rating,
    };
    if (comment != null) body['comment'] = comment;

    final response = await ApiService.post('/orders/$orderId/rating', body: body);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return OrderRating.fromJson(data);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(error['error'] ?? 'Failed to create rating');
    }
  }
}
