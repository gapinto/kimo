/**
 * Enum: DriverProfile
 * Tipos de perfil de motorista
 */
export enum DriverProfile {
  OWN_PAID = 'own_paid',         // Carro próprio quitado
  OWN_FINANCED = 'own_financed', // Carro próprio financiado
  RENTED = 'rented',             // Carro alugado (Localiza, Movida, Kovi)
  HYBRID = 'hybrid',             // Híbrido (uso pessoal + apps)
}

/**
 * Enum: ExpenseType (expandido)
 * Tipos detalhados de despesas variáveis
 */
export enum ExpenseType {
  FUEL = 'fuel',                           // Combustível
  MAINTENANCE_PREVENTIVE = 'maintenance_preventive', // Manutenção preventiva
  MAINTENANCE_CORRECTIVE = 'maintenance_corrective', // Manutenção corretiva
  TIRES = 'tires',                        // Pneus
  CLEANING = 'cleaning',                  // Limpeza/lavagem
  TOLL = 'toll',                          // Pedágio
  PARKING = 'parking',                    // Estacionamento
  APP_FEE = 'app_fee',                    // Taxa do app (se cobrar separado)
  OTHER = 'other',                        // Outros
}

/**
 * Enum: FixedCostType
 * Tipos de custos fixos
 */
export enum FixedCostType {
  FINANCING = 'financing',           // Financiamento do carro
  RENTAL = 'rental',                 // Aluguel do carro
  INSURANCE = 'insurance',           // Seguro
  TRACKER = 'tracker',               // Rastreador
  IPVA = 'ipva',                     // IPVA (anual)
  PHONE_PLAN = 'phone_plan',         // Plano de celular
  PERIODIC_WASH = 'periodic_wash',   // Lavagens periódicas
  DEPRECIATION = 'depreciation',     // Depreciação calculada
  OTHER = 'other',                   // Outros custos fixos
}

/**
 * Enum: CostFrequency
 * Frequência de pagamento de custos fixos
 */
export enum CostFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Enum: SubscriptionPlan
 * Planos de assinatura do app
 */
export enum SubscriptionPlan {
  FREE = 'free',           // Gratuito (limitado)
  PRO = 'pro',             // R$ 14,90 - Ilimitado
  PROFESSIONAL = 'professional', // R$ 29,90 - Recursos avançados
}

