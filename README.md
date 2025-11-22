# 🚗💰 KIMO - Assistente Financeiro para Motoristas Uber

> Controle financeiro inteligente via WhatsApp para motoristas de aplicativo

## 🎯 O que é o KIMO?

KIMO é um assistente financeiro completo para motoristas de Uber e apps similares. Via WhatsApp, você registra seus ganhos e despesas diariamente e recebe análises inteligentes sobre seu desempenho financeiro.

### ✨ Principais Funcionalidades

- 📱 **Interface via WhatsApp** - Conversa natural, sem apps complexos
- 💼 **Perfis Personalizados** - Carro próprio (quitado/financiado), alugado ou híbrido
- 📊 **Dashboard Inteligente** - Lucro real, custo por KM, breakeven
- 🎯 **Metas Semanais** - Acompanhamento de progresso e alertas
- 💡 **Insights Automáticos** - Análises e dicas personalizadas
- 🔒 **Seguro e Privado** - Seus dados são 100% seus

## 🚀 Deploy Rápido em Produção

### **📖 Guia Completo:**

Siga o guia detalhado: **[DEPLOY_PRODUCAO.md](./DEPLOY_PRODUCAO.md)**

### **Resumo:**

1. **Deploy Evolution API** (WhatsApp) no Railway
2. **Deploy KIMO API** no Railway
3. **Conectar WhatsApp** (QR Code)
4. **Configurar Webhook**
5. **Testar via WhatsApp** ✅

**Tempo total:** ~20 minutos  
**Custo:** GRÁTIS (Railway free tier)

## 🛠️ Stack Tecnológica

- **Backend:** Node.js + TypeScript + Express
- **Database:** Supabase (PostgreSQL)
- **Messaging:** Evolution API (WhatsApp Business)
- **Architecture:** Clean Architecture + SOLID
- **Testing:** Jest + TDD
- **Deploy:** Railway

## 📂 Estrutura do Projeto

```
kimo/
├── src/
│   ├── domain/              # Camada de domínio (entidades, regras)
│   │   ├── entities/        # User, Trip, Expense, DailySummary
│   │   ├── value-objects/   # Money, Distance, Phone
│   │   ├── repositories/    # Interfaces dos repositórios
│   │   ├── usecases/        # Casos de uso (lógica de negócio)
│   │   └── enums/           # Enumerações
│   ├── application/         # Camada de aplicação
│   │   ├── controllers/     # Controllers HTTP
│   │   ├── services/        # Serviços (ConversationService)
│   │   └── dtos/            # Data Transfer Objects
│   ├── infrastructure/      # Camada de infraestrutura
│   │   ├── database/        # Implementações Supabase
│   │   ├── messaging/       # Provedores de mensagem (Evolution API)
│   │   └── http/            # Servidor Express, rotas
│   ├── shared/              # Utilitários compartilhados
│   │   ├── errors/          # Tratamento de erros
│   │   └── utils/           # Helpers (logger, env)
│   └── index.ts             # Entry point
├── tests/
│   └── unit/                # Testes unitários (TDD)
├── docs/                    # Documentação técnica
└── package.json
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Cobertura
npm run test:coverage

# Apenas testes unitários
npm run test:unit
```

### **Padrão Given-When-Then**

Todos os testes seguem o padrão BDD:

```typescript
it('should calculate correct profit', () => {
  // Given: Estado inicial
  const earnings = Money.create(280);
  const expenses = Money.create(70);
  
  // When: Ação
  const profit = earnings.subtract(expenses);
  
  // Then: Resultado esperado
  expect(profit.getValue()).toBe(210);
});
```

## 📊 Fluxos do WhatsApp

### **1. Onboarding (Primeira vez)**
```
Usuário: Oi
Bot: [Pergunta perfil do motorista]
Usuário: [Responde perguntas]
Bot: 🎉 Perfil configurado!
```

### **2. Registro Diário**
```
Usuário: 1
Bot: [Pergunta ganhos, KM, despesas]
Usuário: [Informa dados]
Bot: ✅ Dia registrado! [Mostra insights]
```

### **3. Resumo do Dia**
```
Usuário: 2 (ou "resumo")
Bot: [Mostra lucro, custos, insights]
```

### **4. Meta Semanal**
```
Usuário: 3 (ou "meta")
Bot: [Mostra breakeven, progresso, quanto falta]
```

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Node
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=sua_url
SUPABASE_SERVICE_KEY=sua_service_key
SUPABASE_ANON_KEY=sua_anon_key

# WhatsApp (Evolution API)
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=sua_url_evolution
EVOLUTION_API_KEY=sua_chave
EVOLUTION_INSTANCE_NAME=kimo
```

## 📖 Documentação

- [🚀 Deploy em Produção](./DEPLOY_PRODUCAO.md) - **COMECE AQUI**
- [📱 Configuração WhatsApp Completa](./CONFIGURACAO_WHATSAPP_COMPLETA.md)
- [🎯 Como Executar Localmente](./COMO_EXECUTAR.md)
- [🏗️ Guia Supabase](./docs/GUIA_SUPABASE.md)
- [🔄 Migração do Banco](./docs/MIGRATION.sql)
- [📝 Implementação Completa](./IMPLEMENTACAO_COMPLETA.md)
- [🧪 Testes Given-When-Then](./docs/TESTES_GIVEN_WHEN_THEN.md)

## 🎤 Próximos Passos

- [ ] **Áudio/Voz** - Transcrição com OpenAI Whisper
- [ ] **Jobs Automáticos** - Resumos diários por cron
- [ ] **Cache Redis** - Performance
- [ ] **Dashboard Web** - Visualização avançada
- [ ] **Analytics** - Métricas agregadas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### **Padrões de Código**

- ✅ Clean Architecture
- ✅ SOLID Principles
- ✅ TDD (escreva testes primeiro)
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ Commits semânticos

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 💪 Autor

Desenvolvido com ❤️ para motoristas de aplicativo.

---

## 🆘 Precisa de Ajuda?

1. Veja a [Documentação Completa](./DEPLOY_PRODUCAO.md)
2. Verifique o [Troubleshooting](./DEPLOY_PRODUCAO.md#-troubleshooting)
3. Abra uma [Issue](https://github.com/SEU_USUARIO/kimo/issues)

---

**🚀 Deploy em 20 minutos → [DEPLOY_PRODUCAO.md](./DEPLOY_PRODUCAO.md)**
