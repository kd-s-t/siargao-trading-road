class Supplier {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String description;
  final int productCount;
  final String? logoUrl;
  final String? bannerUrl;
  final bool? isOpen;
  final String? openingTime;
  final String? closingTime;

  Supplier({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.description,
    required this.productCount,
    this.logoUrl,
    this.bannerUrl,
    this.isOpen,
    this.openingTime,
    this.closingTime,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    bool? parseIsOpen() {
      if (!json.containsKey('is_open')) return null;
      final value = json['is_open'];
      if (value == null) return null;
      if (value is bool) return value;
      if (value is int) return value != 0;
      if (value is String) {
        final lower = value.toLowerCase().trim();
        if (lower == 'true' || lower == '1' || lower == 'yes') return true;
        if (lower == 'false' || lower == '0' || lower == 'no') return false;
      }
      return null;
    }

    return Supplier(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      description: json['description'] as String,
      productCount: json['product_count'] as int,
      logoUrl: json['logo_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
      isOpen: parseIsOpen(),
      openingTime: json['opening_time'] as String?,
      closingTime: json['closing_time'] as String?,
    );
  }
}
