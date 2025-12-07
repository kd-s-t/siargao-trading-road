class ScheduleException {
  final int id;
  final int userId;
  final DateTime date;
  final bool isClosed;
  final String? openingTime;
  final String? closingTime;
  final String notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  ScheduleException({
    required this.id,
    required this.userId,
    required this.date,
    required this.isClosed,
    this.openingTime,
    this.closingTime,
    required this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ScheduleException.fromJson(Map<String, dynamic> json) {
    return ScheduleException(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      date: DateTime.parse(json['date'] as String),
      isClosed: json['is_closed'] as bool,
      openingTime: json['opening_time'] as String?,
      closingTime: json['closing_time'] as String?,
      notes: json['notes'] as String? ?? '',
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'date': date.toIso8601String().split('T')[0],
      'is_closed': isClosed,
      'opening_time': openingTime,
      'closing_time': closingTime,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
