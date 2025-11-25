/// Modelo de dados: Usuário
class User {
  final String userId;
  final String name;
  final String phone;
  final bool hasConfig;
  final bool isActive;

  User({
    required this.userId,
    required this.name,
    required this.phone,
    required this.hasConfig,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['userId'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      hasConfig: json['hasConfig'] as bool,
      isActive: json['isActive'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'name': name,
      'phone': phone,
      'hasConfig': hasConfig,
      'isActive': isActive,
    };
  }
}

