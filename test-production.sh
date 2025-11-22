#!/bin/bash

echo "🧪 TESTE RÁPIDO - PRODUÇÃO"
echo ""
echo "Configure suas URLs primeiro!"
echo ""

# CONFIGURE AQUI:
read -p "URL Evolution API: " EVOLUTION_URL
read -p "API Key: " EVOLUTION_KEY
read -p "URL KIMO: " KIMO_URL

echo ""
echo "Testando..."
echo ""

# 1. Evolution API
echo "1️⃣ Evolution API..."
STATUS=$(curl -s "$EVOLUTION_URL/" 2>/dev/null | grep -o "ok")
if [ "$STATUS" = "ok" ]; then
  echo "   ✅ Online"
else
  echo "   ❌ Offline"
fi

# 2. KIMO API
echo "2️⃣ KIMO API..."
STATUS=$(curl -s "$KIMO_URL/health" 2>/dev/null | grep -o "ok")
if [ "$STATUS" = "ok" ]; then
  echo "   ✅ Online"
else
  echo "   ❌ Offline"
fi

# 3. WhatsApp
echo "3️⃣ WhatsApp..."
STATE=$(curl -s "$EVOLUTION_URL/instance/connectionState/kimo" \
  -H "apikey: $EVOLUTION_KEY" 2>/dev/null | grep -o "open")
if [ "$STATE" = "open" ]; then
  echo "   ✅ Conectado"
else
  echo "   ⚠️ Desconectado - Execute QR Code"
fi

# 4. Webhook
echo "4️⃣ Webhook..."
WEBHOOK=$(curl -s "$EVOLUTION_URL/webhook/find/kimo" \
  -H "apikey: $EVOLUTION_KEY" 2>/dev/null | grep -o "url")
if [ "$WEBHOOK" = "url" ]; then
  echo "   ✅ Configurado"
else
  echo "   ⚠️ Não configurado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Envie 'Oi' pelo WhatsApp para testar!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

