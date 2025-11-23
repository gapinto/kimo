-- Adiciona campos de financiamento na tabela driver_configs

ALTER TABLE driver_configs 
ADD COLUMN IF NOT EXISTS financing_balance DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS financing_monthly_payment DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS financing_remaining_months INTEGER;

COMMENT ON COLUMN driver_configs.financing_balance IS 'Saldo devedor do financiamento do veículo';
COMMENT ON COLUMN driver_configs.financing_monthly_payment IS 'Valor da parcela mensal do financiamento';
COMMENT ON COLUMN driver_configs.financing_remaining_months IS 'Quantidade de parcelas restantes';

