# 📱 KIMO Overlay - App Flutter

## 🎯 O que é?

App móvel que mostra um **semáforo overlay** sobre apps de corrida (Uber/99) para ajudar motoristas a decidir se aceitam ou rejeitam corridas em **menos de 5 segundos**.

## ✨ Funcionalidades

- 🚦 **Overlay inteligente** sobre Uber/99
- 🟢 **Decisão visual instantânea** (Verde = Aceite, Vermelho = Rejeite, Amarelo = Você decide)
- 📊 **Análise automática** de custos e lucro
- 💰 **Acompanhamento de meta diária**
- 📈 **Estatísticas em tempo real**
- 🔄 **Sincronização com WhatsApp Bot**

## 🏗️ Arquitetura

```
lib/
├── main.dart                   # Entry point
├── models/                     # Modelos de dados
│   ├── user.dart
│   ├── criteria.dart
│   ├── ride_analysis.dart
│   └── stats.dart
├── services/                   # Serviços
│   ├── api_service.dart        # Comunicação com backend
│   ├── storage_service.dart    # Armazenamento local
│   ├── overlay_service.dart    # Gerenciamento de overlay
│   └── notification_service.dart # Detecção de notificações
└── screens/                    # Telas
    ├── splash_screen.dart
    ├── login_screen.dart
    └── home_screen.dart
```

## 🚀 Setup do Ambiente

### 1. Instalar Flutter

```bash
# macOS
cd ~
curl -O https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_macos_3.16.0-stable.zip
unzip flutter_macos_3.16.0-stable.zip
sudo mv flutter /usr/local/

# Adicionar ao PATH
echo 'export PATH="$PATH:/usr/local/flutter/bin"' >> ~/.zshrc
source ~/.zshrc

# Verificar
flutter doctor
```

### 2. Instalar Android Studio

1. Baixar: https://developer.android.com/studio
2. Instalar normalmente
3. Abrir Android Studio → More Actions → SDK Manager
4. Instalar:
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools

### 3. Aceitar Licenças

```bash
flutter doctor --android-licenses
# Pressionar 'y' para todas
```

### 4. Instalar Xcode (para iOS - opcional)

```bash
# App Store → Instalar Xcode
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

## 📦 Instalar Dependências

```bash
cd kimo_overlay
flutter pub get
```

## 🔧 Configuração

### Backend API

O app se conecta ao backend KIMO em:
```
https://kimo-production.up.railway.app/api/mobile
```

Para alterar a URL, edite `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'SUA_URL_AQUI/api/mobile';
```

## 🏃 Rodar o App

### Android (Emulador)

```bash
# Listar dispositivos
flutter devices

# Rodar
flutter run
```

### Android (Dispositivo Físico)

1. Habilitar **Depuração USB** no celular:
   - Configurações → Sobre o telefone
   - Tocar 7x em "Número da versão"
   - Voltar → Opções do desenvolvedor
   - Ativar "Depuração USB"

2. Conectar celular via USB

3. Rodar:
```bash
flutter run
```

### iOS (Simulador - Mac only)

```bash
open -a Simulator
flutter run
```

## 📦 Gerar APK (Android)

### APK de Debug (para testes)

```bash
flutter build apk --debug
```

**Arquivo gerado:**
```
build/app/outputs/flutter-apk/app-debug.apk
```

### APK de Release (para produção)

```bash
flutter build apk --release
```

**Arquivo gerado:**
```
build/app/outputs/flutter-apk/app-release.apk
```

### Instalar APK no celular

```bash
# Via USB
flutter install

# Ou copiar APK manualmente e instalar
```

## 📱 Publicar na Play Store

### 1. Criar Keystore

```bash
keytool -genkey -v -keystore ~/kimo-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias kimo
```

### 2. Configurar `android/key.properties`

```properties
storePassword=SUA_SENHA
keyPassword=SUA_SENHA
keyAlias=kimo
storeFile=/Users/seu-usuario/kimo-release-key.jks
```

### 3. Atualizar `android/app/build.gradle`

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 4. Build Release

```bash
flutter build appbundle --release
```

**Arquivo gerado:**
```
build/app/outputs/bundle/release/app-release.aab
```

### 5. Upload na Play Console

1. Ir para https://play.google.com/console
2. Criar novo app
3. Upload do `.aab`
4. Preencher informações (título, descrição, screenshots)
5. Enviar para revisão

## 🍎 Publicar na App Store (iOS)

### 1. Configurar Bundle ID no Xcode

```bash
open ios/Runner.xcworkspace
```

- General → Bundle Identifier: `com.kimo.overlay`
- Signing & Capabilities → Selecionar Team

### 2. Build Release

```bash
flutter build ios --release
```

### 3. Archive no Xcode

1. Product → Archive
2. Organizer → Distribute App
3. App Store Connect
4. Upload

### 4. Enviar na App Store Connect

1. https://appstoreconnect.apple.com
2. My Apps → Novo App
3. Preencher informações
4. Enviar para revisão

## 🔐 Permissões Necessárias

### Android

- **SYSTEM_ALERT_WINDOW**: Mostrar overlay sobre outros apps
- **INTERNET**: Comunicação com API
- **VIBRATE**: Vibrar ao detectar corrida
- **FOREGROUND_SERVICE**: Manter serviço ativo em background

### iOS

- **Background Modes**: Para processar em background (limitado)

## 🧪 Testar Overlay

No app, após login:
1. Ativar "Serviço de Overlay"
2. Tocar em "Testar Overlay"
3. Verá o semáforo aparecer

## 🐛 Troubleshooting

### "Overlay permission denied"
- Android: Configurações → Apps → KIMO → Exibir sobre outros apps → Permitir
- iOS: Overlay não disponível (limitação da plataforma)

### "Notification permission denied"
- Android: Configurações → Apps → KIMO → Notificações → Permitir
- Configurações → Acessibilidade → Acesso a notificações → KIMO → Ativar

### "API connection error"
- Verificar se backend está rodando
- Verificar URL em `api_service.dart`
- Verificar conexão de internet

### "Hot reload não funciona"
```bash
flutter clean
flutter pub get
flutter run
```

## 📚 Documentação

- [Flutter Docs](https://docs.flutter.dev/)
- [Flutter Overlay Window](https://pub.dev/packages/flutter_overlay_window)
- [API Backend](../README.md)

## 🎯 Roadmap

- [x] Setup projeto Flutter
- [x] Modelos de dados
- [x] Serviços (API, Storage, Overlay)
- [x] Telas (Splash, Login, Home)
- [x] Configurar permissões Android
- [ ] Implementar NotificationListenerService nativo (Android)
- [ ] Melhorar UI/UX
- [ ] Adicionar tela de configurações
- [ ] Suporte para iOS (limitado)
- [ ] Testes automatizados
- [ ] CI/CD (GitHub Actions)

## 🤝 Contribuir

1. Fork o projeto
2. Criar branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abrir Pull Request

## 📝 Notas Importantes

### ⚠️ NotificationListenerService

A detecção de notificações do Uber/99 requer implementação **nativa** em Kotlin/Java. O código atual é um **esqueleto**.

Para implementar:
1. Criar `NotificationListenerService.kt` em `android/app/src/main/kotlin/`
2. Registrar service no `AndroidManifest.xml`
3. Implementar MethodChannel para comunicação Flutter ↔ Native

### ⚠️ iOS Limitations

iOS não permite:
- Ler notificações de outros apps
- Overlay sobre outros apps

Alternativas para iOS:
- Widget na tela de bloqueio
- Notificações push do backend
- App Clips (mini app)

## 📄 Licença

MIT License - veja LICENSE para detalhes

---

**Desenvolvido com ❤️ para motoristas de aplicativo**

🚦 Tome decisões inteligentes em segundos!

