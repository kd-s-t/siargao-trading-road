class StockHistory {
  final int id;
  final int productId;
  final int previousStock;
  final int newStock;
  final int changeAmount;
  final String changeType;
  final int? orderId;
  final int? userId;
  final int? employeeId;
  final String? notes;
  final DateTime createdAt;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? employee;

  StockHistory({
    required this.id,
    required this.productId,
    required this.previousStock,
    required this.newStock,
    required this.changeAmount,
    required this.changeType,
    this.orderId,
    this.userId,
    this.employeeId,
    this.notes,
    required this.createdAt,
    this.user,
    this.employee,
  });

  factory StockHistory.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(String key) {
      final value = json[key];
      if (value is String) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    return StockHistory(
      id: json['id'] as int,
      productId: json['product_id'] as int,
      previousStock: json['previous_stock'] as int,
      newStock: json['new_stock'] as int,
      changeAmount: json['change_amount'] as int,
      changeType: json['change_type'] as String,
      orderId: json['order_id'] as int?,
      userId: json['user_id'] as int?,
      employeeId: json['employee_id'] as int?,
      notes: json['notes'] as String?,
      createdAt: parseDate('created_at'),
      user: json['user'] as Map<String, dynamic>?,
      employee: json['employee'] as Map<String, dynamic>?,
    );
  }

  String? get updatedBy {
    if (employee != null) {
      return employee!['name'] as String? ?? employee!['username'] as String?;
    }
    if (user != null) {
      return user!['name'] as String? ?? user!['username'] as String?;
    }
    return null;
  }
}

