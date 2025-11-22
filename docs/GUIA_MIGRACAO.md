# 🔧 GUIA DE MIGRAÇÃO - KIMO

## ⚠️ ERRO ENCONTRADO

```
ERROR: 42703: column "is_personal_use" does not exist
```

**Causa:** As tabelas já existem (schema antigo), então `CREATE TABLE IF NOT EXISTS` não atualiza as colunas existentes.

**Solução:** Usar `ALTER TABLE` para adicionar novas colunas.

---

## ✅ PASSO A PASSO PARA MIGRAÇÃO

### 1. **Acesse o Supabase SQL Editor**
```
https://ftvgspumgzjbobymjkui.supabase.co
```

### 2. **Abra o arquivo de migração**
```
/tmp/kimo/docs/MIGRATION.sql
```

### 3. **Cole TODO o conteúdo no SQL Editor**

### 4. **Clique em RUN** (ou Ctrl + Enter)

### 5. **Aguarde a execução** (pode demorar alguns segundos)

---

## 📊 O QUE A MIGRAÇÃO FAZ

### **Parte 1: Atualiza `users`**
- ✅ Adiciona coluna `profile`
- ✅ Adiciona coluna `subscription_plan`
- ✅ Adiciona coluna `subscription_expires_at`

### **Parte 2: Atualiza `trips`**
- ✅ Adiciona coluna `is_personal_use`
- ✅ Cria índice `idx_trips_user_date_personal`

### **Parte 3: Atualiza `expenses`**
- ✅ Atualiza constraint de tipo (9 categorias)
- ✅ Cria índice `idx_expenses_user_date_type`

### **Parte 4: Cria `driver_configs`** (NOVA)
- ✅ Tabela completa com todas as colunas
- ✅ Índices
- ✅ Triggers

### **Parte 5: Cria `fixed_costs`** (NOVA)
- ✅ Tabela completa com todas as colunas
- ✅ Índices
- ✅ Triggers

### **Parte 6: Verificação**
- ✅ Lista todas as colunas das tabelas
- ✅ Mostra o resultado da migração

---

## ✅ RESULTADO ESPERADO

Após executar, você verá:

```sql
table_name        | column_name              | data_type | is_nullable
------------------+--------------------------+-----------+-------------
users             | id                       | uuid      | NO
users             | phone                    | varchar   | NO
users             | name                     | varchar   | YES
users             | weekly_goal              | numeric   | YES
users             | profile                  | varchar   | YES  ← NOVA
users             | subscription_plan        | varchar   | YES  ← NOVA
users             | subscription_expires_at  | timestamp | YES  ← NOVA
...
trips             | is_personal_use          | boolean   | YES  ← NOVA
...
driver_configs    | ...                      | ...       | ...  ← TABELA NOVA
fixed_costs       | ...                      | ...       | ...  ← TABELA NOVA
```

---

## 🚨 SE DER ERRO

### **Erro: "constraint already exists"**
**Solução:** Isso é normal, o script usa `IF NOT EXISTS` para evitar duplicatas.

### **Erro: "permission denied"**
**Solução:** Verifique se você está usando o SQL Editor com permissões de admin.

### **Erro: "syntax error"**
**Solução:** Certifique-se de copiar TODO o conteúdo do arquivo MIGRATION.sql.

### **Outro erro?**
**Ação:** Copie a mensagem de erro completa e me envie!

---

## 🎯 APÓS A MIGRAÇÃO

Depois que executar com sucesso:

1. ✅ Verifique em **Table Editor** se as tabelas estão lá:
   - `users` (atualizada)
   - `trips` (atualizada)
   - `expenses` (atualizada)
   - `driver_configs` (nova)
   - `fixed_costs` (nova)

2. ✅ Me avise: **"Migração OK"**

3. ✅ Eu continuo implementando os repositórios! 🚀

---

## 📝 BACKUP (Opcional mas Recomendado)

Antes de migrar, você pode fazer backup:

```bash
# No Supabase Dashboard:
1. Vá em Settings > Database
2. Clique em "Connection string"
3. Use pg_dump para backup (se quiser)
```

Mas como é desenvolvimento e não tem dados críticos, pode executar direto! 😉

---

**Execute o MIGRATION.sql e me avise o resultado!** ✅

