import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'package:siargao_trading_road/models/rating.dart';

class OrderItem {
  final int id;
  final int orderId;
  final int productId;
  final Product product;
  final int quantity;
  final double unitPrice;
  final double subtotal;
  final DateTime createdAt;
  final DateTime updatedAt;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.productId,
    required this.product,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as int,
      orderId: json['order_id'] as int,
      productId: json['product_id'] as int,
      product: Product.fromJson(json['product'] as Map<String, dynamic>),
      quantity: json['quantity'] as int,
      unitPrice: (json['unit_price'] as num).toDouble(),
      subtotal: (json['subtotal'] as num).toDouble(),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class Order {
  final int id;
  final int storeId;
  final User? store;
  final int supplierId;
  final User? supplier;
  final String status;
  final double totalAmount;
  final String? paymentMethod;
  final String? paymentStatus;
  final String? paymentProofUrl;
  final String? deliveryOption;
  final double? deliveryFee;
  final double? distance;
  final String? shippingAddress;
  final String? notes;
  final List<OrderItem> orderItems;
  final List<OrderRating>? ratings;
  final DateTime createdAt;
  final DateTime updatedAt;

  Order({
    required this.id,
    required this.storeId,
    this.store,
    required this.supplierId,
    this.supplier,
    required this.status,
    required this.totalAmount,
    this.paymentMethod,
    this.paymentStatus,
    this.paymentProofUrl,
    this.deliveryOption,
    this.deliveryFee,
    this.distance,
    this.shippingAddress,
    this.notes,
    required this.orderItems,
    this.ratings,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as int,
      storeId: json['store_id'] as int,
      store: json['store'] != null ? User.fromJson(json['store'] as Map<String, dynamic>) : null,
      supplierId: json['supplier_id'] as int,
      supplier: json['supplier'] != null ? User.fromJson(json['supplier'] as Map<String, dynamic>) : null,
      status: json['status'] as String,
      totalAmount: (json['total_amount'] as num).toDouble(),
      paymentMethod: json['payment_method'] as String?,
      paymentStatus: json['payment_status'] as String?,
      paymentProofUrl: json['payment_proof_url'] as String?,
      deliveryOption: json['delivery_option'] as String?,
      deliveryFee: json['delivery_fee'] != null ? (json['delivery_fee'] as num).toDouble() : null,
      distance: json['distance'] != null ? (json['distance'] as num).toDouble() : null,
      shippingAddress: json['shipping_address'] as String?,
      notes: json['notes'] as String?,
      orderItems: (json['order_items'] as List<dynamic>?)
          ?.map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
          .toList() ?? [],
      ratings: json['ratings'] != null
          ? (json['ratings'] as List<dynamic>)
              .map((rating) => OrderRating.fromJson(rating as Map<String, dynamic>))
              .toList()
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class Message {
  final int id;
  final int orderId;
  final int senderId;
  final MessageSender sender;
  final String content;
  final String? imageUrl;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.orderId,
    required this.senderId,
    required this.sender,
    required this.content,
    this.imageUrl,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as int,
      orderId: json['order_id'] as int,
      senderId: json['sender_id'] as int,
      sender: MessageSender.fromJson(json['sender'] as Map<String, dynamic>),
      content: json['content'] as String,
      imageUrl: json['image_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class MessageSender {
  final int id;
  final String name;
  final String role;

  MessageSender({
    required this.id,
    required this.name,
    required this.role,
  });

  factory MessageSender.fromJson(Map<String, dynamic> json) {
    return MessageSender(
      id: json['id'] as int,
      name: json['name'] as String,
      role: json['role'] as String,
    );
  }
}
