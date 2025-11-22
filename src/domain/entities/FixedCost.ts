import { Money } from '../value-objects/Money';
import { FixedCostType, CostFrequency } from '../enums';

export interface FixedCostProps {
  id: string;
  userId: string;
  type: FixedCostType;
  amount: Money;
  frequency: CostFrequency;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * FixedCost Entity (Custo Fixo)
 * Representa custos fixos do motorista (aluguel, financiamento, seguro, etc)
 * Princípio: Single Responsibility
 */
export class FixedCost {
  private constructor(private props: FixedCostProps) {
    this.validate();
  }

  public static create(data: {
    userId: string;
    type: FixedCostType;
    amount: Money;
    frequency: CostFrequency;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }): FixedCost {
    return new FixedCost({
      id: crypto.randomUUID(),
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      frequency: data.frequency,
      description: data.description,
      startDate: data.startDate ?? new Date(),
      endDate: data.endDate,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static restore(props: FixedCostProps): FixedCost {
    return new FixedCost(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('FixedCost ID is required');
    }

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.type) {
      throw new Error('Cost type is required');
    }

    if (!this.props.amount) {
      throw new Error('Amount is required');
    }

    if (!this.props.frequency) {
      throw new Error('Frequency is required');
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get type(): FixedCostType {
    return this.props.type;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get frequency(): CostFrequency {
    return this.props.frequency;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get startDate(): Date {
    return this.props.startDate;
  }

  public get endDate(): Date | undefined {
    return this.props.endDate;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  public deactivate(): void {
    this.props.isActive = false;
    this.props.endDate = new Date();
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.endDate = undefined;
    this.props.updatedAt = new Date();
  }

  public updateAmount(newAmount: Money): void {
    this.props.amount = newAmount;
    this.props.updatedAt = new Date();
  }

  /**
   * Converte o custo para valor diário
   * Útil para cálculos de breakeven
   */
  public toDailyAmount(): Money {
    switch (this.props.frequency) {
      case CostFrequency.DAILY:
        return this.props.amount;
      case CostFrequency.WEEKLY:
        return this.props.amount.divide(7);
      case CostFrequency.MONTHLY:
        return this.props.amount.divide(30);
      case CostFrequency.YEARLY:
        return this.props.amount.divide(365);
      default:
        throw new Error(`Unknown frequency: ${this.props.frequency}`);
    }
  }

  /**
   * Converte o custo para valor semanal
   */
  public toWeeklyAmount(): Money {
    switch (this.props.frequency) {
      case CostFrequency.DAILY:
        return this.props.amount.multiply(7);
      case CostFrequency.WEEKLY:
        return this.props.amount;
      case CostFrequency.MONTHLY:
        return this.props.amount.divide(4.33); // ~4.33 semanas/mês
      case CostFrequency.YEARLY:
        return this.props.amount.divide(52);
      default:
        throw new Error(`Unknown frequency: ${this.props.frequency}`);
    }
  }

  /**
   * Converte o custo para valor mensal
   */
  public toMonthlyAmount(): Money {
    switch (this.props.frequency) {
      case CostFrequency.DAILY:
        return this.props.amount.multiply(30);
      case CostFrequency.WEEKLY:
        return this.props.amount.multiply(4.33);
      case CostFrequency.MONTHLY:
        return this.props.amount;
      case CostFrequency.YEARLY:
        return this.props.amount.divide(12);
      default:
        throw new Error(`Unknown frequency: ${this.props.frequency}`);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      type: this.props.type,
      amount: this.props.amount.toJSON(),
      frequency: this.props.frequency,
      description: this.props.description,
      startDate: this.props.startDate.toISOString(),
      endDate: this.props.endDate?.toISOString(),
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

