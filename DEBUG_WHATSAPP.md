# 🔍 DEBUG CHECKLIST - WhatsApp não recebe mensagens

## ✅ Passos para Diagnosticar:

### 1️⃣ **Verificar se o Kimo API está rodando**
No Railway, verifique os logs do **kimo** (não evolution-api):
```
Settings → View Logs
```

Procure por:
- ✅ `Server is running on port 3000`
- ✅ `Scheduler started`
- ❌ Erros de startup

---

### 2️⃣ **Verificar se o Webhook está configurado**
No Evolution API:
1. Acesse: `https://evolution-api-production-fb6f.up.railway.app`
2. Vá em **Webhooks** ou **Instance Settings**
3. Confirme que o webhook está apontando para:
   ```
   https://kimo-production-[SEU-HASH].up.railway.app/api/whatsapp/webhook
   ```

---

### 3️⃣ **Testar se o webhook está recebendo mensagens**
Nos logs do Kimo, procure por:
```
[INFO] POST /api/whatsapp/webhook
[INFO] Received WhatsApp webhook
[INFO] Processing message
```

Se NÃO aparecer, o problema é no webhook do Evolution API.

---

### 4️⃣ **Verificar se o número está conectado**
No Evolution API:
1. Status da instância deve estar **"open"** ou **"connected"**
2. Se estiver desconectado, escaneie o QR code novamente

---

### 5️⃣ **Verificar se Evolution API consegue enviar mensagens**
Teste manualmente pelo Swagger/UI do Evolution API:
1. Endpoint: `POST /message/sendText/{instance}`
2. Body:
```json
{
  "number": "5581XXXXXXXX",
  "text": "Teste manual"
}
```

Se não funcionar, o problema é no Evolution API.

---

### 6️⃣ **Verificar as variáveis de ambiente do Kimo**
No Railway, vá em **Variables** e confirme:
```
EVOLUTION_API_URL=https://evolution-api-production-fb6f.up.railway.app
EVOLUTION_API_KEY=kimo_secret_production_key_456789
EVOLUTION_INSTANCE_NAME=kimo
```

---

### 7️⃣ **Verificar se o filtro de mensagens não está bloqueando**
Nos logs, procure por:
```
[INFO] Parsed message: null
```

Isso significa que a mensagem foi filtrada (canal, grupo, etc).

---

## 🎯 **AÇÃO IMEDIATA:**

**Passo 1:** Vá nos logs do Kimo e me diga o que aparece quando você envia "oi"

**Passo 2:** Qual é a URL COMPLETA do seu Kimo no Railway?
(Ex: `kimo-production-xyz789.up.railway.app`)

**Passo 3:** O Evolution API está mostrando a instância como "connected"?

---

## 💡 **POSSÍVEIS CAUSAS COMUNS:**

1. ❌ Webhook não configurado ou com URL errada
2. ❌ Evolution API desconectado (precisa escanear QR code de novo)
3. ❌ Variáveis de ambiente erradas
4. ❌ Kimo API não está rodando (crashou)
5. ❌ Mensagem sendo enviada de canal/grupo (é filtrado)

---

**Me envie os logs e a URL do Kimo que eu te ajudo a resolver!** 🔧

