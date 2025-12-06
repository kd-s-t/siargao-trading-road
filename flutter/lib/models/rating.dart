import 'package:siargao_trading_road/models/user.dart';

class RatingUser {
  final int id;
  final String name;
  final String email;

  RatingUser({
    required this.id,
    required this.name,
    required this.email,
  });

  factory RatingUser.fromJson(Map<String, dynamic> json) {
    return RatingUser(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}

class OrderRating {
  final int id;
  final int orderId;
  final int raterId;
  final RatingUser? rater;
  final int ratedId;
  final RatingUser? rated;
  final int rating;
  final String? comment;
  final DateTime createdAt;
  final OrderInfo? order;

  OrderRating({
    required this.id,
    required this.orderId,
    required this.raterId,
    this.rater,
    required this.ratedId,
    this.rated,
    required this.rating,
    this.comment,
    required this.createdAt,
    this.order,
  });

  factory OrderRating.fromJson(Map<String, dynamic> json) {
    return OrderRating(
      id: json['id'] as int,
      orderId: json['order_id'] as int,
      raterId: json['rater_id'] as int,
      rater: json['rater'] != null ? RatingUser.fromJson(json['rater'] as Map<String, dynamic>) : null,
      ratedId: json['rated_id'] as int,
      rated: json['rated'] != null ? RatingUser.fromJson(json['rated'] as Map<String, dynamic>) : null,
      rating: json['rating'] as int,
      comment: json['comment'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      order: json['order'] != null ? OrderInfo.fromJson(json['order'] as Map<String, dynamic>) : null,
    );
  }
}

class OrderInfo {
  final int id;
  final int storeId;
  final int supplierId;
  final OrderStore? store;
  final OrderSupplier? supplier;
  final String status;
  final double totalAmount;
  final DateTime createdAt;

  OrderInfo({
    required this.id,
    required this.storeId,
    required this.supplierId,
    this.store,
    this.supplier,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
  });

  factory OrderInfo.fromJson(Map<String, dynamic> json) {
    return OrderInfo(
      id: json['id'] as int,
      storeId: json['store_id'] as int,
      supplierId: json['supplier_id'] as int,
      store: json['store'] != null ? OrderStore.fromJson(json['store'] as Map<String, dynamic>) : null,
      supplier: json['supplier'] != null ? OrderSupplier.fromJson(json['supplier'] as Map<String, dynamic>) : null,
      status: json['status'] as String,
      totalAmount: (json['total_amount'] as num).toDouble(),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class OrderStore {
  final int id;
  final String name;
  final String email;

  OrderStore({
    required this.id,
    required this.name,
    required this.email,
  });

  factory OrderStore.fromJson(Map<String, dynamic> json) {
    return OrderStore(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}

class OrderSupplier {
  final int id;
  final String name;
  final String email;

  OrderSupplier({
    required this.id,
    required this.name,
    required this.email,
  });

  factory OrderSupplier.fromJson(Map<String, dynamic> json) {
    return OrderSupplier(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}
