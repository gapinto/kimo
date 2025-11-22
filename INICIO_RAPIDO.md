# 🎯 GUIA RÁPIDO - KIMO EM PRODUÇÃO

## 📌 Já está rodando?

Execute o script de teste:

```bash
cd /tmp/kimo
./test-production.sh
```

## 🚀 Ainda não fez deploy?

### **Passo 1: Deploy Evolution API**
1. Acesse: https://railway.app
2. Login com GitHub
3. New Project → Deploy from GitHub
4. Busque: `EvolutionAPI/evolution-api`
5. Configure variáveis (veja `DEPLOY_PRODUCAO.md`)
6. Generate Domain → copie URL

### **Passo 2: Subir KIMO no GitHub**

```bash
cd /tmp/kimo

# Inicializar Git (se não foi)
git init
git add .
git commit -m "feat: KIMO production ready"

# Criar repo no GitHub
# Acesse: https://github.com/new
# Nome: kimo
# Privado: sim

# Push
git remote add origin https://github.com/SEU_USUARIO/kimo.git
git branch -M main
git push -u origin main
```

### **Passo 3: Deploy KIMO no Railway**
1. Railway → New Project
2. Deploy from GitHub
3. Selecione: `SEU_USUARIO/kimo`
4. Configure variáveis (copie de `.env`)
5. Generate Domain → copie URL

### **Passo 4: Conectar WhatsApp**

Acesse o Swagger da Evolution API:
```
https://SUA_URL_EVOLUTION/manager
```

1. Authorize (com sua API key)
2. POST /instance/create → `instanceName: kimo`
3. GET /instance/connect/kimo → Escanear QR Code
4. POST /webhook/set/kimo → URL do KIMO webhook

### **Passo 5: Testar**

Envie "Oi" pelo WhatsApp! 🎉

---

## 📖 Guia Completo

Veja todos os detalhes em: **[DEPLOY_PRODUCAO.md](./DEPLOY_PRODUCAO.md)**

---

## 🔗 URLs Importantes

Após deploy, salve:

```bash
# Evolution API
URL: https://evolution-api-xxx.up.railway.app
Swagger: /manager
API Key: [sua_chave]

# KIMO API
URL: https://kimo-xxx.up.railway.app
Health: /health
Webhook: /api/whatsapp/webhook

# Supabase
URL: https://ftvgspumgzjbobymjkui.supabase.co
```

---

## ⚡ Comandos Úteis

```bash
# Testar Evolution API
curl https://SUA_URL_EVOLUTION/

# Testar KIMO
curl https://SUA_URL_KIMO/health

# Ver conexão WhatsApp
curl https://SUA_URL_EVOLUTION/instance/connectionState/kimo \
  -H 'apikey: SUA_CHAVE'

# Ver webhook
curl https://SUA_URL_EVOLUTION/webhook/find/kimo \
  -H 'apikey: SUA_CHAVE'
```

---

## 🐛 Problemas?

### Bot não responde:
1. Verifique se APIs estão online (curl)
2. Verifique WhatsApp conectado (state: open)
3. Verifique webhook configurado
4. Veja logs no Railway (Deployments → View Logs)

### WhatsApp desconectou:
```bash
# Gerar novo QR Code
curl https://SUA_URL_EVOLUTION/instance/connect/kimo \
  -H 'apikey: SUA_CHAVE'
```

### Erro no webhook:
- Verifique URL: `https://SUA_URL_KIMO/api/whatsapp/webhook`
- Deve incluir o `/api/whatsapp/webhook` no final

---

## 🎤 Próximos Passos

Quando estiver tudo funcionando:
- ✅ Testar onboarding completo
- ✅ Testar registro diário
- ✅ Verificar dados no Supabase
- ✅ Validar insights e metas

**Depois:** Implementar áudio/voz com Whisper! 🎤

---

**🚀 Qualquer dúvida, consulte:** [DEPLOY_PRODUCAO.md](./DEPLOY_PRODUCAO.md)

