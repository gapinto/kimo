-- ============================================
-- NORMALIZAÇÃO DO BANCO PARA PRISMA
-- ============================================
-- Este script alinha o banco com as Domain Entities
-- Executa mudanças de forma segura (IF NOT EXISTS, IF EXISTS)

-- ============================================
-- 1. TABELA: driver_configs
-- ============================================

-- Adicionar campos de financiamento (se não existirem)
ALTER TABLE driver_configs 
ADD COLUMN IF NOT EXISTS financing_balance DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS financing_monthly_payment DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS financing_remaining_months INTEGER;

-- ============================================
-- 2. TABELA: trips
-- ============================================

-- Renomear trip_date para date (se necessário)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'trip_date'
  ) THEN
    ALTER TABLE trips RENAME COLUMN trip_date TO date;
  END IF;
END $$;

-- Renomear description para note (opcional - mantém lógica de domínio)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'description'
  ) THEN
    ALTER TABLE trips RENAME COLUMN description TO note;
  END IF;
END $$;

-- Adicionar campos opcionais (se não existirem)
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS time_online_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_personal_use BOOLEAN DEFAULT false;

-- ============================================
-- 3. TABELA: expenses
-- ============================================

-- Renomear expense_date para date
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'expense_date'
  ) THEN
    ALTER TABLE expenses RENAME COLUMN expense_date TO date;
  END IF;
END $$;

-- ============================================
-- 4. TABELA: daily_summaries
-- ============================================

-- Garantir que todos os campos estão presentes
ALTER TABLE daily_summaries
ADD COLUMN IF NOT EXISTS trips_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_goal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS weekly_goal_status TEXT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver estrutura de todas as tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'driver_configs', 'trips', 'expenses', 'fixed_costs', 'daily_summaries')
ORDER BY table_name, ordinal_position;

