import { IExpenseRepository } from '../repositories/IExpenseRepository';
import { Expense, ExpenseType } from '../entities/Expense';
import { Money } from '../value-objects/Money';

export interface RegisterExpenseInput {
  userId: string;
  date: Date;
  type: ExpenseType;
  amount: number;
  note?: string;
}

export interface RegisterExpenseOutput {
  expenseId: string;
}

/**
 * Use Case: RegisterExpense
 * Princípio: Single Responsibility - apenas registra despesa
 * Princípio: Dependency Inversion - depende de interface
 */
export class RegisterExpense {
  constructor(private readonly expenseRepository: IExpenseRepository) {}

  async execute(input: RegisterExpenseInput): Promise<RegisterExpenseOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (!input.date) {
      throw new Error('Date is required');
    }

    if (input.amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (!input.type) {
      throw new Error('Expense type is required');
    }

    // Criar entidade
    const amount = Money.create(input.amount);

    const expense = Expense.create({
      userId: input.userId,
      date: input.date,
      type: input.type,
      amount,
      note: input.note,
    });

    // Persistir
    await this.expenseRepository.save(expense);

    return {
      expenseId: expense.id,
    };
  }
}

