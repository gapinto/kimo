# 🔥 REFATORAÇÃO COMPLETA - KIMO

## ✅ O QUE FOI REFATORADO

### 1. **ENUMS Novos** (`src/domain/enums/index.ts`)

```typescript
DriverProfile {
  OWN_PAID,        // Carro próprio quitado
  OWN_FINANCED,    // Carro próprio financiado
  RENTED,          // Carro alugado
  HYBRID           // Híbrido (pessoal + apps)
}

ExpenseType {
  FUEL, MAINTENANCE_PREVENTIVE, MAINTENANCE_CORRECTIVE,
  TIRES, CLEANING, TOLL, PARKING, APP_FEE, OTHER
}

FixedCostType {
  FINANCING, RENTAL, INSURANCE, TRACKER, IPVA,
  PHONE_PLAN, PERIODIC_WASH, DEPRECIATION, OTHER
}

CostFrequency {
  DAILY, WEEKLY, MONTHLY, YEARLY
}

SubscriptionPlan {
  FREE,           // Gratuito (limitado)
  PRO,            // R$ 14,90
  PROFESSIONAL    // R$ 29,90
}
```

---

### 2. **NOVAS ENTIDADES**

#### `FixedCost` (Custos Fixos)
- Aluguel, financiamento, seguro, rastreador, IPVA, etc
- Métodos: `toDailyAmount()`, `toWeeklyAmount()`, `toMonthlyAmount()`
- Conversão automática entre frequências

#### `DriverConfig` (Configuração do Motorista)
- Perfil do motorista
- Valor do carro (para depreciação)
- Consumo de combustível (km/litro)
- KM médio por dia
- Métodos inteligentes:
  - `calculateFuelCostPerKm()` - Custo de combustível por KM
  - `calculateMonthlyDepreciation()` - Depreciação mensal (18% ao ano)
  - `calculateWeeklyDepreciation()` - Depreciação semanal
  - `estimateWeeklyKm()`, `estimateMonthlyKm()`

---

### 3. **ENTIDADES ATUALIZADAS**

#### `User`
```typescript
+ profile: DriverProfile
+ subscriptionPlan: SubscriptionPlan
+ subscriptionExpiresAt: Date

// Novos métodos:
+ updateProfile()
+ upgradeToPro()
+ upgradeToProfessional()
+ downgradeToFree()
+ isSubscriptionActive()
+ hasProFeatures()
+ hasProfessionalFeatures()
```

#### `Trip`
```typescript
+ isPersonalUse: boolean  // Para perfil híbrido
```

#### `Expense`
```typescript
// Tipo expandido com 9 categorias detalhadas
```

---

### 4. **NOVOS USE CASES INTELIGENTES**

#### `CalculateBreakeven`
**"Quanto falta para fechar a semana no zero?"**

```typescript
Entrada:
- userId
- referenceDate

Saída:
- weeklyFixedCosts
- weeklyVariableCosts
- weeklyProfit
- remainingToBreakeven
- dailyTargetToBreakeven
- message: "Para fechar a semana no zero a zero, 
            você precisa rodar R$ 178 por dia daqui até domingo."
```

**Considera:**
- Perfil do motorista
- Custos fixos (aluguel, financiamento, etc)
- Depreciação (se carro próprio)
- Gastos variáveis da semana
- Dias restantes até domingo

---

#### `GetInsights`
**Gera insights inteligentes baseados no perfil**

```typescript
Insights gerados:
✅ "Hoje você economizou R$ 41 otimizando onde abastecer!"
✅ "Se você economizasse assim todo dia, guardaria R$ 820 no mês."
📉 "Essa semana sua depreciação estimada é de R$ 112."
💸 "Seu custo por KM hoje foi de R$ 0.42."
✅ "Hoje você cobriu o aluguel e lucrou R$ 85!"

Warnings:
⚠️ "Você gastou R$ 25 a mais do que o esperado com combustível hoje."
⚠️ "Você ainda não cobriu o aluguel de hoje (faltam R$ 45)."

Tips:
💡 "Dica: Procure postos mais baratos na região."
💡 "Se você rodasse assim todo dia, economizaria R$ 820 no mês."
```

---

### 5. **SCHEMA SQL ATUALIZADO**

#### Novas tabelas:
- `driver_configs` - Configurações do motorista
- `fixed_costs` - Custos fixos

#### Tabelas atualizadas:
- `users` - Adicionado `profile`, `subscription_plan`, `subscription_expires_at`
- `trips` - Adicionado `is_personal_use`
- `expenses` - Tipo expandido com 9 categorias

#### Novos índices:
- `idx_trips_user_date_personal`
- `idx_expenses_user_date_type`
- `idx_fixed_costs_user_active`
- `idx_driver_configs_user`

---

### 6. **NOVAS INTERFACES DE REPOSITÓRIO**

- `IDriverConfigRepository`
- `IFixedCostRepository`

---

## 🎯 CÁLCULOS IMPLEMENTADOS

### **Depreciação Automática**
- 18% ao ano do valor do carro
- Calculada automaticamente por semana/mês
- Inclusa nos custos fixos

### **Custo por KM**
- Baseado em consumo real do carro
- Compara esperado vs real
- Alerta quando está gastando mais

### **Breakeven Semanal**
- Considera TODOS os custos (fixos + variáveis)
- Calcula quanto falta diariamente
- Ajusta por perfil (alugado vs próprio)

### **Insights Contextuais**
- Economia de combustível
- ROI do aluguel
- Margem de lucro
- Ganho por hora
- Depreciação semanal

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ANTES ❌
```
- Apenas Expense genérico
- Sem perfis de motorista
- Sem custos fixos
- Sem depreciação
- Cálculos simples (lucro = ganho - gasto)
- Sem insights inteligentes
- Sem planos de assinatura
```

### DEPOIS ✅
```
✅ 9 tipos de despesas
✅ 4 perfis de motorista
✅ Custos fixos detalhados
✅ Depreciação calculada
✅ Cálculos por perfil
✅ Breakeven semanal
✅ Insights contextuais
✅ 3 planos de assinatura
✅ Suporte a uso híbrido
✅ Conversão automática de frequências
```

---

## 🔄 PRÓXIMOS PASSOS

### 1. **Atualizar Repositórios Supabase** 🔄
- Implementar `SupabaseDriverConfigRepository`
- Implementar `SupabaseFixedCostRepository`
- Atualizar repositórios existentes

### 2. **Criar Testes** 🔄
- Testes para FixedCost
- Testes para DriverConfig
- Testes para CalculateBreakeven
- Testes para GetInsights

### 3. **Atualizar Schema no Supabase** ⚠️
**IMPORTANTE**: Execute o SQL em `/tmp/kimo/docs/SCHEMA_REFATORADO.sql`

### 4. **Implementar Onboarding** 🔄
Flow de perguntas para descobrir perfil:
```
1. Você dirige com carro próprio ou alugado?
2. Quantos KM roda por dia em média?
3. Qual o consumo do carro (km/litro)?
4. Preço médio do combustível?
5. Valor do carro (para depreciação)?
6. Custos fixos (aluguel/financiamento)?
```

### 5. **WhatsApp + Voz** 🔄
- Integrar Evolution API
- Adicionar transcrição de áudio (Whisper)
- Processar comandos por voz

---

## 🎓 CONCEITOS APLICADOS

✅ **Clean Architecture** - Camadas bem separadas
✅ **SOLID** - Todos os princípios
✅ **Domain-Driven Design** - Entidades ricas
✅ **Value Objects** - Money, Distance, Phone
✅ **Strategy Pattern** - Cálculos por perfil
✅ **Factory Pattern** - Criação de entidades
✅ **Repository Pattern** - Abstração de persistência

---

## 📈 IMPACTO NO PRODUTO

### Para o Motorista:
✅ **Visibilidade real** do lucro
✅ **Breakeven claro** toda semana
✅ **Insights acionáveis** diariamente
✅ **Economia comprovada** com combustível
✅ **Depreciação visível** (carro próprio)
✅ **ROI claro** (carro alugado)

### Para o Negócio:
✅ **3 planos de assinatura** claros
✅ **Valor demonstrável** desde dia 1
✅ **Retenção alta** (dependência do insight)
✅ **Upsell natural** (free → pro → professional)

---

## 🚀 STATUS ATUAL

```
✅ Domain Layer: 100% refatorado
✅ Enums: Criados
✅ Entities: Atualizadas e novas
✅ Use Cases: 2 novos inteligentes
✅ Repositories: Interfaces prontas
🔄 Infrastructure: Precisa atualizar
🔄 Tests: Criar para novas entidades
⚠️ SQL: Executar schema refatorado
```

---

**Próxima ação**: Atualizar repositórios Supabase e criar testes! 🎯

