# 📱 KIMO Overlay - App Flutter

## 🎯 Objetivo

App móvel que mostra um **semáforo overlay** sobre apps de corrida (Uber/99) para ajudar motoristas a decidir se aceitam ou rejeitam corridas em **menos de 5 segundos**.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│  APP UBER/99                            │
│  Notificação: "R$ 45 / 12km"           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  KIMO Overlay App                       │
│  1. Detecta notificação                 │
│  2. Extrai valor e km                   │
│  3. Consulta API /analyze               │
│  4. Mostra semáforo overlay             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  🟢 ACEITE! R$ 3.75/km                  │
│  ✅ 150% da meta                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Backend API                            │
│  Registra decisão + PendingTrip         │
└─────────────────────────────────────────┘
```

---

## 🚀 Setup do Projeto

### 1. Instalar Flutter (macOS)

```bash
# Download Flutter
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

### 4. Instalar Xcode (iOS)

```bash
# App Store → Instalar Xcode
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

### 5. Verificar Instalação

```bash
flutter doctor -v

# Deve mostrar:
✅ Flutter
✅ Android toolchain
✅ Xcode
✅ Chrome
✅ Android Studio
✅ VS Code
```

---

## 📦 Criar Projeto

```bash
cd ~/dev/kimo
flutter create kimo_overlay --org com.kimo --platforms android,ios

cd kimo_overlay
```

**Estrutura criada:**
```
kimo_overlay/
├── lib/
│   ├── main.dart           # Entry point
│   ├── models/             # Modelos de dados
│   ├── services/           # Serviços (API, Overlay, Notificações)
│   ├── screens/            # Telas
│   └── widgets/            # Componentes reutilizáveis
├── android/                # Configurações Android
├── ios/                    # Configurações iOS
├── pubspec.yaml           # Dependências
└── test/                  # Testes
```

---

## 📝 Adicionar Dependências

Editar `pubspec.yaml`:

```yaml
name: kimo_overlay
description: Overlay inteligente para motoristas de aplicativo
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # HTTP requests
  http: ^1.1.0
  
  # State management
  provider: ^6.1.1
  
  # Local storage
  shared_preferences: ^2.2.2
  
  # Overlay
  flutter_overlay_window: ^0.4.6
  
  # Notification listener
  notification_listener_service: ^0.2.4
  
  # Permissions
  permission_handler: ^11.0.1
  
  # JSON
  json_annotation: ^4.8.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  json_serializable: ^6.7.1
  build_runner: ^2.4.6

flutter:
  uses-material-design: true
```

Instalar:

```bash
flutter pub get
```

---

## 🔐 Configurar Permissões

### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissões necessárias -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    
    <application
        android:label="KIMO Overlay"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <!-- Activity principal -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        
        <!-- Notification Listener Service -->
        <service
            android:name="com.github.feragusper.listener.NotificationService"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService"/>
            </intent-filter>
        </service>
        
    </application>
</manifest>
```

### iOS (`ios/Runner/Info.plist`)

```xml
<key>NSNotificationAlwaysDisplayNotifications</key>
<true/>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
</array>
```

---

## 🎨 Implementar App Flutter

Vou criar os arquivos principais. Antes, vou criar um documento completo com todo o código Flutter que você vai precisar.

---

## 📚 Endpoints da API Backend

### Base URL
```
https://kimo-production.up.railway.app/api/mobile
```

### 1. POST `/auth`
**Autentica usuário pelo telefone**

Request:
```json
{
  "phone": "5511999999999"
}
```

Response:
```json
{
  "userId": "uuid",
  "name": "João",
  "phone": "5511999999999",
  "hasConfig": true,
  "isActive": true
}
```

### 2. GET `/criteria/:userId`
**Retorna critérios de aceitação**

Response:
```json
{
  "minValue": 15,
  "minValuePerKm": 1.5,
  "maxKm": 20,
  "peakHourMinValuePerKm": 1.2,
  "dailyGoal": 250,
  "todayEarnings": 120,
  "todayTrips": 8,
  "todayKm": 95,
  "fuelConsumption": 12.5,
  "avgFuelPrice": 5.50
}
```

### 3. POST `/analyze`
**Analisa uma corrida**

Request:
```json
{
  "userId": "uuid",
  "value": 45,
  "km": 12
}
```

Response:
```json
{
  "decision": "accept",
  "valuePerKm": 3.75,
  "profitPerKm": 2.80,
  "reason": "Ótima corrida! Lucro de R$ 2.80/km",
  "details": {
    "value": 45,
    "km": 12,
    "estimatedCost": 11.40,
    "estimatedProfit": 33.60,
    "fuelCost": 5.28,
    "maintenanceCost": 1.80
  }
}
```

### 4. POST `/decision`
**Registra decisão do motorista**

Request:
```json
{
  "userId": "uuid",
  "value": 45,
  "km": 12,
  "accepted": true,
  "fuel": 30  // opcional
}
```

Response:
```json
{
  "success": true
}
```

### 5. GET `/stats/:userId`
**Retorna estatísticas**

Response:
```json
{
  "today": {
    "earnings": 120,
    "expenses": 45,
    "profit": 75,
    "km": 95,
    "trips": 8
  },
  "week": {
    "earnings": 850,
    "km": 650,
    "trips": 52,
    "avgPerTrip": 16.35,
    "avgPerKm": 1.31
  }
}
```

---

## 📱 Fluxo do App

### 1. **Primeiro Uso (Onboarding)**
```dart
1. Tela de boas-vindas
2. Solicitar permissões:
   - Overlay sobre outros apps
   - Ler notificações
3. Login com telefone
4. Buscar critérios do backend
5. Configurar app
```

### 2. **Uso Diário**
```dart
1. App roda em background
2. Detecta notificação Uber/99
3. Extrai valor e km
4. Chama API /analyze
5. Mostra overlay 🟢/🔴/🟡
6. Auto-remove após 4s
7. Registra decisão no backend
```

### 3. **Tela Principal**
```dart
- Status do serviço (ativo/inativo)
- Estatísticas do dia
- Botão para testar overlay
- Configurações
```

---

## 🎯 Próximos Passos

### Opção A: Backend Primeiro (RECOMENDO)
1. ✅ Build e commit do backend
2. ✅ Deploy no Railway
3. ✅ Testar endpoints com Postman
4. → Implementar app Flutter

### Opção B: Flutter Primeiro
1. → Criar app Flutter básico
2. → Testar com dados mockados
3. → Integrar com backend depois

### Opção C: Paralelo
1. → Você: testar backend API
2. → Eu: criar código Flutter completo
3. → Integrar tudo no final

**O que você prefere?** 🤔

---

## 💡 Estimativa de Tempo

- ✅ **Backend API**: 2-3 horas (FEITO!)
- ⏳ **App Flutter básico**: 1 dia
- ⏳ **Overlay + Notificações**: 1 dia
- ⏳ **Polimento + testes**: 1 dia
- ⏳ **Deploy Android (APK)**: 2 horas
- ⏳ **Deploy iOS (TestFlight)**: 4 horas

**Total MVP: ~4 dias** 🚀

