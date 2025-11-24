# 🗄️ Configuração de Banco de Dados

## Problema: Connection Reset

Se você está vendo este erro:
```
Error in PostgreSQL connection: Connection reset by peer
DATABASE_ERROR
```

**Causa:** Conexão com Supabase está sendo resetada devido a:
1. Pool de conexões esgotado
2. Timeout de conexão
3. URL de conexão incorreta

## Solução: Configurar DATABASE_URL Corretamente

### Para Supabase + Railway

O Supabase oferece dois tipos de URL de conexão:

#### 1. **Connection Pooling** (Recomendado para produção)
```
postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Vantagens:**
- ✅ Gerencia conexões automaticamente
- ✅ Evita "too many connections"
- ✅ Melhor para serverless/Railway
- ✅ Mais estável

**Configurar no Railway:**
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

#### 2. **Direct Connection** (Para migrations)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Usar para:**
- ✅ Migrations (`prisma migrate deploy`)
- ✅ Prisma Studio
- ✅ Operações administrativas

**Configurar no Railway:**
```bash
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Configuração Completa no Railway

1. **Ir para Railway Dashboard**
2. **Selecionar seu projeto KIMO**
3. **Ir em Variables**
4. **Adicionar/Editar:**

```bash
# Connection Pooling (para app)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Direct Connection (para migrations)
DIRECT_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres
```

**Onde encontrar essas URLs:**
1. Ir para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar seu projeto
3. Ir em **Settings** → **Database**
4. Copiar:
   - **Connection Pooling** → `DATABASE_URL`
   - **Direct Connection** → `DIRECT_URL`

### Parâmetros Importantes

#### `pgbouncer=true`
- Habilita connection pooling
- **Obrigatório** para usar pooler do Supabase

#### `connection_limit=1`
- Limita conexões por instância
- **Recomendado** para Railway (evita esgotar pool)

#### Outros parâmetros úteis:
```
?pgbouncer=true&connection_limit=1&pool_timeout=10&connect_timeout=10
```

- `pool_timeout=10` - Timeout para pegar conexão do pool (segundos)
- `connect_timeout=10` - Timeout para conectar ao banco (segundos)

### Verificar Configuração

Após configurar, testar:

```bash
# No Railway shell:
railway shell

# Testar conexão:
npx prisma db pull

# Se funcionar, está correto! ✅
```

### Troubleshooting

#### Erro: "Connection reset by peer"
**Solução:** Usar Connection Pooling URL

#### Erro: "too many connections"
**Solução:** Adicionar `connection_limit=1` na URL

#### Erro: "timeout"
**Solução:** Adicionar `connect_timeout=10` na URL

#### Erro: "prepared statement already exists"
**Solução:** Adicionar `pgbouncer=true` na URL

### Limites do Supabase Free Tier

- **Conexões simultâneas:** 60
- **Connection Pooling:** 200 (recomendado)
- **Tamanho do banco:** 500 MB

Se estiver atingindo limites:
1. Usar Connection Pooling (aumenta para 200)
2. Adicionar `connection_limit=1` (limita por instância)
3. Fazer upgrade do plano Supabase

### Monitoramento

**Ver conexões ativas:**
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Ver conexões por aplicação:**
```sql
SELECT application_name, count(*) 
FROM pg_stat_activity 
GROUP BY application_name;
```

### Referências

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)

