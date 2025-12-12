class User {
  final int id;
  final String email;
  final String name;
  final String? phone;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? logoUrl;
  final String? bannerUrl;
  final String? facebook;
  final String? instagram;
  final String? twitter;
  final String? linkedin;
  final String? youtube;
  final String? tiktok;
  final String? website;
  final String role;
  final String? openingTime;
  final String? closingTime;
  final String? closedDaysOfWeek;
  final bool isOpen;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double? averageRating;
  final int? ratingCount;
  final List<String> featureFlags;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    this.address,
    this.latitude,
    this.longitude,
    this.logoUrl,
    this.bannerUrl,
    this.facebook,
    this.instagram,
    this.twitter,
    this.linkedin,
    this.youtube,
    this.tiktok,
    this.website,
    required this.role,
    this.openingTime,
    this.closingTime,
    this.closedDaysOfWeek,
    this.isOpen = true,
    required this.createdAt,
    required this.updatedAt,
    this.averageRating,
    this.ratingCount,
    this.featureFlags = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(String key) {
      final value = json[key];
      if (value is String) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      logoUrl: json['logo_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
      facebook: json['facebook'] as String?,
      instagram: json['instagram'] as String?,
      twitter: json['twitter'] as String?,
      linkedin: json['linkedin'] as String?,
      youtube: json['youtube'] as String?,
      tiktok: json['tiktok'] as String?,
      website: json['website'] as String?,
      role: json['role'] as String,
      openingTime: json['opening_time'] as String?,
      closingTime: json['closing_time'] as String?,
      closedDaysOfWeek: json['closed_days_of_week'] as String?,
      isOpen: json['is_open'] as bool? ?? true,
      createdAt: parseDate('created_at'),
      updatedAt: parseDate('updated_at'),
      averageRating: json['average_rating'] != null ? (json['average_rating'] as num).toDouble() : null,
      ratingCount: json['rating_count'] as int?,
      featureFlags: (json['feature_flags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'logo_url': logoUrl,
      'banner_url': bannerUrl,
      'facebook': facebook,
      'instagram': instagram,
      'twitter': twitter,
      'linkedin': linkedin,
      'youtube': youtube,
      'tiktok': tiktok,
      'website': website,
      'role': role,
      'opening_time': openingTime,
      'closing_time': closingTime,
      'closed_days_of_week': closedDaysOfWeek,
      'is_open': isOpen,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'average_rating': averageRating,
      'rating_count': ratingCount,
      'feature_flags': featureFlags,
    };
  }
}
