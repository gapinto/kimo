# 🚀 DEPLOY EM PRODUÇÃO - KIMO (Railway)

## 📋 VISÃO GERAL

Vamos colocar TUDO em produção:
1. ✅ KIMO API no Railway
2. ✅ Evolution API (WhatsApp) no Railway
3. ✅ Supabase (já está em cloud)
4. ✅ Conectar WhatsApp
5. ✅ Testar tudo funcionando

**Tempo estimado:** 15-20 minutos  
**Custo:** GRÁTIS (Railway oferece $5/mês no plano gratuito)

---

## 🎯 PASSO 1: PREPARAR O CÓDIGO

### **1.1: Adicionar arquivo de build**

Execute no terminal:

```bash
cd /tmp/kimo

# Adicionar script de start para produção
cat >> package.json.tmp << 'EOF'
EOF

# Criar Procfile para Railway
echo "web: npm run build && npm start" > Procfile
```

### **1.2: Atualizar package.json com scripts de produção**

Vamos adicionar os scripts necessários:

```bash
cd /tmp/kimo

# Backup
cp package.json package.json.backup

# Atualizar scripts (faço isso manualmente para você)
```

### **1.3: Criar repositório Git**

```bash
cd /tmp/kimo

# Inicializar Git (se ainda não foi)
git init

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "feat: KIMO financial assistant for Uber drivers"

# Criar repositório no GitHub (abra navegador)
# 1. Vá em: https://github.com/new
# 2. Nome: kimo
# 3. Privado (recomendado)
# 4. Não adicione README (já temos)
# 5. Clique "Create repository"

# Conectar ao GitHub (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/kimo.git
git branch -M main
git push -u origin main
```

---

## ☁️ PASSO 2: DEPLOY EVOLUTION API (WhatsApp)

### **2.1: Acessar Railway**

1. Acesse: https://railway.app
2. Clique em **"Login"**
3. Escolha **"Login with GitHub"**
4. Autorize o Railway

### **2.2: Deploy Evolution API**

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Clique em **"Configure GitHub App"**
4. Busque e selecione o repositório: `EvolutionAPI/evolution-api`
   - Se não aparecer, clique em "Add repository" e autorize
5. Clique em **"Deploy Now"**
6. Aguarde ~3 minutos ⏱️

### **2.3: Configurar Variáveis de Ambiente**

No painel do Evolution API no Railway:

1. Clique na aba **"Variables"**
2. Clique em **"+ New Variable"**
3. Adicione cada variável:

```bash
AUTHENTICATION_API_KEY=kimo_secret_production_key_456789

SERVER_TYPE=https
SERVER_URL=${{RAILWAY_PUBLIC_DOMAIN}}

DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:rhSBtOB5KVPK5iFC@db.ftvgspumgzjbobymjkui.supabase.co:5432/postgres

CACHE_REDIS_ENABLED=false

WEBHOOK_GLOBAL_ENABLED=false

LOG_LEVEL=ERROR
LOG_COLOR=false

DEL_INSTANCE=false
```

4. Clique em **"Deploy"** (vai reiniciar automaticamente)

### **2.4: Obter URL da Evolution API**

1. Clique na aba **"Settings"**
2. Em **"Domains"**, clique em **"Generate Domain"**
3. Copie a URL gerada (ex: `evolution-api-production-abc123.up.railway.app`)
4. **GUARDE ESSA URL!** Vamos usar em vários lugares

### **2.5: Testar Evolution API**

```bash
# Substitua pela SUA URL do Railway
curl https://evolution-api-production-abc123.up.railway.app/

# Resposta esperada:
# {"status":"ok"}
```

✅ **Evolution API em produção!**

---

## 🚀 PASSO 3: DEPLOY KIMO API

### **3.1: Deploy no Railway**

1. No Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Busque e selecione **seu repositório: `SEU_USUARIO/kimo`**
4. Clique em **"Deploy Now"**
5. Aguarde ~3 minutos ⏱️

### **3.2: Configurar Variáveis de Ambiente**

No painel do KIMO no Railway:

1. Clique na aba **"Variables"**
2. Clique em **"Raw Editor"** (mais fácil para colar tudo)
3. Cole e **SUBSTITUA** os valores:

```bash
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://ftvgspumgzjbobymjkui.supabase.co
SUPABASE_SERVICE_KEY=sb_publishable_DVbKAsLfIFZLAx9j6ufhtw_LjwyUZQZ
SUPABASE_ANON_KEY=sb_publishable_DVbKAsLfIFZLAx9j6ufhtw_LjwyUZQZ
SUPABASE_DB_PASSWORD=rhSBtOB5KVPK5iFC

# WhatsApp (Evolution API) - SUBSTITUA PELA SUA URL DO RAILWAY
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://evolution-api-production-abc123.up.railway.app
EVOLUTION_API_KEY=kimo_secret_production_key_456789
EVOLUTION_INSTANCE_NAME=kimo
```

4. Clique em **"Update Variables"**
5. O deploy reinicia automaticamente

### **3.3: Obter URL do KIMO**

1. Clique na aba **"Settings"**
2. Em **"Domains"**, clique em **"Generate Domain"**
3. Copie a URL gerada (ex: `kimo-production-xyz789.up.railway.app`)
4. **GUARDE ESSA URL!**

### **3.4: Testar KIMO API**

```bash
# Substitua pela SUA URL
curl https://kimo-production-xyz789.up.railway.app/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","service":"kimo-api"}
```

✅ **KIMO API em produção!**

---

## 📱 PASSO 4: CONECTAR WHATSAPP

### **4.1: Criar Instância**

```bash
# Substitua pela SUA URL da Evolution API
curl -X POST 'https://evolution-api-production-abc123.up.railway.app/instance/create' \
  -H 'apikey: kimo_secret_production_key_456789' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceName": "kimo",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Resposta:
# {"instance":{"instanceName":"kimo","status":"created"}}
```

### **4.2: Obter QR Code**

**Opção 1: Swagger UI (Mais fácil!)**

1. Acesse: `https://evolution-api-production-abc123.up.railway.app/manager`
2. Clique em **"Authorize"** (cadeado no topo)
3. Digite: `kimo_secret_production_key_456789`
4. Clique em **"Authorize"**
5. Vá em **`GET /instance/connect/{instanceName}`**
6. Digite `kimo` no campo
7. Clique em **"Execute"**
8. **QR CODE aparece na resposta!** 📱

**Opção 2: Terminal**

```bash
curl -X GET 'https://evolution-api-production-abc123.up.railway.app/instance/connect/kimo' \
  -H 'apikey: kimo_secret_production_key_456789'

# Copie o base64 e cole no navegador para ver o QR Code
```

### **4.3: Conectar WhatsApp**

1. Abra o **WhatsApp** no seu celular 📱
2. Vá em **Configurações** (três pontinhos)
3. Clique em **Aparelhos conectados**
4. Clique em **Conectar um aparelho**
5. **Escaneie o QR Code** da tela
6. Aguarde confirmação ✅

### **4.4: Verificar Conexão**

```bash
curl -X GET 'https://evolution-api-production-abc123.up.railway.app/instance/connectionState/kimo' \
  -H 'apikey: kimo_secret_production_key_456789'

# Resposta esperada:
# {"instance":{"instanceName":"kimo","state":"open"}}
```

✅ **WhatsApp conectado!**

---

## 🔗 PASSO 5: CONFIGURAR WEBHOOK

### **5.1: Configurar Webhook**

```bash
# Substitua:
# - URL da Evolution API
# - URL do KIMO (com /api/whatsapp/webhook no final)

curl -X POST 'https://evolution-api-production-abc123.up.railway.app/webhook/set/kimo' \
  -H 'apikey: kimo_secret_production_key_456789' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://kimo-production-xyz789.up.railway.app/api/whatsapp/webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE"
    ]
  }'

# Resposta:
# {"webhook":{"url":"...","enabled":true}}
```

### **5.2: Verificar Webhook**

```bash
curl -X GET 'https://evolution-api-production-abc123.up.railway.app/webhook/find/kimo' \
  -H 'apikey: kimo_secret_production_key_456789'

# Deve mostrar o webhook configurado
```

✅ **Webhook configurado!**

---

## 🧪 PASSO 6: TESTAR TUDO

### **6.1: Teste Básico**

Envie pelo WhatsApp:
```
Você: Oi
```

### **6.2: Resposta Esperada**

```
KIMO Bot:
👋 Olá! Sou o KIMO, seu assistente financeiro.

Vou te fazer algumas perguntas rápidas para te ajudar melhor.

1️⃣ Você dirige com:

1 - Carro próprio quitado
2 - Carro próprio financiado  
3 - Carro alugado (Localiza, Movida, Kovi)
4 - Híbrido (uso pessoal + apps)

Digite o número da sua opção:
```

### **6.3: Complete o Onboarding**

```
Você: 3
Bot: [Pergunta aluguel]

Você: 900
Bot: [Pergunta km/litro]

Você: 12
Bot: [Pergunta preço combustível]

Você: 5.50
Bot: [Pergunta KM/dia]

Você: 150
Bot: 🎉 Perfil configurado!
```

### **6.4: Verificar no Supabase**

1. Acesse: https://ftvgspumgzjbobymjkui.supabase.co
2. Login
3. Vá em **Table Editor**
4. Verifique:
   - ✅ `users` → deve ter seu número
   - ✅ `driver_configs` → deve ter suas configurações
   - ✅ `fixed_costs` → deve ter o aluguel

### **6.5: Testar Registro Diário**

```
Você: 1
Bot: [Pergunta ganhos]

Você: 280
Bot: [Pergunta KM]

Você: 150
Bot: [Pergunta combustível]

Você: 70
Bot: [Pergunta outras despesas]

Você: 0
Bot: [Mostra resumo]

Você: 1
Bot: ✅ Registrado!
```

### **6.6: Verificar Cálculos**

```
Você: 2
Bot: [Mostra insights do dia]

Você: 3
Bot: [Mostra meta semanal]
```

---

## 📊 VERIFICAR LOGS EM PRODUÇÃO

### **Logs da Evolution API**

1. No Railway, abra o projeto **Evolution API**
2. Clique na aba **"Deployments"**
3. Clique no deployment ativo
4. Veja logs em tempo real

### **Logs do KIMO**

1. No Railway, abra o projeto **KIMO**
2. Clique na aba **"Deployments"**
3. Clique no deployment ativo
4. Procure por:
   - `Received WhatsApp webhook`
   - `Processing message`
   - `Sending WhatsApp message`

---

## 🔧 TROUBLESHOOTING

### **Bot não responde**

#### 1. Verificar se Evolution API está rodando:
```bash
curl https://evolution-api-production-abc123.up.railway.app/
```

#### 2. Verificar se KIMO está rodando:
```bash
curl https://kimo-production-xyz789.up.railway.app/health
```

#### 3. Verificar conexão WhatsApp:
```bash
curl https://evolution-api-production-abc123.up.railway.app/instance/connectionState/kimo \
  -H 'apikey: kimo_secret_production_key_456789'
```

#### 4. Verificar webhook:
```bash
curl https://evolution-api-production-abc123.up.railway.app/webhook/find/kimo \
  -H 'apikey: kimo_secret_production_key_456789'
```

### **Erro 500 no KIMO**

Verifique logs no Railway:
- Erro de conexão Supabase → Verifique credenciais
- Erro de repositório → Pode ser schema desatualizado

### **Webhook não chega**

1. Verifique URL do webhook (deve ser a do KIMO + `/api/whatsapp/webhook`)
2. Teste manualmente:
```bash
curl -X POST https://kimo-production-xyz789.up.railway.app/api/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "messages.upsert",
    "instance": "kimo",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false
      },
      "message": {
        "conversation": "teste"
      }
    }
  }'
```

### **WhatsApp desconecta**

- Celular deve estar online
- WhatsApp deve estar aberto periodicamente
- Reconecte com QR Code se necessário

---

## 📝 SCRIPT DE TESTE AUTOMÁTICO

Salve como `test-production.sh`:

```bash
#!/bin/bash

# CONFIGURE AQUI:
EVOLUTION_URL="https://evolution-api-production-abc123.up.railway.app"
EVOLUTION_KEY="kimo_secret_production_key_456789"
KIMO_URL="https://kimo-production-xyz789.up.railway.app"

echo "🧪 TESTANDO KIMO EM PRODUÇÃO"
echo ""

# 1. Evolution API
echo "1️⃣ Evolution API..."
STATUS=$(curl -s "$EVOLUTION_URL/" | grep -o "ok")
if [ "$STATUS" = "ok" ]; then
  echo "✅ Online"
else
  echo "❌ Offline"
  exit 1
fi

# 2. KIMO API
echo "2️⃣ KIMO API..."
STATUS=$(curl -s "$KIMO_URL/health" | grep -o "ok")
if [ "$STATUS" = "ok" ]; then
  echo "✅ Online"
else
  echo "❌ Offline"
  exit 1
fi

# 3. WhatsApp
echo "3️⃣ WhatsApp..."
STATE=$(curl -s "$EVOLUTION_URL/instance/connectionState/kimo" \
  -H "apikey: $EVOLUTION_KEY" | grep -o "open")
if [ "$STATE" = "open" ]; then
  echo "✅ Conectado"
else
  echo "⚠️ Desconectado"
fi

# 4. Webhook
echo "4️⃣ Webhook..."
WEBHOOK=$(curl -s "$EVOLUTION_URL/webhook/find/kimo" \
  -H "apikey: $EVOLUTION_KEY" | grep -o "url")
if [ "$WEBHOOK" = "url" ]; then
  echo "✅ Configurado"
else
  echo "⚠️ Não configurado"
fi

echo ""
echo "✅ KIMO EM PRODUÇÃO!"
echo "📱 Envie 'Oi' pelo WhatsApp"
```

Execute:
```bash
chmod +x test-production.sh
./test-production.sh
```

---

## 🎯 PRÓXIMOS PASSOS

Após validar tudo em produção:

✅ Bot funcionando  
✅ Dados salvando  
✅ Cálculos corretos  
✅ Insights sendo gerados  

### **Implementar ÁUDIO/VOZ:**
- Integração com OpenAI Whisper
- Transcrição de mensagens de áudio
- Comandos por voz

### **Melhorias:**
- Redis para cache (Railway oferece addon)
- Jobs automáticos (cron) para resumos diários
- Dashboard web (React)
- Analytics avançado

---

## 💰 CUSTOS (Railway)

### **Plano Free:**
- $5 de crédito/mês GRÁTIS
- ~500 horas de execução
- Suficiente para testes e beta

### **Plano Hobby ($5/mês):**
- Sem dormir (free dorme após inatividade)
- Recomendado para produção

### **Monitorar uso:**
1. Railway Dashboard
2. Aba "Usage"
3. Veja uso em tempo real

---

## 🎊 CHECKLIST FINAL

- [ ] Evolution API deployed e online
- [ ] KIMO API deployed e online
- [ ] WhatsApp conectado (state: open)
- [ ] Webhook configurado e funcionando
- [ ] Onboarding completa pelo WhatsApp
- [ ] Dados salvos no Supabase
- [ ] Registro diário funciona
- [ ] Insights funcionando
- [ ] Meta semanal calculando

---

## 📸 URLS IMPORTANTES

Salve essas URLs:

```bash
# Evolution API
https://evolution-api-production-abc123.up.railway.app
Swagger: /manager
API Key: kimo_secret_production_key_456789

# KIMO API  
https://kimo-production-xyz789.up.railway.app
Health: /health
Webhook: /api/whatsapp/webhook

# Supabase
https://ftvgspumgzjbobymjkui.supabase.co
```

---

## 🚀 ESTÁ PRONTO!

Execute passo a passo e me avise quando estiver funcionando!

Depois implementamos **ÁUDIO/VOZ com Whisper API!** 🎤

---

**Dúvidas? Problemas? Coloque aqui os logs e te ajudo!** 💪

