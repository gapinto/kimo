# 🔄 Como Aplicar a Migration de Financiamento

Esta migration adiciona 3 novos campos na tabela `driver_configs` para suportar dados detalhados de financiamento.

## 📋 Campos Adicionados

1. **financing_balance** - Saldo devedor do financiamento
2. **financing_monthly_payment** - Valor da parcela mensal
3. **financing_remaining_months** - Quantidade de parcelas restantes

---

## 🚀 Como Aplicar no Supabase

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard**
   - URL: https://app.supabase.com
   - Login com sua conta

2. **Selecione seu Projeto**
   - Nome: `kimo` (ou o nome que você escolheu)

3. **Vá para SQL Editor**
   - No menu lateral esquerdo, clique em "SQL Editor"
   - Ou acesse: https://app.supabase.com/project/ftvgspumgzjbobymjkui/sql

4. **Crie uma Nova Query**
   - Clique no botão "+ New query"

5. **Cole o SQL da Migration**
   ```sql
   -- Adiciona campos de financiamento na tabela driver_configs

   ALTER TABLE driver_configs 
   ADD COLUMN IF NOT EXISTS financing_balance DECIMAL(10, 2),
   ADD COLUMN IF NOT EXISTS financing_monthly_payment DECIMAL(10, 2),
   ADD COLUMN IF NOT EXISTS financing_remaining_months INTEGER;

   COMMENT ON COLUMN driver_configs.financing_balance IS 'Saldo devedor do financiamento do veículo';
   COMMENT ON COLUMN driver_configs.financing_monthly_payment IS 'Valor da parcela mensal do financiamento';
   COMMENT ON COLUMN driver_configs.financing_remaining_months IS 'Quantidade de parcelas restantes';
   ```

6. **Execute a Query**
   - Clique no botão "Run" (ou pressione Ctrl+Enter)
   - Você deve ver: "Success. No rows returned"

7. **Verifique as Colunas**
   - Vá para "Table Editor" → "driver_configs"
   - Verifique se as 3 novas colunas aparecem

---

### Opção 2: Via psql (Terminal)

Se você preferir usar o terminal:

```bash
# Conectar ao banco
psql "postgresql://postgres:rhSBtOB5KVPK5iFC@db.ftvgspumgzjbobymjkui.supabase.co:5432/postgres"

# Cole e execute a migration
ALTER TABLE driver_configs 
ADD COLUMN IF NOT EXISTS financing_balance DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS financing_monthly_payment DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS financing_remaining_months INTEGER;

# Saia
\q
```

---

## ✅ Como Verificar se Funcionou

Execute esta query para ver a estrutura atualizada:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'driver_configs'
AND column_name LIKE 'financing%';
```

**Resultado esperado:**
```
column_name                    | data_type | is_nullable
-------------------------------|-----------|------------
financing_balance              | numeric   | YES
financing_monthly_payment      | numeric   | YES
financing_remaining_months     | integer   | YES
```

---

## 🎯 O que Acontece Depois

Após aplicar esta migration:

1. ✅ Onboarding perguntará sobre financiamento para carros financiados
2. ✅ Meta diária será calculada considerando parcelas
3. ✅ Resumo final mostrará custos fixos detalhados
4. ✅ Projeção de lucro mensal será mais precisa

---

## ⚠️ Importante

- Esta migration é **SEGURA** - usa `IF NOT EXISTS`
- **Não afeta dados existentes**
- Pode ser executada múltiplas vezes sem problemas
- Os campos são opcionais (nullable)

---

## 🐛 Problemas?

### Erro: "permission denied"
**Solução:** Certifique-se de estar usando as credenciais corretas do Supabase.

### Erro: "relation driver_configs does not exist"
**Solução:** Execute primeiro a migration base: `docs/SCHEMA_REFATORADO.sql`

### Dúvidas?
Verifique se está conectado ao banco correto:
```sql
SELECT current_database();
-- Deve retornar: postgres
```

---

## 📊 Próximos Passos

Depois de aplicar a migration:
1. ✅ Faça o deploy no Railway (já foi feito o commit)
2. ✅ Teste o onboarding com um novo usuário
3. ✅ Verifique se as metas estão sendo calculadas corretamente

