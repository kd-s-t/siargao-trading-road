class Employee {
  final int id;
  final int ownerUserId;
  final String username;
  final String? name;
  final String? phone;
  final String? role;
  final bool canManageInventory;
  final bool canManageOrders;
  final bool canChat;
  final bool canChangeStatus;
  final bool canRate;
  final bool statusActive;
  final String? profilePicUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  Employee({
    required this.id,
    required this.ownerUserId,
    required this.username,
    this.name,
    this.phone,
    this.role,
    required this.canManageInventory,
    required this.canManageOrders,
    required this.canChat,
    required this.canChangeStatus,
    required this.canRate,
    required this.statusActive,
    this.profilePicUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(String key) {
      final value = json[key];
      if (value is String) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    return Employee(
      id: json['id'] as int,
      ownerUserId: json['owner_user_id'] as int,
      username: json['username'] as String,
      name: json['name'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String?,
      canManageInventory: json['can_manage_inventory'] as bool? ?? false,
      canManageOrders: json['can_manage_orders'] as bool? ?? false,
      canChat: json['can_chat'] as bool? ?? false,
      canChangeStatus: json['can_change_status'] as bool? ?? false,
      canRate: json['can_rate'] as bool? ?? false,
      statusActive: json['status_active'] as bool? ?? false,
      profilePicUrl: json['profile_pic_url'] as String?,
      createdAt: parseDate('created_at'),
      updatedAt: parseDate('updated_at'),
    );
  }
}

