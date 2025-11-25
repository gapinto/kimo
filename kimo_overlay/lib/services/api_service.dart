import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/criteria.dart';
import '../models/ride_analysis.dart';
import '../models/stats.dart';

/// Serviço de comunicação com a API Backend
class ApiService {
  // URL base da API (Railway)
  static const String baseUrl = 'https://kimo-production.up.railway.app/api/mobile';
  
  // Timeout para requisições
  static const Duration timeout = Duration(seconds: 10);

  /// POST /auth - Autentica usuário pelo telefone
  Future<User> authenticate(String phone) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'phone': phone}),
          )
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        return User.fromJson(data);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['error']['message'] ?? 'Erro ao autenticar',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e', 500);
    }
  }

  /// GET /criteria/:userId - Busca critérios de aceitação
  Future<AcceptanceCriteria> getCriteria(String userId) async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/criteria/$userId'))
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        return AcceptanceCriteria.fromJson(data);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['error']['message'] ?? 'Erro ao buscar critérios',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e', 500);
    }
  }

  /// POST /analyze - Analisa uma corrida
  Future<RideAnalysis> analyzeRide(String userId, double value, double km) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/analyze'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'userId': userId,
              'value': value,
              'km': km,
            }),
          )
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        return RideAnalysis.fromJson(data);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['error']['message'] ?? 'Erro ao analisar corrida',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e', 500);
    }
  }

  /// POST /decision - Registra decisão do motorista
  Future<void> registerDecision({
    required String userId,
    required double value,
    required double km,
    required bool accepted,
    double? fuel,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/decision'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'userId': userId,
              'value': value,
              'km': km,
              'accepted': accepted,
              if (fuel != null) 'fuel': fuel,
            }),
          )
          .timeout(timeout);

      if (response.statusCode != 200) {
        final error = json.decode(response.body);
        throw ApiException(
          error['error']['message'] ?? 'Erro ao registrar decisão',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e', 500);
    }
  }

  /// GET /stats/:userId - Busca estatísticas
  Future<Stats> getStats(String userId) async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/stats/$userId'))
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        return Stats.fromJson(data);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['error']['message'] ?? 'Erro ao buscar estatísticas',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e', 500);
    }
  }
}

/// Exceção customizada para erros da API
class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

