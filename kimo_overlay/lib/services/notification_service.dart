import 'dart:async';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/overlay_service.dart';
import '../services/storage_service.dart';

/// Serviço de Detecção de Notificações
/// 
/// NOTA: A detecção real de notificações requer implementação nativa
/// (Android: NotificationListenerService, iOS: limitado)
/// Este é um esqueleto que será completado com código nativo
class NotificationService {
  static const MethodChannel _channel = MethodChannel('com.kimo.overlay/notifications');
  
  final ApiService _apiService;
  final StorageService _storageService;
  
  StreamController<Map<String, double>>? _notificationController;
  bool _isListening = false;

  NotificationService(this._apiService, this._storageService);

  /// Inicia escuta de notificações
  Future<void> startListening() async {
    if (_isListening) return;

    try {
      // Verificar se tem permissão
      final hasPermission = await _channel.invokeMethod('hasNotificationPermission');
      if (!hasPermission) {
        throw Exception('Sem permissão para ler notificações');
      }

      _notificationController = StreamController<Map<String, double>>.broadcast();
      _isListening = true;

      // Configurar listener nativo
      _channel.setMethodCallHandler(_handleNotification);
      
      await _channel.invokeMethod('startListening');
    } catch (e) {
      _isListening = false;
      rethrow;
    }
  }

  /// Para escuta de notificações
  Future<void> stopListening() async {
    if (!_isListening) return;

    try {
      await _channel.invokeMethod('stopListening');
      await _notificationController?.close();
      _notificationController = null;
      _isListening = false;
    } catch (e) {
      // Ignora erros ao parar
    }
  }

  /// Solicita permissão de notificações
  Future<bool> requestPermission() async {
    try {
      return await _channel.invokeMethod('requestNotificationPermission');
    } catch (e) {
      return false;
    }
  }

  /// Verifica se tem permissão
  Future<bool> hasPermission() async {
    try {
      return await _channel.invokeMethod('hasNotificationPermission');
    } catch (e) {
      return false;
    }
  }

  /// Handler para notificações recebidas
  Future<void> _handleNotification(MethodCall call) async {
    if (call.method == 'onNotificationReceived') {
      try {
        final Map<dynamic, dynamic> args = call.arguments;
        final String packageName = args['packageName'] as String;
        final String text = args['text'] as String;

        // Verificar se é Uber ou 99
        if (!_isUberOr99(packageName)) {
          return;
        }

        // Extrair valor e km da notificação
        final rideData = _extractRideData(text);
        if (rideData == null) {
          return;
        }

        // Notificar listeners
        _notificationController?.add(rideData);

        // Analisar corrida automaticamente
        await _analyzeAndShowOverlay(rideData['value']!, rideData['km']!);
      } catch (e) {
        // Log erro mas não interrompe
        print('Erro ao processar notificação: $e');
      }
    }
  }

  /// Verifica se é Uber ou 99
  bool _isUberOr99(String packageName) {
    return packageName.contains('uber') || 
           packageName.contains('99') ||
           packageName == 'com.ubercab' ||
           packageName == 'com.taxis99';
  }

  /// Extrai valor e km da notificação
  /// Exemplos de formatos:
  /// - "R$ 45 • 12 km"
  /// - "R$ 45,50 / 12,5 km"
  /// - "Corrida de R$ 45 para 12km"
  Map<String, double>? _extractRideData(String text) {
    // Regex para capturar valor e km
    final regexPatterns = [
      RegExp(r'R\$\s*(\d+(?:[.,]\d+)?)\s*[•/]\s*(\d+(?:[.,]\d+)?)\s*km', caseSensitive: false),
      RegExp(r'R\$\s*(\d+(?:[.,]\d+)?)\s+para\s+(\d+(?:[.,]\d+)?)\s*km', caseSensitive: false),
      RegExp(r'(\d+(?:[.,]\d+)?)\s*reais?\s*[•/]\s*(\d+(?:[.,]\d+)?)\s*km', caseSensitive: false),
    ];

    for (final regex in regexPatterns) {
      final match = regex.firstMatch(text);
      if (match != null) {
        try {
          final valueStr = match.group(1)!.replaceAll(',', '.');
          final kmStr = match.group(2)!.replaceAll(',', '.');
          
          final value = double.parse(valueStr);
          final km = double.parse(kmStr);

          if (value > 0 && km > 0) {
            return {'value': value, 'km': km};
          }
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  /// Analisa corrida e mostra overlay
  Future<void> _analyzeAndShowOverlay(double value, double km) async {
    try {
      // Buscar usuário
      final user = await _storageService.getUser();
      if (user == null) {
        return;
      }

      // Analisar corrida
      final analysis = await _apiService.analyzeRide(user.userId, value, km);

      // Mostrar overlay
      await OverlayService.showOverlay(analysis);

      // Registrar decisão automaticamente após 4 segundos
      // (assumindo que o motorista viu o overlay)
      Future.delayed(const Duration(seconds: 4), () async {
        // Por ora, não registra decisão automática
        // O motorista pode registrar manualmente depois
      });
    } catch (e) {
      print('Erro ao analisar e mostrar overlay: $e');
    }
  }

  /// Stream de notificações (para debug/testes)
  Stream<Map<String, double>>? get notificationStream => _notificationController?.stream;

  /// Testa overlay manualmente (para desenvolvimento)
  Future<void> testOverlay({double value = 45, double km = 12}) async {
    await _analyzeAndShowOverlay(value, km);
  }

  void dispose() {
    stopListening();
  }
}

