import 'package:flutter/material.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'screens/splash_screen.dart';
import 'services/overlay_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KimoOverlayApp());
}

/// App principal
class KimoOverlayApp extends StatelessWidget {
  const KimoOverlayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KIMO Overlay',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E88E5),
        ),
      ),
      home: const SplashScreen(),
    );
  }
}

/// Entry point para o overlay (executa em processo separado)
@pragma("vm:entry-point")
void overlayMain() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: OverlayWidget(),
    ),
  );
}

