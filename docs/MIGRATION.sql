-- ============================================
-- MIGRAÇÃO KIMO - Do Schema Antigo para Refatorado
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: ATUALIZAR TABELA users
-- ============================================

-- Adicionar novas colunas na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile VARCHAR CHECK (profile IN ('own_paid', 'own_financed', 'rented', 'hybrid'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'professional'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ============================================
-- PARTE 2: ATUALIZAR TABELA trips
-- ============================================

-- Adicionar nova coluna na tabela trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_personal_use BOOLEAN DEFAULT FALSE;

-- Criar novo índice
CREATE INDEX IF NOT EXISTS idx_trips_user_date_personal ON trips(user_id, date, is_personal_use);

-- ============================================
-- PARTE 3: ATUALIZAR TABELA expenses
-- ============================================

-- Atualizar constraint de tipo (remover antiga e adicionar nova)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_type_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_type_check CHECK (type IN ('fuel', 'maintenance_preventive', 'maintenance_corrective', 'tires', 'cleaning', 'toll', 'parking', 'app_fee', 'other'));

-- Criar novo índice
CREATE INDEX IF NOT EXISTS idx_expenses_user_date_type ON expenses(user_id, date, type);

-- ============================================
-- PARTE 4: CRIAR TABELA driver_configs (NOVA)
-- ============================================

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

-- Índice
CREATE INDEX IF NOT EXISTS idx_driver_configs_user ON driver_configs(user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_driver_configs_updated_at ON driver_configs;
CREATE TRIGGER update_driver_configs_updated_at
  BEFORE UPDATE ON driver_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE driver_configs IS 'Configurações específicas de cada motorista (perfil, consumo, etc)';

-- ============================================
-- PARTE 5: CRIAR TABELA fixed_costs (NOVA)
-- ============================================

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

-- Índice
CREATE INDEX IF NOT EXISTS idx_fixed_costs_user_active ON fixed_costs(user_id, is_active);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_fixed_costs_updated_at ON fixed_costs;
CREATE TRIGGER update_fixed_costs_updated_at
  BEFORE UPDATE ON fixed_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE fixed_costs IS 'Custos fixos (aluguel, financiamento, seguro, etc)';

-- ============================================
-- PARTE 6: VERIFICAÇÃO
-- ============================================

-- Verificar estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'trips', 'expenses', 'driver_configs', 'fixed_costs')
ORDER BY table_name, ordinal_position;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

-- Execute este SQL e verifique se todas as colunas foram criadas!
-- Se houver erro, copie a mensagem e me envie.

