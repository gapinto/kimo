import { Money } from '../value-objects/Money';
import { ExpenseType } from '../enums';

// Re-export ExpenseType for backwards compatibility
export { ExpenseType };

export interface ExpenseProps {
  id: string;
  userId: string;
  date: Date;
  type: ExpenseType;
  amount: Money;
  note?: string;
  createdAt: Date;
}

/**
 * Expense Entity (Despesa)
 * Representa uma despesa do motorista
 * Princípio: Single Responsibility
 */
export class Expense {
  private constructor(private readonly props: ExpenseProps) {
    this.validate();
  }

  public static create(data: {
    userId: string;
    date: Date;
    type: ExpenseType;
    amount: Money;
    note?: string;
  }): Expense {
    return new Expense({
      id: crypto.randomUUID(),
      userId: data.userId,
      date: data.date,
      type: data.type,
      amount: data.amount,
      note: data.note,
      createdAt: new Date(),
    });
  }

  public static restore(props: ExpenseProps): Expense {
    return new Expense(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Expense ID is required');
    }

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.date) {
      throw new Error('Date is required');
    }

    if (!this.props.type) {
      throw new Error('Expense type is required');
    }

    if (!this.props.amount) {
      throw new Error('Amount is required');
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

  public get type(): ExpenseType {
    return this.props.type;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get note(): string | undefined {
    return this.props.note;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public isFuelExpense(): boolean {
    return this.props.type === ExpenseType.FUEL;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      date: this.props.date.toISOString().split('T')[0], // YYYY-MM-DD
      type: this.props.type,
      amount: this.props.amount.toJSON(),
      note: this.props.note,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}

