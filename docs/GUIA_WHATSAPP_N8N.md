# 💬 GUIA: Configuração do WhatsApp + n8n para o KIMO

## O que vamos usar?

Para integrar WhatsApp ao KIMO, vamos usar:

1. **WhatsApp Business API** (oficial do Meta)
2. **n8n** (ferramenta de automação no-code/low-code)
3. **Provedor de WhatsApp** (360dialog ou Evolution API)

---

## OPÇÃO 1: n8n Cloud + Evolution API (RECOMENDADO para MVP)

### Por que Evolution API?
- ✅ Open-source e gratuita
- ✅ Fácil de configurar (multi-device do WhatsApp)
- ✅ Ótima para MVP e testes
- ✅ Não precisa aprovação do Meta
- ⚠️ Usa WhatsApp Web (pode ser banido se usar comercialmente em escala)

### PASSO 1.1: Instalar Evolution API

**Opção A: Docker (recomendado)**

```bash
# Clone o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure o .env
cp .env.example .env

# Edite o .env (use seu editor preferido)
# Configure:
# - AUTHENTICATION_API_KEY=sua_chave_secreta_aqui
# - DATABASE_ENABLED=true
# - DATABASE_PROVIDER=postgresql
# - DATABASE_CONNECTION_URI=sua_connection_string_do_supabase

# Inicie com Docker
docker-compose up -d
```

**Opção B: Deploy no Railway/Render (sem servidor local)**

1. Acesse https://railway.app
2. Clique em "New Project" > "Deploy from GitHub repo"
3. Conecte o repositório: https://github.com/EvolutionAPI/evolution-api
4. Configure as variáveis de ambiente (DATABASE_CONNECTION_URI, etc)
5. Deploy automático
6. Copie a URL gerada (ex: `https://evolution-api-xxxx.up.railway.app`)

### PASSO 1.2: Conectar seu WhatsApp

1. Acesse a Evolution API via Swagger: `http://localhost:8080/manager` (ou sua URL do Railway)
2. Crie uma instância:

```bash
curl -X POST 'http://localhost:8080/instance/create' \
  -H 'apikey: sua_chave_api' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceName": "kimo",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

3. Leia o QR Code:

```bash
curl -X GET 'http://localhost:8080/instance/connect/kimo' \
  -H 'apikey: sua_chave_api'
```

4. Retornará um QR Code (base64) - abra no navegador ou use um decodificador
5. **Escaneie com seu WhatsApp** (WhatsApp > Configurações > Aparelhos conectados > Conectar aparelho)
6. Pronto! Seu WhatsApp está conectado

---

## OPÇÃO 2: WhatsApp Business API Oficial (Meta) - PRODUÇÃO

### Quando usar?
- ✅ Produto em produção
- ✅ Escala (milhares de usuários)
- ✅ Recursos oficiais (templates, botões interativos)
- ⚠️ Processo de aprovação (1-2 semanas)
- ⚠️ Custo por mensagem

### PASSO 2.1: Criar Meta Business Account

1. Acesse https://business.facebook.com
2. Crie uma conta Business (se não tiver)
3. Vá em **Configurações de negócios** > **Contas** > **WhatsApp**
4. Siga o processo de verificação (CPF/CNPJ, telefone)

### PASSO 2.2: Configurar WhatsApp Business API

1. Acesse https://developers.facebook.com/apps
2. Crie um novo app > Tipo: **Business**
3. Adicione o produto **WhatsApp**
4. Configure:
   - Número de telefone (precisa ser exclusivo, não pode estar cadastrado no WhatsApp comum)
   - Webhook URL (será a URL do seu backend, ex: `https://kimo-api.com/webhook/whatsapp`)
   - Webhook token de verificação (qualquer string secreta que você definir)

5. Copie suas credenciais:
   - `WHATSAPP_API_TOKEN` (token de acesso)
   - `WHATSAPP_PHONE_NUMBER_ID` (ID do número)
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`

---

## PASSO 3: Configurar n8n

### O que é n8n?
- Ferramenta de automação visual (tipo Zapier, mas open-source)
- Conecta WhatsApp → Backend → Supabase
- Ótimo para prototipar fluxos de conversa

### PASSO 3.1: Instalar n8n

**Opção A: n8n Cloud (mais fácil)**
1. Acesse https://n8n.io
2. Crie conta gratuita
3. Inicie um novo workflow

**Opção B: Self-hosted (Docker)**

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Acesse: http://localhost:5678

### PASSO 3.2: Criar Workflow de WhatsApp

1. No n8n, crie um novo workflow
2. Adicione um **Webhook** node (trigger):
   - Method: POST
   - Path: `whatsapp`
   - Copie a URL do webhook

3. No Evolution API (ou Meta), configure o webhook para apontar para essa URL

4. Adicione um **HTTP Request** node (conectado ao Webhook):
   - URL: `http://localhost:3000/api/webhook/whatsapp` (seu backend Node.js)
   - Method: POST
   - Body: `{{ $json }}`

5. Adicione um **Supabase** node (opcional, para logs):
   - Operation: Insert
   - Table: sessions
   - Data: mensagens recebidas

6. Ative o workflow

---

## PASSO 4: Testar integração

### 4.1: Enviar mensagem teste

Envie uma mensagem para o número conectado no WhatsApp:

```
Olá!
```

### 4.2: Verificar logs

- **n8n**: Vá em "Executions" e veja se o webhook foi acionado
- **Backend**: Verifique os logs do Node.js
- **Supabase**: Verifique se dados foram gravados (se configurou o node)

---

## PASSO 5: Enviar mensagens pelo backend

Exemplo de código Node.js para enviar mensagem via Evolution API:

```javascript
const axios = require('axios');

async function sendWhatsAppMessage(to, message) {
  const response = await axios.post(
    'http://localhost:8080/message/sendText/kimo',
    {
      number: to, // ex: '5511999999999'
      text: message
    },
    {
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY
      }
    }
  );
  
  return response.data;
}

// Uso
sendWhatsAppMessage('5511999999999', 'Olá, João! Quanto você ganhou hoje?');
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

**Evolution API:**
- [ ] Evolution API rodando (local ou Railway)
- [ ] WhatsApp conectado via QR Code
- [ ] API Key configurada
- [ ] Testado envio de mensagem (via Swagger ou curl)

**WhatsApp Business API (Meta):**
- [ ] Meta Business Account criado
- [ ] App no Facebook Developers configurado
- [ ] Número de telefone verificado
- [ ] Webhook configurado
- [ ] Credentials salvas no .env

**n8n:**
- [ ] n8n rodando (cloud ou local)
- [ ] Workflow criado
- [ ] Webhook ativo e acessível
- [ ] Teste de mensagem funcionando

---

## 🔗 Próximos passos

Agora que WhatsApp está configurado:
1. Criar backend Node.js para processar mensagens
2. Implementar lógica de conversação
3. Integrar com Supabase

---

## 📚 Recursos úteis

- Evolution API: https://github.com/EvolutionAPI/evolution-api
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- n8n: https://docs.n8n.io
- Documentação Meta WhatsApp: https://developers.facebook.com/docs/whatsapp/cloud-api

