import { Money } from '../value-objects/Money';
import { Distance } from '../value-objects/Distance';

export interface DailySummaryProps {
  id: string;
  userId: string;
  date: Date;
  earnings: Money;
  expenses: Money;
  km: Distance;
  profit: Money;
  costPerKm: Money | null;
  createdAt: Date;
}

/**
 * DailySummary Entity (Resumo Diário)
 * Agrega dados de corridas e despesas do dia
 * Princípio: Single Responsibility
 */
export class DailySummary {
  private constructor(private readonly props: DailySummaryProps) {
    this.validate();
  }

  public static create(data: {
    userId: string;
    date: Date;
    earnings: Money;
    expenses: Money;
    km: Distance;
  }): DailySummary {
    const profit = data.earnings.subtract(data.expenses);
    const costPerKm = data.km.value > 0 ? data.expenses.divide(data.km.value) : null;

    return new DailySummary({
      id: crypto.randomUUID(),
      userId: data.userId,
      date: data.date,
      earnings: data.earnings,
      expenses: data.expenses,
      km: data.km,
      profit,
      costPerKm,
      createdAt: new Date(),
    });
  }

  public static restore(props: DailySummaryProps): DailySummary {
    return new DailySummary(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('DailySummary ID is required');
    }

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.date) {
      throw new Error('Date is required');
    }

    if (!this.props.earnings) {
      throw new Error('Earnings is required');
    }

    if (!this.props.expenses) {
      throw new Error('Expenses is required');
    }

    if (!this.props.km) {
      throw new Error('Distance is required');
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get date(): Date {
    return this.props.date;
  }

  public get earnings(): Money {
    return this.props.earnings;
  }

  public get expenses(): Money {
    return this.props.expenses;
  }

  public get km(): Distance {
    return this.props.km;
  }

  public get profit(): Money {
    return this.props.profit;
  }

  public get costPerKm(): Money | null {
    return this.props.costPerKm;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  // Métodos de negócio
  public isProfitable(): boolean {
    return this.props.profit.value > 0;
  }

  public hasWorked(): boolean {
    return this.props.km.value > 0 || this.props.earnings.value > 0;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      date: this.props.date.toISOString().split('T')[0],
      earnings: this.props.earnings.toJSON(),
      expenses: this.props.expenses.toJSON(),
      km: this.props.km.toJSON(),
      profit: this.props.profit.toJSON(),
      costPerKm: this.props.costPerKm?.toJSON() ?? null,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}

