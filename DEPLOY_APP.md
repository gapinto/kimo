# 🚀 Deploy do App KIMO Overlay

## 📱 Opções de Distribuição

### 1. 🔥 Firebase App Distribution (RECOMENDADO para testes)
### 2. 🌐 GitHub Releases (Mais simples)
### 3. 🏪 Google Play Store (Produção)
### 4. 💻 Rodar localmente (Desenvolvimento)

---

## 🔥 OPÇÃO 1: Firebase App Distribution

**Melhor para:** Testar com grupo de pessoas antes de publicar

### Setup (Uma Vez)

```bash
# 1. Criar projeto Firebase
# https://console.firebase.google.com
# → Add project → "KIMO"
# → Continue → Continue → Create project

# 2. Registrar app Android
# Console Firebase → Project Overview → Add app → Android
# Android package name: com.kimo.overlay
# Register app → Download google-services.json

# 3. Mover google-services.json
cp ~/Downloads/google-services.json ~/dev/kimo/kimo_overlay/android/app/

# 4. Instalar Firebase CLI
npm install -g firebase-tools
firebase login

# 5. Inicializar no projeto
cd ~/dev/kimo/kimo_overlay
firebase init
# Escolher: App Distribution
# Projeto: KIMO (selecionar o criado)
```

### Adicionar Firebase ao Android

Editar `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'  // ADICIONAR
    }
}
```

Editar `android/app/build.gradle`:
```gradle
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
    id 'com.google.gms.google-services'  // ADICIONAR no final
}
```

### Distribuir APK

```bash
# 1. Build release
cd ~/dev/kimo/kimo_overlay
flutter build apk --release

# 2. Distribuir via Firebase
firebase appdistribution:distribute \
  build/app/outputs/flutter-apk/app-release.apk \
  --app 1:XXXXXXXXX:android:XXXXXXXXX \
  --release-notes "Versão 1.0 - Overlay inteligente para motoristas" \
  --testers "joao@gmail.com, maria@gmail.com, pedro@hotmail.com"

# Ou distribuir para grupos:
firebase appdistribution:distribute \
  build/app/outputs/flutter-apk/app-release.apk \
  --app 1:XXXXXXXXX:android:XXXXXXXXX \
  --groups "motoristas-beta" \
  --release-notes "Versão 1.0"
```

### Como Encontrar o APP_ID

```bash
# No console Firebase:
# Project settings → Your apps → Android → App ID
# Formato: 1:123456789:android:abc123def456

# Ou no arquivo firebase.json:
cat firebase.json
```

### Testadores Recebem Email

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 You're invited to test KIMO Overlay
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

João, you've been invited to test KIMO Overlay

[Get Started]

Release notes:
Versão 1.0 - Overlay inteligente para motoristas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Testadores Instalam:

1. Clicar em "Get Started"
2. Instalar **Firebase App Tester** (Play Store)
3. App KIMO aparece automaticamente
4. Instalar com 1 clique
5. Recebem updates automáticos

**Vantagens:**
- ✅ Grátis ilimitado
- ✅ Fácil compartilhar
- ✅ Updates automáticos
- ✅ Crash reports
- ✅ Feedback dos testadores
- ✅ Até 200 testadores no plano grátis

---

## 🌐 OPÇÃO 2: GitHub Releases (MAIS SIMPLES)

**Melhor para:** Distribuição pública simples

### Build APK

```bash
cd ~/dev/kimo/kimo_overlay
flutter build apk --release

# APK está em:
build/app/outputs/flutter-apk/app-release.apk
```

### Criar Release no GitHub

```bash
# Opção A: Via Interface Web
# 1. Ir para: https://github.com/gapinto/kimo
# 2. Releases → "Create a new release"
# 3. Tag version: v1.0.0
# 4. Title: KIMO Overlay v1.0.0
# 5. Description: 
#    📱 KIMO Overlay - Decisões inteligentes em segundos
#    
#    🟢 Novo na v1.0.0:
#    - Overlay inteligente sobre Uber/99
#    - Análise automática de corridas
#    - Estatísticas em tempo real
#    
#    📦 Instalação:
#    1. Baixar app-release.apk
#    2. Permitir "Instalar apps desconhecidos"
#    3. Instalar
# 6. Anexar: app-release.apk (arrastar arquivo)
# 7. "Publish release"

# Opção B: Via CLI (com gh)
gh release create v1.0.0 \
  build/app/outputs/flutter-apk/app-release.apk \
  --title "KIMO Overlay v1.0.0" \
  --notes "Overlay inteligente para motoristas"
```

### Compartilhar Link

```
Direct download:
https://github.com/gapinto/kimo/releases/download/v1.0.0/app-release.apk

Página do release:
https://github.com/gapinto/kimo/releases/tag/v1.0.0
```

**Usuários fazem:**
```
1. Clicar no link
2. Android: "Permitir download de fontes desconhecidas"
3. Abrir APK baixado
4. "Permitir instalar apps desconhecidos"
5. Instalar
```

**Vantagens:**
- ✅ 100% grátis
- ✅ Simples
- ✅ Link direto
- ✅ Versionamento automático

**Desvantagens:**
- ❌ Sem updates automáticos
- ❌ Usuário precisa permitir "fontes desconhecidas"

---

## 🏪 OPÇÃO 3: Google Play Store (PRODUÇÃO)

**Melhor para:** App finalizado, distribuição em massa

### Custos

- **Taxa única:** US$ 25 (paga uma vez, publica para sempre)
- **Sem mensalidade**

### Passo a Passo Completo

#### 1. Criar Conta de Desenvolvedor

```
1. Ir para: https://play.google.com/console
2. Criar conta → Pagar US$ 25
3. Preencher formulário (nome, endereço, etc)
4. Aguardar aprovação (~48h)
```

#### 2. Criar Keystore (Assinar App)

```bash
cd ~/dev/kimo/kimo_overlay/android

# Criar keystore
keytool -genkey -v -keystore kimo-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias kimo

# Preencher:
# Senha: [escolher senha forte]
# Nome: Guilherme Andrade (ou nome da empresa)
# Organização: KIMO
# Cidade: São Paulo
# Estado: SP
# País: BR

# Keystore criado: kimo-release-key.jks
# GUARDAR COM SEGURANÇA! Se perder, não consegue mais atualizar o app
```

#### 3. Configurar Build

Criar `android/key.properties`:
```properties
storePassword=SUA_SENHA_AQUI
keyPassword=SUA_SENHA_AQUI
keyAlias=kimo
storeFile=kimo-release-key.jks
```

Editar `android/app/build.gradle`:
```gradle
// ADICIONAR NO TOPO (antes de android {)
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    
    // ADICIONAR signingConfigs
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release  // MODIFICAR
        }
    }
}
```

#### 4. Build AAB (Android App Bundle)

```bash
flutter build appbundle --release

# Arquivo gerado:
# build/app/outputs/bundle/release/app-release.aab
```

#### 5. Preparar Assets

```
📸 Capturas de tela (necessárias):
- 2-8 screenshots (1080x1920 ou 1080x2340)
- Tirar no app rodando

🎨 Ícone:
- 512x512 PNG
- Pode usar: https://www.figma.com ou Canva

📝 Descrições:
- Título: "KIMO Overlay - Decisões Inteligentes"
- Descrição curta: "Semáforo overlay para motoristas de app. Aceite corridas em segundos!"
- Descrição longa: Ver abaixo
```

**Descrição Longa (exemplo):**
```
🚦 KIMO Overlay - Decisões Inteligentes em Segundos

Motorista de Uber/99? Cansado de perder corridas boas por não ter tempo de avaliar?

O KIMO Overlay mostra um SEMÁFORO sobre o app de corridas:
🟢 VERDE = Aceite! Vale a pena
🔴 VERMELHO = Rejeite! Não vale
🟡 AMARELO = Você decide

✨ FUNCIONALIDADES:
• Overlay inteligente sobre Uber/99
• Análise automática de custos e lucro
• Decisão visual em 2 segundos
• Acompanhamento de meta diária
• Estatísticas em tempo real
• Sincronização com WhatsApp Bot

💰 COMO FUNCIONA:
1. Configure seus critérios (valor mínimo, R$/km)
2. Ative o serviço
3. Quando corrida chegar, veja o semáforo
4. Decida em segundos!

📊 VEJA SEUS GANHOS:
• Quanto ganhou hoje vs meta
• Estatísticas da semana
• Lucro real (descontando custos)

Desenvolvido POR motoristas PARA motoristas.

🆓 100% GRATUITO
```

#### 6. Upload na Play Console

```
1. https://play.google.com/console
2. "Create app"
3. Nome: KIMO Overlay
4. Idioma padrão: Português (Brasil)
5. App ou jogo: App
6. Gratuito ou pago: Gratuito
7. "Create app"

8. Dashboard → Production → Create new release
9. Upload: app-release.aab
10. Release name: 1.0.0
11. Release notes:
    Versão inicial:
    - Overlay inteligente
    - Análise de corridas
    - Estatísticas em tempo real

12. Preencher:
    - App content (conteúdo do app)
    - Privacy policy (pode usar: https://app-privacy-policy-generator.firebaseapp.com/)
    - Target audience: 18+
    - Permissions: Listar permissões usadas

13. Submit for review
```

#### 7. Aguardar Aprovação

```
⏱️ Primeira versão: 1-7 dias
⏱️ Updates seguintes: 1-3 dias

Status:
- Em revisão
- Aprovado → Publicado automaticamente
- Rejeitado → Corrigir e reenviar
```

**Vantagens:**
- ✅ Oficial
- ✅ Updates automáticos
- ✅ Maior confiança dos usuários
- ✅ Estatísticas detalhadas
- ✅ Maior alcance

**Desvantagens:**
- ❌ Custo US$ 25
- ❌ Demora para aprovar
- ❌ Revisão manual

---

## 💻 OPÇÃO 4: Rodar Localmente (SEM DEPLOY)

**Melhor para:** Desenvolvimento/testes pessoais

### Setup

```bash
# 1. Instalar Flutter (ver QUICKSTART.md)

# 2. Rodar no emulador
cd ~/dev/kimo/kimo_overlay
flutter pub get
flutter run

# 3. Ou instalar direto no celular conectado via USB
flutter install
```

### Gerar APK para Instalar Manualmente

```bash
# APK de debug (mais rápido)
flutter build apk --debug

# APK de release (otimizado)
flutter build apk --release

# Copiar para celular
cp build/app/outputs/flutter-apk/app-release.apk ~/Desktop/
# Enviar por WhatsApp/Email/AirDrop
```

---

## 🎯 QUAL ESCOLHER?

| Cenário | Melhor Opção |
|---------|--------------|
| **Testar com 5-10 pessoas** | 🔥 Firebase App Distribution |
| **Distribuir link público simples** | 🌐 GitHub Releases |
| **App finalizado para todos** | 🏪 Google Play Store |
| **Testar sozinho** | 💻 Rodar localmente |
| **Testar com amigos motoristas (beta)** | 🔥 Firebase App Distribution |

---

## 📋 Checklist Rápido

### Para Firebase App Distribution:
- [ ] Criar projeto Firebase
- [ ] Registrar app Android
- [ ] Adicionar google-services.json
- [ ] Build APK: `flutter build apk --release`
- [ ] Distribuir: `firebase appdistribution:distribute ...`
- [ ] Convidar testadores

### Para GitHub Releases:
- [ ] Build APK: `flutter build apk --release`
- [ ] Criar release no GitHub
- [ ] Upload app-release.apk
- [ ] Compartilhar link

### Para Google Play Store:
- [ ] Criar conta desenvolvedor (US$ 25)
- [ ] Criar keystore
- [ ] Build AAB: `flutter build appbundle --release`
- [ ] Preparar screenshots
- [ ] Upload na Play Console
- [ ] Preencher informações
- [ ] Submit para revisão

---

## 🆘 Precisa de Ajuda?

**Qual opção você quer seguir?**
- A) Firebase App Distribution (testar com grupo)
- B) GitHub Releases (link simples)
- C) Google Play Store (produção)
- D) Rodar localmente primeiro

**Me avisa que eu te guio passo a passo!** 🚀

