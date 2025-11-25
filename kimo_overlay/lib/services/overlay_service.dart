import 'package:flutter/material.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import '../models/ride_analysis.dart';

/// Serviço de Overlay (Semáforo)
class OverlayService {
  static bool _isOverlayActive = false;

  /// Verifica se overlay pode ser usado
  static Future<bool> canShowOverlay() async {
    return await FlutterOverlayWindow.isPermissionGranted();
  }

  /// Solicita permissão de overlay
  static Future<bool> requestPermission() async {
    return await FlutterOverlayWindow.requestPermission();
  }

  /// Mostra overlay com resultado da análise
  static Future<void> showOverlay(RideAnalysis analysis) async {
    if (_isOverlayActive) {
      await closeOverlay();
    }

    _isOverlayActive = true;

    // Dados para o overlay
    final overlayData = {
      'decision': analysis.decision,
      'valuePerKm': analysis.valuePerKm,
      'profitPerKm': analysis.profitPerKm,
      'reason': analysis.reason,
      'value': analysis.details.value,
      'km': analysis.details.km,
    };

    await FlutterOverlayWindow.showOverlay(
      height: 180,
      width: 350,
      alignment: OverlayAlignment.topCenter,
      enableDrag: false,
    );

    await FlutterOverlayWindow.shareData(overlayData);

    // Auto-fechar após 4 segundos
    Future.delayed(const Duration(seconds: 4), () {
      closeOverlay();
    });
  }

  /// Fecha overlay
  static Future<void> closeOverlay() async {
    if (_isOverlayActive) {
      await FlutterOverlayWindow.closeOverlay();
      _isOverlayActive = false;
    }
  }
}

/// Widget do Overlay (renderizado separadamente)
class OverlayWidget extends StatefulWidget {
  const OverlayWidget({super.key});

  @override
  State<OverlayWidget> createState() => _OverlayWidgetState();
}

class _OverlayWidgetState extends State<OverlayWidget> {
  Map<String, dynamic>? data;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final overlayData = await FlutterOverlayWindow.overlayListener.first;
    setState(() {
      data = overlayData as Map<String, dynamic>?;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (data == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final decision = data!['decision'] as String;
    final valuePerKm = data!['valuePerKm'] as double;
    final profitPerKm = data!['profitPerKm'] as double;
    final reason = data!['reason'] as String;
    final value = data!['value'] as double;
    final km = data!['km'] as double;

    Color backgroundColor;
    Color textColor;
    String emoji;
    String title;

    switch (decision) {
      case 'accept':
        backgroundColor = const Color(0xFF4CAF50); // Verde
        textColor = Colors.white;
        emoji = '🟢';
        title = 'ACEITE AGORA!';
        break;
      case 'reject':
        backgroundColor = const Color(0xFFF44336); // Vermelho
        textColor = Colors.white;
        emoji = '🔴';
        title = 'NÃO VALE!';
        break;
      default: // neutral
        backgroundColor = const Color(0xFFFFC107); // Amarelo
        textColor = Colors.black87;
        emoji = '🟡';
        title = 'VOCÊ DECIDE';
    }

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  emoji,
                  style: const TextStyle(fontSize: 32),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'R\$ ${valuePerKm.toStringAsFixed(2)}/km',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            if (decision == 'accept' || decision == 'neutral') ...[
              const SizedBox(height: 4),
              Text(
                'Lucro: R\$ ${profitPerKm.toStringAsFixed(2)}/km',
                style: TextStyle(
                  fontSize: 16,
                  color: textColor,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              '💰 R\$ ${value.toStringAsFixed(2)} / ${km.toStringAsFixed(1)}km',
              style: TextStyle(
                fontSize: 14,
                color: textColor.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

