# 🗄️ GUIA: Configuração do Supabase para o KIMO

## O que é Supabase?
Supabase é um "Firebase alternativo" open-source baseado em PostgreSQL. Oferece:
- Banco de dados PostgreSQL gerenciado
- APIs REST automáticas
- Autenticação pronta
- Storage de arquivos
- Dashboard web para administração

---

## PASSO 1: Criar conta no Supabase

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub (recomendado) ou email
4. Você será direcionado para o dashboard

---

## PASSO 2: Criar novo projeto

1. No dashboard, clique em "New Project"
2. Preencha:
   - **Name**: `kimo-production` (ou `kimo-dev` para desenvolvimento)
   - **Database Password**: Gere uma senha forte e **SALVE EM LUGAR SEGURO**
   - **Region**: `South America (São Paulo)` (menor latência para Brasil)
   - **Pricing Plan**: Free (suficiente para MVP - 500MB DB, 2GB storage)
   
3. Clique em "Create new project"
4. **Aguarde 2-3 minutos** enquanto o projeto é provisionado

---

## PASSO 3: Copiar credenciais do projeto

Após criação, você verá o dashboard do projeto. Vá em **Settings** > **API**:

1. **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - Copie e salve como `SUPABASE_URL`

2. **Project API keys**:
   - **anon/public key**: Use no frontend (segura, com RLS)
   - **service_role key**: Use no backend (SECRETA, full access)
   - Copie e salve como `SUPABASE_SERVICE_KEY`

3. **Database Password**: a senha que você criou no passo anterior
   - Salve como `SUPABASE_DB_PASSWORD`

**⚠️ IMPORTANTE**: Nunca commite essas chaves no Git!

---

## PASSO 4: Criar schema do banco de dados

1. No dashboard do Supabase, vá em **SQL Editor** (ícone de banco no menu lateral)
2. Clique em "+ New query"
3. Cole o SQL abaixo e execute (botão RUN ou Ctrl+Enter):

```sql
-- ============================================
-- SCHEMA KIMO - Assistente Financeiro Uber
-- ============================================

-- Tabela de usuários (motoristas)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  weekly_goal NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões WhatsApp
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wa_psid VARCHAR,
  state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de corridas/receitas
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings NUMERIC(10,2) NOT NULL,
  km NUMERIC(8,2) DEFAULT 0,
  time_online_minutes INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de despesas
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR NOT NULL, -- 'fuel', 'maintenance', 'toll', 'other'
  amount NUMERIC(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de resumos diários (cache)
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings NUMERIC(10,2) DEFAULT 0,
  expenses NUMERIC(10,2) DEFAULT 0,
  km NUMERIC(8,2) DEFAULT 0,
  profit NUMERIC(10,2) DEFAULT 0,
  cost_per_km NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Índices para performance
CREATE INDEX idx_trips_user_date ON trips(user_id, date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Motoristas cadastrados no sistema';
COMMENT ON TABLE trips IS 'Registro de ganhos por dia/corrida';
COMMENT ON TABLE expenses IS 'Registro de despesas (combustível, manutenção, etc)';
COMMENT ON TABLE daily_summaries IS 'Cache de cálculos diários para queries rápidas';
```

4. Se tudo correr bem, você verá "Success. No rows returned"
5. Vá em **Table Editor** (menu lateral) e confirme que as 5 tabelas foram criadas:
   - users
   - sessions
   - trips
   - expenses
   - daily_summaries

---

## PASSO 5: Testar conexão (opcional, mas recomendado)

Você pode testar inserindo dados manualmente:

```sql
-- Inserir usuário teste
INSERT INTO users (phone, name, weekly_goal)
VALUES ('+5511999999999', 'João Silva', 700.00);

-- Verificar
SELECT * FROM users;
```

---

## PASSO 6: Configurar .env local

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=sua_service_role_key_aqui
SUPABASE_DB_PASSWORD=sua_senha_db_aqui

# Node
NODE_ENV=development
PORT=3000
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Projeto Supabase criado
- [ ] Credenciais (URL + Service Key) salvas no .env
- [ ] Schema SQL executado sem erros
- [ ] 5 tabelas criadas (visíveis no Table Editor)
- [ ] Arquivo .env criado (e adicionado ao .gitignore!)

---

## 🔗 Próximos passos

Agora que o Supabase está configurado, vamos:
1. Configurar n8n para WhatsApp
2. Criar o backend Node.js
3. Conectar tudo

---

## 📚 Recursos úteis

- Documentação oficial: https://supabase.com/docs
- Cliente JavaScript: https://supabase.com/docs/reference/javascript
- SQL Reference: https://supabase.com/docs/guides/database

