import 'package:siargao_trading_road/models/product.dart';

class Supplier {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String description;
  final int productCount;
  final String? logoUrl;
  final String? bannerUrl;

  Supplier({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.description,
    required this.productCount,
    this.logoUrl,
    this.bannerUrl,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      description: json['description'] as String,
      productCount: json['product_count'] as int,
      logoUrl: json['logo_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
    );
  }
}
