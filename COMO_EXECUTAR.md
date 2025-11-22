# 🚀 GUIA COMPLETO - EXECUTAR O KIMO

## ✅ PRÉ-REQUISITOS

- [x] Node.js 18+ instalado ✅
- [x] Supabase configurado ✅
- [x] Schema migrado ✅
- [ ] Evolution API configurado
- [ ] Dependências instaladas

---

## 📋 PASSO A PASSO

### **1. Configurar Evolution API**

#### Opção A: Docker (Local)

```bash
# Clone Evolution API
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure .env
cp .env.example .env

# Edite o .env e defina:
AUTHENTICATION_API_KEY=minha_chave_secreta_123

# Inicie com Docker
docker-compose up -d

# Aguarde ~30 segundos

# Verifique se está rodando
curl http://localhost:8080/
```

#### Opção B: Railway (Cloud)

1. Acesse: https://railway.app
2. Clique em "New Project"
3. "Deploy from GitHub repo"
4. Conecte: `https://github.com/EvolutionAPI/evolution-api`
5. Configure variável: `AUTHENTICATION_API_KEY=sua_chave`
6. Deploy automático
7. Copie a URL gerada (ex: `https://evolution-xxx.up.railway.app`)

---

### **2. Conectar WhatsApp**

```bash
# Criar instância
curl -X POST 'http://localhost:8080/instance/create' \
  -H 'apikey: minha_chave_secreta_123' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceName": "kimo",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Pegar QR Code
curl -X GET 'http://localhost:8080/instance/connect/kimo' \
  -H 'apikey: minha_chave_secreta_123'

# Vai retornar JSON com QR Code em base64
# Copie e cole em: https://base64.guru/converter/decode/image
# Ou use: https://api.qrserver.com/v1/read-qr-code/

# Escaneie o QR Code com WhatsApp:
# WhatsApp → Configurações → Aparelhos conectados → Conectar
```

---

### **3. Configurar .env do KIMO**

Edite `/tmp/kimo/.env`:

```env
# Supabase (JÁ CONFIGURADO)
SUPABASE_URL=https://ftvgspumgzjbobymjkui.supabase.co
SUPABASE_SERVICE_KEY=sb_publishable_DVbKAsLfIFZLAx9j6ufhtw_LjwyUZQZ

# WhatsApp (ADICIONE AQUI)
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=minha_chave_secreta_123
EVOLUTION_INSTANCE_NAME=kimo
```

---

### **4. Instalar Dependências**

```bash
cd /tmp/kimo
npm install
```

---

### **5. Configurar Webhook**

```bash
# Configurar Evolution API para enviar webhooks para KIMO
curl -X POST 'http://localhost:8080/webhook/set/kimo' \
  -H 'apikey: minha_chave_secreta_123' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "http://localhost:3000/api/whatsapp/webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }'
```

**⚠️ IMPORTANTE:** Se estiver rodando localmente, use `ngrok` ou `localtunnel` para expor:

```bash
# Com ngrok
ngrok http 3000

# Copie a URL gerada (ex: https://abc123.ngrok.io)
# Use essa URL no webhook: https://abc123.ngrok.io/api/whatsapp/webhook
```

---

### **6. Iniciar KIMO**

```bash
cd /tmp/kimo
npm run dev
```

**Output esperado:**
```
[INFO] Starting KIMO API...
[INFO] 🚀 Server is running on port 3000
[INFO] 📋 Environment: development
[INFO] 🏥 Health check: http://localhost:3000/health
```

---

### **7. Testar!**

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Envie mensagem pelo WhatsApp:**
   ```
   Você: Oi
   ```

3. **Complete o onboarding**

4. **Teste comandos:**
   - `1` ou `registrar dia`
   - `2` ou `resumo`
   - `3` ou `meta`

---

## 🧪 TESTES

```bash
# Rodar todos os testes
npm test

# Específicos
npm test FixedCost
npm test DriverConfig
npm test CalculateBreakeven

# Coverage
npm run test:coverage
```

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### **1. Logs do servidor**
Deve mostrar:
```
[INFO] Received WhatsApp webhook {"event":"messages.upsert"}
[INFO] Processing message {"from":"5511999999999","text":"Oi"}
[INFO] Sending WhatsApp message
```

### **2. Banco de dados**
Acesse Supabase Table Editor e veja:
- `users` - Novo usuário criado
- `driver_configs` - Config salva
- `fixed_costs` - Aluguel (se aplicável)
- `trips` - Após registrar dia
- `expenses` - Após registrar dia

---

## 🚨 TROUBLESHOOTING

### **Erro: "Missing environment variable"**
```bash
# Verifique .env
cat /tmp/kimo/.env | grep EVOLUTION
```

### **Bot não responde**
```bash
# 1. Verifique se Evolution API está conectado
curl http://localhost:8080/instance/connectionState/kimo \
  -H 'apikey: sua_chave'

# 2. Verifique webhook
curl http://localhost:8080/webhook/find/kimo \
  -H 'apikey: sua_chave'

# 3. Verifique logs do KIMO
# Deve mostrar "Received WhatsApp webhook"
```

### **Erro ao salvar no banco**
```bash
# Teste conexão com Supabase
curl https://ftvgspumgzjbobymjkui.supabase.co/rest/v1/ \
  -H "apikey: sua_service_key"
```

---

## 📱 USANDO NGROK (para desenvolvimento)

Se seu KIMO estiver local, use ngrok:

```bash
# Instalar ngrok
brew install ngrok  # Mac
# ou baixe de: https://ngrok.com

# Expor porta 3000
ngrok http 3000

# Copie a URL (ex: https://abc123.ngrok-free.app)
# Configure no webhook:
curl -X POST 'http://localhost:8080/webhook/set/kimo' \
  -H 'apikey: sua_chave' \
  -d '{
    "url": "https://abc123.ngrok-free.app/api/whatsapp/webhook"
  }'
```

---

## ✅ CHECKLIST FINAL

- [ ] Evolution API rodando
- [ ] WhatsApp conectado (QR Code)
- [ ] .env configurado com Evolution API
- [ ] Webhook configurado
- [ ] KIMO rodando (`npm run dev`)
- [ ] Mensagem "Oi" enviada e respondida
- [ ] Onboarding completado
- [ ] Dia registrado
- [ ] Dados salvos no Supabase

---

## 🎉 PRONTO!

O KIMO está **100% funcional**!

**Teste agora:**
1. Envie "Oi" pelo WhatsApp
2. Complete o onboarding
3. Registre seu primeiro dia
4. Veja insights e meta

---

## 📞 COMANDOS DISPONÍVEIS

- `oi` - Menu principal
- `1` ou `registrar dia` - Registrar ganhos/despesas
- `2` ou `resumo` - Ver insights do dia
- `3` ou `meta` - Ver breakeven semanal
- `4` ou `insights` - Dicas personalizadas

---

**Qualquer dúvida, consulte os logs ou me avise!** 🚀

