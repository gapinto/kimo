# 🎤 Integração de Áudio com DeepSeek e Groq

## 📋 **RESUMO**

O KIMO agora suporta **mensagens de voz** via WhatsApp! O motorista pode enviar áudios para registrar corridas, despesas e consultar resumos.

---

## 🏗️ **ARQUITETURA**

```
Áudio WhatsApp (OGG/MP3)
    ↓
Evolution API → Webhook → KIMO
    ↓
AudioTranscriptionService (Groq Whisper - GRÁTIS)
    ↓
Texto transcrito: "Fiz uma corrida de quarenta e cinco reais e rodei doze quilômetros"
    ↓
NLPService (DeepSeek - ~$0.14/1M tokens)
    ↓
Dados extraídos: {intent: "trip", earnings: 45, km: 12, confidence: 0.95}
    ↓
ConversationService (processa e pede confirmação)
    ↓
WhatsApp: "✅ Entendi: Ganho R$ 45,00, 12km. Confirma? (sim/não)"
```

---

## 🔑 **CONFIGURAÇÃO**

### **1️⃣ Obter Groq API Key (Whisper - GRÁTIS)**

1. Acesse: https://console.groq.com/
2. Crie uma conta
3. Vá em **API Keys** → **Create API Key**
4. Copie a chave

### **2️⃣ Obter DeepSeek API Key**

1. Acesse: https://platform.deepseek.com/
2. Faça login
3. Vá em **API Keys** → **Create New Key**
4. Copie a chave

### **3️⃣ Configurar no Railway**

No Railway → Projeto **KIMO** → **Variables**:

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

Salve e aguarde o redeploy (~2 minutos).

---

## 🎯 **FUNCIONALIDADES**

### **1️⃣ Registrar Corrida por Áudio**

```
🎤 Usuário envia áudio:
"Fiz uma corrida de quarenta e cinco reais e rodei doze quilômetros"

🤖 KIMO responde:
🎤 Processando áudio...

✅ Entendi:

💰 Ganho: R$ 45,00
🚗 KM rodados: 12 km

*Está correto?* (sim/não)
```

### **2️⃣ Registrar Despesa por Áudio**

```
🎤 Usuário envia áudio:
"Abasteci oitenta reais"

🤖 KIMO responde:
🎤 Processando áudio...

✅ Entendi:

💸 Despesa: R$ 80,00
📋 Tipo: Combustível

*Está correto?* (sim/não)
```

### **3️⃣ Consultar Resumo por Áudio**

```
🎤 Usuário envia áudio:
"Quanto eu lucrei hoje?"

🤖 KIMO responde:
📊 Resumo de Hoje (22/11):

💰 Ganhos: R$ 250,00
⛽ Despesas: R$ 80,00
✅ Lucro: R$ 170,00
🚗 KM rodados: 180 km
```

---

## 💰 **CUSTOS**

### **Groq (Whisper)**
- **Preço:** GRÁTIS 🎉
- **Limite:** 14.400 requests/dia (suficiente!)
- **Velocidade:** ~2-5 segundos por áudio

### **DeepSeek (NLP)**
- **Preço:** $0.14 / 1 milhão de tokens de entrada
- **Custo por mensagem:** ~$0.0001 (R$ 0,0005)
- **Exemplo:** 10.000 áudios/mês = ~R$ 5,00

**Total mensal estimado:** ~R$ 5-10 (super barato!)

---

## 🛠️ **ARQUIVOS CRIADOS**

- `src/application/services/AudioTranscriptionService.ts` - Transcreve áudio usando Groq Whisper
- `src/application/services/NLPService.ts` - Extrai dados usando DeepSeek
- Atualizado `ConversationService.ts` - Métodos `processAudio()`, `handleAudioTrip()`, `handleAudioExpense()`
- Atualizado `WhatsAppWebhookController.ts` - Roteamento de áudio vs texto

---

## 🧪 **TESTANDO**

### **1️⃣ Teste Local (opcional)**

```bash
# Instalar dependências
npm install

# Configurar .env
GROQ_API_KEY=sua_chave_aqui
DEEPSEEK_API_KEY=sua_chave_aqui

# Rodar
npm run dev
```

### **2️⃣ Teste em Produção**

1. Configure as chaves no Railway
2. Aguarde o deploy
3. Envie um **áudio** no WhatsApp conectado
4. KIMO deve responder com o texto transcrito e pedir confirmação

---

## ❓ **TROUBLESHOOTING**

### **"Processamento de áudio não está disponível"**
- Verifique se `GROQ_API_KEY` e `DEEPSEEK_API_KEY` estão configuradas no Railway
- Aguarde o redeploy completar

### **"Não entendi muito bem"**
- Áudio com muito ruído ou mal gravado
- Fale mais claramente e devagar
- Ou use texto como fallback

### **"Erro ao processar áudio"**
- Verifique os logs do Railway
- Pode ser problema de rede ao baixar o áudio do WhatsApp
- Tente novamente

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ **Áudio implementado**
2. ⏳ **Comandos rápidos por texto** (`/corrida 45 12km`)
3. ⏳ **Mensagens automáticas** (bom dia, resumo semanal)
4. ⏳ **Testes com usuários beta**

---

## 📚 **REFERÊNCIAS**

- Groq Whisper: https://console.groq.com/docs/speech-text
- DeepSeek API: https://platform.deepseek.com/api-docs/
- Evolution API: https://doc.evolution-api.com/


