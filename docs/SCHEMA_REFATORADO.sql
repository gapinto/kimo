-- ============================================
-- SCHEMA KIMO - REFATORADO
-- Assistente Financeiro Uber com perfis de motorista
-- ============================================

-- Tabela de usuários (motoristas) - ATUALIZADA
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  weekly_goal NUMERIC(10,2) DEFAULT 0,
  profile VARCHAR CHECK (profile IN ('own_paid', 'own_financed', 'rented', 'hybrid')),
  subscription_plan VARCHAR DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'professional')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações do motorista - NOVA
CREATE TABLE IF NOT EXISTS driver_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  profile VARCHAR NOT NULL CHECK (profile IN ('own_paid', 'own_financed', 'rented', 'hybrid')),
  car_value NUMERIC(10,2),
  fuel_consumption NUMERIC(8,2) NOT NULL,
  avg_fuel_price NUMERIC(10,2) NOT NULL,
  avg_km_per_day NUMERIC(8,2) NOT NULL,
  work_days_per_week INTEGER DEFAULT 6 CHECK (work_days_per_week >= 1 AND work_days_per_week <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de custos fixos - NOVA
CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('financing', 'rental', 'insurance', 'tracker', 'ipva', 'phone_plan', 'periodic_wash', 'depreciation', 'other')),
  amount NUMERIC(10,2) NOT NULL,
  frequency VARCHAR NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões WhatsApp
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wa_psid VARCHAR,
  state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de corridas/receitas - ATUALIZADA
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings NUMERIC(10,2) NOT NULL,
  km NUMERIC(8,2) DEFAULT 0,
  time_online_minutes INTEGER DEFAULT 0,
  is_personal_use BOOLEAN DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de despesas - ATUALIZADA
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('fuel', 'maintenance_preventive', 'maintenance_corrective', 'tires', 'cleaning', 'toll', 'parking', 'app_fee', 'other')),
  amount NUMERIC(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de resumos diários (cache)
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings NUMERIC(10,2) DEFAULT 0,
  expenses NUMERIC(10,2) DEFAULT 0,
  km NUMERIC(8,2) DEFAULT 0,
  profit NUMERIC(10,2) DEFAULT 0,
  cost_per_km NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trips_user_date ON trips(user_id, date);
CREATE INDEX IF NOT EXISTS idx_trips_user_date_personal ON trips(user_id, date, is_personal_use);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date_type ON expenses(user_id, date, type);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_user_active ON fixed_costs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_driver_configs_user ON driver_configs(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_configs_updated_at ON driver_configs;
CREATE TRIGGER update_driver_configs_updated_at
  BEFORE UPDATE ON driver_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixed_costs_updated_at ON fixed_costs;
CREATE TRIGGER update_fixed_costs_updated_at
  BEFORE UPDATE ON fixed_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Motoristas cadastrados no sistema';
COMMENT ON TABLE driver_configs IS 'Configurações específicas de cada motorista (perfil, consumo, etc)';
COMMENT ON TABLE fixed_costs IS 'Custos fixos (aluguel, financiamento, seguro, etc)';
COMMENT ON TABLE trips IS 'Registro de ganhos por dia/corrida';
COMMENT ON TABLE expenses IS 'Registro de despesas variáveis';
COMMENT ON TABLE daily_summaries IS 'Cache de cálculos diários para queries rápidas';

