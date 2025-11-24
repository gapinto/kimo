/**
 * Enum: ConversationState
 * Estados possíveis da conversa
 */
export enum ConversationState {
  IDLE = 'idle',
  ONBOARDING_NAME = 'onboarding_name',
  ONBOARDING_BIRTH_DATE = 'onboarding_birth_date',
  ONBOARDING_PROFILE = 'onboarding_profile',
  ONBOARDING_FUEL_CONSUMPTION = 'onboarding_fuel_consumption',
  ONBOARDING_FUEL_PRICE = 'onboarding_fuel_price',
  ONBOARDING_AVG_KM = 'onboarding_avg_km',
  ONBOARDING_RENTAL = 'onboarding_rental',
  ONBOARDING_CAR_VALUE = 'onboarding_car_value',
  ONBOARDING_FINANCING_BALANCE = 'onboarding_financing_balance',
  ONBOARDING_FINANCING_PAYMENT = 'onboarding_financing_payment',
  ONBOARDING_FINANCING_MONTHS = 'onboarding_financing_months',
  REGISTER_EARNINGS = 'register_earnings',
  REGISTER_KM = 'register_km',
  REGISTER_FUEL = 'register_fuel',
  REGISTER_OTHER_EXPENSES = 'register_other_expenses',
  REGISTER_CONFIRM = 'register_confirm',
  EXPENSE_TYPE = 'expense_type',
  EXPENSE_AMOUNT = 'expense_amount',
  EXPENSE_DESCRIPTION = 'expense_description',
}

/**
 * Dados da sessão de conversa
 */
export interface ConversationSession {
  userId?: string;
  phone: string;
  state: ConversationState;
  data: Record<string, unknown>;
  lastInteraction: Date;
}

