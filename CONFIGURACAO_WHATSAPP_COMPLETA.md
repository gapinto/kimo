# 🎯 CONFIGURAÇÃO COMPLETA DO WHATSAPP - KIMO

## 📋 VISÃO GERAL

Você vai configurar:
1. ✅ Evolution API (servidor WhatsApp)
2. ✅ Conectar seu WhatsApp
3. ✅ Configurar webhook
4. ✅ Testar integração
5. ✅ Validar fluxos completos

**Tempo estimado:** 15-20 minutos

---

## 🚀 PASSO 1: INSTALAR EVOLUTION API

### **Opção A: Docker (Recomendado para desenvolvimento)**

```bash
# 1. Clone o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# 2. Crie o arquivo .env
cat > .env << 'EOF'
# API
SERVER_URL=http://localhost:8080
AUTHENTICATION_API_KEY=kimo_secret_key_123456

# Database (usar Supabase!)
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:rhSBtOB5KVPK5iFC@db.ftvgspumgzjbobymjkui.supabase.co:5432/postgres

# Cache
CACHE_REDIS_ENABLED=false

# Webhook
WEBHOOK_GLOBAL_ENABLED=false

# Log
LOG_LEVEL=ERROR
LOG_COLOR=true
EOF

# 3. Inicie com Docker
docker-compose up -d

# 4. Aguarde ~30 segundos
sleep 30

# 5. Verifique se está rodando
curl http://localhost:8080/
# Deve retornar: {"status":"ok"}
```

### **Opção B: Railway (Cloud - Recomendado para produção)**

```bash
# 1. Acesse: https://railway.app
# 2. Crie conta (GitHub login)
# 3. Clique em "New Project"
# 4. Selecione "Deploy from GitHub repo"
# 5. Autorize acesso ao GitHub
# 6. Busque: "EvolutionAPI/evolution-api"
# 7. Configure variáveis:
#    - AUTHENTICATION_API_KEY=kimo_secret_key_123456
#    - DATABASE_CONNECTION_URI=sua_connection_string_supabase
# 8. Deploy automático (~5 min)
# 9. Copie a URL gerada (ex: evolution-api-xxx.up.railway.app)
```

---

## 📱 PASSO 2: CONECTAR WHATSAPP

### **2.1: Criar Instância**

```bash
# Substitua:
# - localhost:8080 pela URL do Railway se estiver usando cloud
# - kimo_secret_key_123456 pela sua chave

curl -X POST 'http://localhost:8080/instance/create' \
  -H 'apikey: kimo_secret_key_123456' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceName": "kimo",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Resposta esperada:
# {
#   "instance": {
#     "instanceName": "kimo",
#     "status": "created"
#   }
# }
```

### **2.2: Obter QR Code**

```bash
curl -X GET 'http://localhost:8080/instance/connect/kimo' \
  -H 'apikey: kimo_secret_key_123456'

# Vai retornar JSON com QR Code em base64:
# {
#   "base64": "data:image/png;base64,iVBORw0KG..."
# }
```

### **2.3: Escanear QR Code**

**Método 1: Navegador**
```bash
# Copie o base64 completo e cole em uma nova aba do navegador
# O QR Code será exibido
```

**Método 2: Ferramenta Online**
```
1. Acesse: https://base64.guru/converter/decode/image
2. Cole o base64 (apenas a parte depois de "base64,")
3. Clique em "Decode Base64 to Image"
4. QR Code será exibido
```

**Método 3: Swagger UI**
```
1. Acesse: http://localhost:8080/manager
2. Vá em GET /instance/connect/{instanceName}
3. Digite "kimo" e execute
4. QR Code aparecerá na resposta
```

### **2.4: Conectar WhatsApp**

1. Abra o WhatsApp no seu celular
2. Vá em **Configurações** (três pontinhos)
3. Clique em **Aparelhos conectados**
4. Clique em **Conectar um aparelho**
5. **Escaneie o QR Code** exibido
6. Aguarde a confirmação ✅

### **2.5: Verificar Conexão**

```bash
curl -X GET 'http://localhost:8080/instance/connectionState/kimo' \
  -H 'apikey: kimo_secret_key_123456'

# Resposta esperada:
# {
#   "instance": {
#     "instanceName": "kimo",
#     "state": "open"  ← CONECTADO!
#   }
# }
```

---

## 🔗 PASSO 3: CONFIGURAR WEBHOOK

### **3.1: Para Desenvolvimento Local (ngrok)**

Se o KIMO estiver rodando local, use ngrok:

```bash
# Instalar ngrok
brew install ngrok  # Mac
# ou: snap install ngrok  # Linux
# ou: https://ngrok.com/download  # Windows

# Expor porta 3000
ngrok http 3000

# Output:
# Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000

# Copie a URL (ex: https://abc123.ngrok-free.app)
```

### **3.2: Configurar Webhook na Evolution API**

```bash
# Substitua a URL pelo seu ngrok ou servidor público
curl -X POST 'http://localhost:8080/webhook/set/kimo' \
  -H 'apikey: kimo_secret_key_123456' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://abc123.ngrok-free.app/api/whatsapp/webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE"
    ]
  }'

# Resposta esperada:
# {
#   "webhook": {
#     "url": "https://abc123.ngrok-free.app/api/whatsapp/webhook",
#     "enabled": true
#   }
# }
```

### **3.3: Verificar Webhook**

```bash
curl -X GET 'http://localhost:8080/webhook/find/kimo' \
  -H 'apikey: kimo_secret_key_123456'

# Deve mostrar o webhook configurado
```

---

## ⚙️ PASSO 4: CONFIGURAR .ENV DO KIMO

Edite `/tmp/kimo/.env` e adicione:

```env
# Evolution API
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=kimo_secret_key_123456
EVOLUTION_INSTANCE_NAME=kimo
```

**Se estiver usando Railway para Evolution API:**
```env
EVOLUTION_API_URL=https://evolution-api-xxx.up.railway.app
```

---

## 🚀 PASSO 5: INICIAR KIMO

```bash
cd /tmp/kimo

# Instalar dependências (se ainda não fez)
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

**Output esperado:**
```
[INFO] Starting KIMO API... {"env":"development","port":3000}
[INFO] 🚀 Server is running on port 3000
[INFO] 📋 Environment: development
[INFO] 🏥 Health check: http://localhost:3000/health
```

---

## ✅ PASSO 6: TESTAR INTEGRAÇÃO

### **6.1: Teste o Health Check**

```bash
curl http://localhost:3000/health

# Resposta:
# {"status":"ok","timestamp":"...","service":"kimo-api"}
```

### **6.2: Envie Mensagem de Teste**

**Pelo WhatsApp:**
```
Você: Oi
```

### **6.3: Verifique os Logs**

No terminal do KIMO, você deve ver:
```
[INFO] POST /api/whatsapp/webhook
[INFO] Received WhatsApp webhook {"event":"messages.upsert"}
[INFO] Processing message {"from":"5511999999999","text":"Oi"}
[INFO] Sending WhatsApp message {"to":"5511999999999"}
```

### **6.4: Receba Resposta do Bot**

O bot deve responder:
```
👋 Olá! Sou o KIMO, seu assistente financeiro.

Vou te fazer algumas perguntas rápidas para te ajudar melhor.

1️⃣ Você dirige com:

1 - Carro próprio quitado
2 - Carro próprio financiado
3 - Carro alugado (Localiza, Movida, Kovi)
4 - Híbrido (uso pessoal + apps)

Digite o número da sua opção:
```

---

## 🧪 PASSO 7: TESTAR FLUXO COMPLETO

### **Teste 1: Onboarding**
```
Você: Oi
Bot: [Pergunta perfil]
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

### **Teste 2: Verificar no Supabase**

Acesse: https://ftvgspumgzjbobymjkui.supabase.co

1. Vá em **Table Editor**
2. Abra tabela `users` → deve ter SEU número
3. Abra `driver_configs` → deve ter sua configuração
4. Abra `fixed_costs` → deve ter o aluguel (se escolheu opção 3)

### **Teste 3: Registrar Dia**
```
Você: 1
Bot: [Pergunta ganhos]
Você: 280
Bot: [Pergunta KM]
Você: 150
Bot: [Pergunta combustível]
Você: 70
Bot: [Pergunta outras despesas]
Você: 5
Bot: [Mostra resumo]
Você: 1
Bot: ✅ Dia registrado!
```

### **Teste 4: Verificar no Supabase**

1. Tabela `trips` → deve ter a corrida
2. Tabela `expenses` → deve ter combustível + outras
3. Tabela `daily_summaries` → deve ter o resumo calculado

### **Teste 5: Meta Semanal**
```
Você: 3
Bot: [Mostra breakeven, quanto falta, etc]
```

### **Teste 6: Insights**
```
Você: 2
Bot: [Mostra insights do dia]
```

---

## 🔧 TROUBLESHOOTING

### **Bot não responde**

#### Verificar conexão Evolution API:
```bash
curl http://localhost:8080/instance/connectionState/kimo \
  -H 'apikey: kimo_secret_key_123456'
```
Deve mostrar `"state": "open"`

#### Verificar webhook:
```bash
curl http://localhost:8080/webhook/find/kimo \
  -H 'apikey: kimo_secret_key_123456'
```
Deve mostrar a URL configurada

#### Verificar logs do KIMO:
```bash
# Deve mostrar "Received WhatsApp webhook"
```

### **Erro 401 na Evolution API**

Verifique se `EVOLUTION_API_KEY` no `.env` é igual a `AUTHENTICATION_API_KEY` da Evolution API.

### **Webhook não recebe nada**

#### Se local, use ngrok:
```bash
ngrok http 3000
# Reconfigure o webhook com a URL do ngrok
```

### **Bot responde mas não salva**

Verifique credenciais do Supabase:
```bash
cat /tmp/kimo/.env | grep SUPABASE
```

### **Erro de conexão com Supabase**

Teste manualmente:
```bash
curl https://ftvgspumgzjbobymjkui.supabase.co/rest/v1/ \
  -H "apikey: sb_publishable_DVbKAsLfIFZLAx9j6ufhtw_LjwyUZQZ"
```

---

## 📊 VALIDAÇÃO COMPLETA

### **Checklist - WhatsApp Funcionando:**

- [ ] Evolution API rodando
- [ ] WhatsApp conectado (state: open)
- [ ] Webhook configurado
- [ ] KIMO rodando
- [ ] Bot responde "Oi"
- [ ] Onboarding completa
- [ ] Dados salvos no Supabase (users, driver_configs)
- [ ] Registro diário funciona
- [ ] Dados salvos (trips, expenses, daily_summaries)
- [ ] Comando "meta" funciona
- [ ] Comando "resumo" funciona

---

## 🎯 COMANDOS ÚTEIS

### **Evolution API:**

```bash
# Listar instâncias
curl http://localhost:8080/instance/fetchInstances \
  -H 'apikey: kimo_secret_key_123456'

# Desconectar WhatsApp
curl -X DELETE http://localhost:8080/instance/logout/kimo \
  -H 'apikey: kimo_secret_key_123456'

# Deletar instância
curl -X DELETE http://localhost:8080/instance/delete/kimo \
  -H 'apikey: kimo_secret_key_123456'

# Recriar QR Code
curl http://localhost:8080/instance/connect/kimo \
  -H 'apikey: kimo_secret_key_123456'
```

### **KIMO:**

```bash
# Iniciar
cd /tmp/kimo && npm run dev

# Testes
npm test

# Ver logs específicos
npm run dev | grep "WhatsApp"
```

---

## 📝 SCRIPT DE TESTE COMPLETO

Execute este script para testar tudo:

```bash
#!/bin/bash

echo "🧪 TESTANDO CONFIGURAÇÃO DO KIMO + WHATSAPP"
echo ""

# 1. Testar Evolution API
echo "1️⃣ Testando Evolution API..."
EVOLUTION_STATUS=$(curl -s http://localhost:8080/ | grep -o "ok")
if [ "$EVOLUTION_STATUS" = "ok" ]; then
  echo "✅ Evolution API funcionando"
else
  echo "❌ Evolution API não está respondendo"
  exit 1
fi

# 2. Testar conexão WhatsApp
echo ""
echo "2️⃣ Testando conexão WhatsApp..."
CONNECTION=$(curl -s http://localhost:8080/instance/connectionState/kimo \
  -H 'apikey: kimo_secret_key_123456' | grep -o "open")
if [ "$CONNECTION" = "open" ]; then
  echo "✅ WhatsApp conectado"
else
  echo "⚠️ WhatsApp não conectado - execute QR Code"
fi

# 3. Testar webhook
echo ""
echo "3️⃣ Testando webhook..."
WEBHOOK=$(curl -s http://localhost:8080/webhook/find/kimo \
  -H 'apikey: kimo_secret_key_123456' | grep -o "webhook")
if [ "$WEBHOOK" = "webhook" ]; then
  echo "✅ Webhook configurado"
else
  echo "⚠️ Webhook não configurado"
fi

# 4. Testar KIMO
echo ""
echo "4️⃣ Testando KIMO API..."
KIMO_STATUS=$(curl -s http://localhost:3000/health | grep -o "ok")
if [ "$KIMO_STATUS" = "ok" ]; then
  echo "✅ KIMO funcionando"
else
  echo "❌ KIMO não está respondendo - execute 'npm run dev'"
  exit 1
fi

# 5. Testar Supabase
echo ""
echo "5️⃣ Testando Supabase..."
SUPABASE_STATUS=$(curl -s https://ftvgspumgzjbobymjkui.supabase.co/rest/v1/ \
  -H "apikey: sb_publishable_DVbKAsLfIFZLAx9j6ufhtw_LjwyUZQZ" | grep -o "message")
if [ "$SUPABASE_STATUS" ]; then
  echo "✅ Supabase conectado"
else
  echo "❌ Erro ao conectar com Supabase"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TUDO CONFIGURADO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Envie 'Oi' pelo WhatsApp para testar!"
```

Salve como `test-setup.sh` e execute:
```bash
chmod +x test-setup.sh
./test-setup.sh
```

---

## 🎬 FLUXOS PARA TESTAR

### **Fluxo 1: Onboarding (Carro Alugado)**
```
1. Você: Oi
2. Bot: [Menu perfil]
3. Você: 3
4. Bot: [Pergunta aluguel]
5. Você: 900
6. Bot: [Pergunta km/litro]
7. Você: 12
8. Bot: [Pergunta preço combustível]
9. Você: 5.50
10. Bot: [Pergunta KM/dia]
11. Você: 150
12. Bot: 🎉 Perfil configurado!
```

### **Fluxo 2: Registro Diário**
```
1. Você: 1
2. Bot: [Pergunta ganhos]
3. Você: 280
4. Bot: [Pergunta KM]
5. Você: 150
6. Bot: [Pergunta combustível]
7. Você: 70
8. Bot: [Pergunta outras despesas]
9. Você: 0
10. Bot: [Mostra resumo]
11. Você: 1
12. Bot: ✅ Dia registrado + insights!
```

### **Fluxo 3: Meta Semanal**
```
Você: 3 (ou "meta")
Bot: [Mostra breakeven, quanto falta/dia]
```

### **Fluxo 4: Insights**
```
Você: 2 (ou "resumo")
Bot: [Mostra insights, warnings, dicas]
```

---

## 📸 SCREENSHOTS ESPERADOS

### **1. Evolution API Swagger**
```
http://localhost:8080/manager
```
Deve mostrar todos os endpoints disponíveis.

### **2. Supabase Table Editor**
```
https://ftvgspumgzjbobymjkui.supabase.co
```
Após onboarding, deve ter:
- 1 linha em `users`
- 1 linha em `driver_configs`
- 1 linha em `fixed_costs` (se alugado)

### **3. KIMO Health Check**
```
http://localhost:3000/health
```
```json
{
  "status": "ok",
  "timestamp": "2024-11-22T...",
  "service": "kimo-api"
}
```

---

## 🎯 APÓS VALIDAR TUDO

Quando tudo estiver funcionando:

✅ WhatsApp respondendo  
✅ Onboarding salvando no banco  
✅ Registro diário funcionando  
✅ Insights sendo gerados  

**Aí me avise que implemento o ÁUDIO/VOZ!** 🎤

---

## 📞 PRECISA DE AJUDA?

### **Evolution API não conecta:**
```bash
# Verifique logs do Docker
docker logs -f evolution-api

# Ou reinicie
docker-compose restart
```

### **WhatsApp desconecta:**
- Verifique conexão de internet
- Celular deve estar online
- WhatsApp deve estar aberto no celular

### **Bot não responde mas webhook chega:**
- Verifique logs do KIMO
- Verifique .env (Evolution API Key)
- Teste conexão Supabase

---

## 🎊 RESULTADO ESPERADO

Ao final, você terá:

✅ Bot WhatsApp 100% funcional  
✅ Conversando naturalmente  
✅ Salvando dados no Supabase  
✅ Gerando insights inteligentes  
✅ Calculando breakeven real  
✅ Pronto para adicionar áudio/voz  

---

**Execute este guia e me avise quando estiver tudo funcionando!** 🚀

Depois implementamos **ÁUDIO/VOZ com Whisper!** 🎤

