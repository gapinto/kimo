# 🚀 Guia de Deploy - KIMO

## Railway

### Configuração Inicial

1. **Variáveis de Ambiente Obrigatórias:**
   ```
   DATABASE_URL=postgresql://...
   EVOLUTION_API_URL=https://...
   EVOLUTION_API_KEY=...
   OPENAI_API_KEY=sk-...
   NODE_ENV=production
   ```

2. **Primeira Deploy:**
   - O Railway vai executar automaticamente:
     - `npm install && npm run build` (build)
     - `npm start` (start)
   - O script `start.sh` vai tentar rodar migrations com timeout de 30s
   - Se migrations falharem, a aplicação inicia mesmo assim

### Troubleshooting

#### Erro: `SIGTERM` durante migrations

**Causa:** Timeout ou problema de conexão com banco de dados.

**Soluções:**

1. **Rodar migrations manualmente (Recomendado):**
   ```bash
   # No Railway CLI ou terminal do container:
   npx prisma migrate deploy
   ```

2. **Verificar conexão com banco:**
   ```bash
   # Testar conexão:
   npx prisma db pull
   ```

3. **Usar comando sem migrations:**
   - Alterar `railway.json` temporariamente:
     ```json
     "startCommand": "npm run start:simple"
     ```
   - Fazer deploy
   - Rodar migrations manualmente
   - Voltar para `npm start`

#### Erro: `Migration failed`

**Causa:** Migration já aplicada ou conflito.

**Solução:**
```bash
# Resetar estado de migrations (CUIDADO: só em dev/staging!)
npx prisma migrate resolve --applied <migration_name>

# Ou forçar re-deploy:
npx prisma migrate deploy --force
```

#### Erro: `Connection timeout`

**Causa:** Banco de dados não acessível.

**Verificar:**
1. `DATABASE_URL` está correto?
2. Banco está online?
3. Firewall/IP whitelist configurado?

**Solução temporária:**
- Usar `start:simple` para iniciar sem migrations
- Rodar migrations depois quando banco estiver acessível

### Comandos Úteis

```bash
# Build local
npm run build

# Start sem migrations (mais rápido)
npm run start:simple

# Start com migrations (padrão)
npm start

# Start com migrations forçado (não ignora erros)
npm run start:migrate

# Rodar apenas migrations
npm run prisma:deploy
```

### Monitoramento

**Logs importantes:**
- `🚀 Starting KIMO...` - Início do processo
- `📦 Running database migrations...` - Tentando migrations
- `⚠️ Migration timeout or failed` - Migrations falharam (app continua)
- `✅ Starting application...` - App iniciando
- `🤖 KIMO Bot started successfully` - App rodando

### Performance

**Tempo esperado de startup:**
- Build: ~30-60s
- Migrations: ~5-30s (pode dar timeout)
- Start: ~5-10s
- **Total: ~40-100s**

Se passar de 2 minutos, algo está errado.

### Rollback

Se deploy falhar:
1. Railway faz rollback automático
2. Ou use: `railway rollback`
3. Ou reverta commit: `git revert HEAD && git push`

### Migrations em Produção

**IMPORTANTE:** Sempre teste migrations em staging primeiro!

```bash
# Criar nova migration (dev)
npm run prisma:migrate

# Aplicar em produção (Railway faz automaticamente)
# Ou manualmente:
npm run prisma:deploy
```

### Suporte

- Logs: `railway logs`
- Status: `railway status`
- Shell: `railway shell`

