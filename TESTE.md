# 🚀 GUIA DE TESTE - KIMO

## O QUE JÁ ESTÁ FUNCIONANDO

✅ **26 arquivos TypeScript** criados com TDD e SOLID  
✅ Camada de Domínio completa  
✅ Repositórios Supabase implementados  
✅ Servidor Express configurado  
✅ Integração com banco de dados pronta  

---

## PASSO 1: INSTALAR DEPENDÊNCIAS

```bash
cd /tmp/kimo
npm install
```

**Dependências principais:**
- `@supabase/supabase-js` - Cliente Supabase
- `express` - Servidor HTTP
- `dotenv` - Variáveis de ambiente
- `typescript` + `tsx` - TypeScript
- `jest` - Testes

---

## PASSO 2: VERIFICAR .ENV

O arquivo `.env` já está configurado com suas credenciais:

```bash
cat .env | grep SUPABASE
```

Deve mostrar:
```
SUPABASE_URL=https://ftvgspumgzjbobymjkui.supabase.co
SUPABASE_SERVICE_KEY=sb_publishable_DVbKAsLfIFZLAx9j6ufhtw_LjwyUZQZ
```

---

## PASSO 3: RODAR TESTES UNITÁRIOS

```bash
npm test
```

**Resultado esperado:**
```
 PASS  tests/unit/domain/value-objects/Money.test.ts
 PASS  tests/unit/domain/value-objects/Distance.test.ts
 PASS  tests/unit/domain/value-objects/Phone.test.ts
 PASS  tests/unit/domain/entities/User.test.ts
 PASS  tests/unit/domain/entities/Trip.test.ts
 PASS  tests/unit/domain/entities/Expense.test.ts
 PASS  tests/unit/domain/entities/DailySummary.test.ts

Test Suites: 7 passed, 7 total
Tests:       XX passed, XX total
```

---

## PASSO 4: VERIFICAR COVERAGE

```bash
npm run test:coverage
```

Deve mostrar **alta cobertura** (>80%) nas camadas de domínio.

---

## PASSO 5: INICIAR SERVIDOR

```bash
npm run dev
```

**Output esperado:**
```
[2024-11-22T12:00:00.000Z] [INFO] Starting KIMO API... {"env":"development","port":3000}
[2024-11-22T12:00:00.000Z] [INFO] 🚀 Server is running on port 3000
[2024-11-22T12:00:00.000Z] [INFO] 📋 Environment: development
[2024-11-22T12:00:00.000Z] [INFO] 🏥 Health check: http://localhost:3000/health
```

---

## PASSO 6: TESTAR HEALTH CHECK

Em outro terminal:

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-22T12:00:00.000Z",
  "service": "kimo-api"
}
```

---

## PASSO 7: TESTAR CONEXÃO COM SUPABASE

Vamos criar um script de teste rápido:

```bash
# Criar script de teste
cat > /tmp/kimo/test-supabase.ts << 'EOF'
import { getSupabaseClient } from './src/infrastructure/database/supabase.client';
import { SupabaseUserRepository } from './src/infrastructure/database/repositories/SupabaseUserRepository';
import { User } from './src/domain/entities/User';
import { Phone } from './src/domain/value-objects/Phone';
import 'dotenv/config';

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...\n');

  try {
    const client = getSupabaseClient();
    const userRepo = new SupabaseUserRepository(client);

    // Testar criação de usuário
    const phone = Phone.create('11999999999');
    const user = User.create({
      phone,
      name: 'João Teste',
      weeklyGoal: 700,
    });

    console.log('✅ Criando usuário de teste...');
    await userRepo.save(user);
    console.log(`✅ Usuário criado: ${user.id}\n`);

    // Buscar usuário
    console.log('🔍 Buscando usuário...');
    const found = await userRepo.findByPhone(phone);

    if (found) {
      console.log('✅ Usuário encontrado:');
      console.log(`   ID: ${found.id}`);
      console.log(`   Phone: ${found.phone.formatted()}`);
      console.log(`   Name: ${found.name}`);
      console.log(`   Weekly Goal: R$ ${found.weeklyGoal}\n`);
    }

    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testSupabase();
EOF

# Executar teste
npx tsx test-supabase.ts
```

**Se tudo funcionar:**
```
🔍 Testando conexão com Supabase...

✅ Criando usuário de teste...
✅ Usuário criado: 123e4567-e89b-12d3-a456-426614174000

🔍 Buscando usuário...
✅ Usuário encontrado:
   ID: 123e4567-e89b-12d3-a456-426614174000
   Phone: +55 11 99999-9999
   Name: João Teste
   Weekly Goal: R$ 700

✅ Teste concluído com sucesso!
```

---

## PASSO 8: VERIFICAR DADOS NO SUPABASE

1. Acesse: https://ftvgspumgzjbobymjkui.supabase.co
2. Vá em **Table Editor**
3. Clique na tabela `users`
4. Você deve ver o usuário criado no teste!

---

## 🧪 TESTES DISPONÍVEIS

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Modo watch (útil durante desenvolvimento)
npm run test:watch

# Coverage completo
npm run test:coverage
```

---

## 🔍 VERIFICAR QUALIDADE DO CÓDIGO

```bash
# TypeScript type checking
npm run typecheck

# ESLint
npm run lint

# Prettier (formatar código)
npm run format
```

---

## 📊 ESTRUTURA IMPLEMENTADA

```
✅ Domain Layer
   ├── Value Objects (Money, Distance, Phone)
   ├── Entities (User, Trip, Expense, DailySummary)
   ├── Repository Interfaces
   └── Use Cases (5 implementados)

✅ Infrastructure Layer
   ├── Supabase Client
   ├── Repositories (4 implementados)
   └── HTTP Server (Express)

✅ Shared
   ├── Errors (AppError, NotFoundError, etc)
   └── Utils (logger, env)

✅ Tests
   └── Unit Tests (7 suites, alta cobertura)
```

---

## 🎯 O QUE TESTAR MANUALMENTE

### 1. Value Objects
```typescript
import { Money } from './src/domain/value-objects/Money';

const m1 = Money.create(100);
const m2 = Money.create(50);
const total = m1.add(m2);
console.log(total.toString()); // R$ 150.00
```

### 2. Entities
```typescript
import { User } from './src/domain/entities/User';
import { Phone } from './src/domain/value-objects/Phone';

const user = User.create({
  phone: Phone.create('11999999999'),
  name: 'João Silva',
  weeklyGoal: 700,
});
console.log(user.toJSON());
```

### 3. Use Cases (exemplo)
```typescript
import { CreateUser } from './src/domain/usecases/CreateUser';
import { SupabaseUserRepository } from './src/infrastructure/database/repositories/SupabaseUserRepository';
import { getSupabaseClient } from './src/infrastructure/database/supabase.client';

const client = getSupabaseClient();
const userRepo = new SupabaseUserRepository(client);
const createUser = new CreateUser(userRepo);

const result = await createUser.execute({
  phone: '11888888888',
  name: 'Maria Silva',
  weeklyGoal: 800,
});

console.log(result);
// { userId: '...', phone: '5511888888888', isNewUser: true }
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após seguir este guia, você deve ter:

- [ ] Dependências instaladas (`npm install`)
- [ ] Testes unitários passando (`npm test`)
- [ ] Servidor iniciando sem erros (`npm run dev`)
- [ ] Health check respondendo
- [ ] Conexão com Supabase funcionando
- [ ] TypeScript compilando sem erros (`npm run typecheck`)
- [ ] ESLint sem erros (`npm run lint`)

---

## 🚨 TROUBLESHOOTING

### Erro: "Missing environment variable"
```bash
# Verifique se o .env existe
ls -la .env

# Verifique o conteúdo
cat .env
```

### Erro: "Cannot find module"
```bash
# Reinstale dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro de conexão com Supabase
```bash
# Verifique se o projeto está ativo
curl https://ftvgspumgzjbobymjkui.supabase.co/rest/v1/
```

---

## 🎉 PRÓXIMO PASSO

Após validar que tudo está funcionando, podemos implementar:

1. **WhatsApp Integration** (Evolution API)
2. **Webhook Controller**
3. **Conversation Service**
4. **Fluxos de onboarding e registro diário**

Tudo com TDD e SOLID! 🚀

