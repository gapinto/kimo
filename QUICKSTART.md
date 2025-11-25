# 🚀 Guia Rápido - Começar a Usar o App

## ⚡ Setup Rápido (15 minutos)

### 1. Instalar Flutter

```bash
# macOS
cd ~
curl -O https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_macos_3.16.0-stable.zip
unzip flutter_macos_3.16.0-stable.zip
sudo mv flutter /usr/local/
echo 'export PATH="$PATH:/usr/local/flutter/bin"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Verificar Instalação

```bash
flutter doctor

# Deve mostrar:
# ✅ Flutter
# ⚠️ Android toolchain (normal, vamos instalar)
```

### 3. Instalar Android Studio

1. Baixar: https://developer.android.com/studio
2. Instalar normalmente (Next → Next → Finish)
3. Abrir Android Studio
4. More Actions → SDK Manager
5. SDK Platforms: Marcar "Android 13.0 (Tiramisu)"
6. SDK Tools: Marcar "Android SDK Build-Tools"
7. Apply → OK

### 4. Aceitar Licenças

```bash
flutter doctor --android-licenses
# Pressionar 'y' para todas (vai aparecer umas 7-8 vezes)
```

### 5. Verificar Novamente

```bash
flutter doctor

# Agora deve mostrar:
# ✅ Flutter
# ✅ Android toolchain
```

---

## 📱 Rodar o App

### No Emulador Android

```bash
# 1. Abrir Android Studio
# 2. More Actions → Virtual Device Manager
# 3. Create Device → Pixel 6 → Next
# 4. Download "Tiramisu" (Android 13) → Next → Finish
# 5. Clicar no ▶️ para iniciar

# 6. No terminal:
cd ~/dev/kimo/kimo_overlay
flutter pub get
flutter run
```

### No Celular Real (RECOMENDADO para testar overlay)

```bash
# 1. No celular:
#    Configurações → Sobre o telefone
#    Tocar 7x em "Número da versão"
#    Voltar → Opções do desenvolvedor
#    Ativar "Depuração USB"

# 2. Conectar celular via USB

# 3. No terminal:
cd ~/dev/kimo/kimo_overlay
flutter pub get
flutter run

# Escolher o dispositivo quando pedir
```

---

## 🧪 Testar o App

### 1. Primeira Vez (Login)

```
Tela de Login aparece
↓
Digite seu telefone: 5511999999999
(use o mesmo do WhatsApp)
↓
Toque em "Entrar"
↓
Se deu erro: complete onboarding no WhatsApp primeiro
```

### 2. Ativar Serviço

```
Tela Home aparece
↓
Toggle "Serviço de Overlay" → ON
↓
Permitir "Exibir sobre outros apps" (Android pede)
↓
Permitir "Acesso a notificações" (Android pede)
↓
Status: 🟢 Ativo
```

### 3. Testar Overlay

```
Toque em "Testar Overlay"
↓
Semáforo aparece sobre o app por 4 segundos
↓
🟢 ACEITE AGORA!
R$ 3.75/km
✅ Lucro R$ 2.80/km
```

---

## 🎯 Usar no Dia a Dia

### Fluxo Completo:

```
1. Abrir app KIMO
2. Ativar "Serviço de Overlay"
3. Minimizar app (deixar em background)
4. Abrir Uber/99 e ficar online
5. Quando corrida chegar:
   - Notificação aparece
   - App KIMO detecta automaticamente
   - Overlay mostra 🟢 ou 🔴
   - Você decide em 2 segundos!
6. No final do dia:
   - Abrir app KIMO
   - Ver estatísticas
   - Ver quanto ganhou vs meta
```

---

## 📦 Gerar APK para Distribuir

### APK Simples (para amigos testarem)

```bash
cd ~/dev/kimo/kimo_overlay
flutter build apk --debug
```

**Arquivo gerado:**
```
kimo_overlay/build/app/outputs/flutter-apk/app-debug.apk
```

**Como instalar:**
1. Copiar `app-debug.apk` para o celular
2. Abrir no celular
3. Permitir "Instalar apps desconhecidos"
4. Instalar

### APK Otimizado (menor tamanho)

```bash
flutter build apk --release
```

---

## 🐛 Problemas Comuns

### "flutter: command not found"

```bash
# Adicionar ao PATH novamente
echo 'export PATH="$PATH:/usr/local/flutter/bin"' >> ~/.zshrc
source ~/.zshrc
```

### "No devices found"

**Emulador:**
```bash
# Abrir Android Studio → Virtual Device Manager → ▶️
```

**Celular:**
```bash
# Verificar se cabo USB está conectado
# Verificar se "Depuração USB" está ativada
flutter devices
```

### "Gradle build failed"

```bash
cd kimo_overlay/android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter run
```

### "Overlay não aparece"

1. Verificar se permissão foi concedida:
   - Configurações → Apps → KIMO Overlay
   - Exibir sobre outros apps → Permitir

2. Testar manualmente:
   - Abrir app → "Testar Overlay"

### "Notificações não são detectadas"

1. Verificar permissão:
   - Configurações → Acessibilidade
   - Acesso a notificações → KIMO Overlay → Ativar

2. **NOTA IMPORTANTE:**
   - A detecção de notificações precisa de código nativo
   - Por ora, use "Testar Overlay" para simular

---

## 📚 Próximos Passos

### Para Desenvolvedores:

1. **Implementar NotificationListenerService**
   - Criar `NotificationListenerService.kt`
   - Ler notificações do Uber/99
   - Enviar para Flutter via MethodChannel

2. **Melhorar UI**
   - Adicionar animações
   - Tela de configurações
   - Dark mode

3. **Testes**
   - Testes unitários
   - Testes de integração
   - Testes no dispositivo real com Uber/99

### Para Usuários:

1. **Usar no dia a dia**
2. **Dar feedback**
3. **Reportar bugs**

---

## 🎉 Pronto!

Agora você tem:
- ✅ Flutter instalado
- ✅ App rodando
- ✅ Overlay funcionando
- ✅ APK gerado

**Qualquer problema?**
- Veja `kimo_overlay/README.md` (documentação completa)
- Ou abra uma issue no GitHub

---

**Desenvolvido com ❤️ para motoristas**

🚦 Decisões inteligentes em segundos!

