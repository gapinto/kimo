import { Expense, ExpenseType } from '../entities/Expense';

/**
 * Interface IExpenseRepository
 * Princípio: Dependency Inversion + Interface Segregation
 */
export interface IExpenseRepository {
  /**
   * Salva uma despesa
   */
  save(expense: Expense): Promise<void>;

  /**
   * Encontra despesa por ID
   */
  findById(id: string): Promise<Expense | null>;

  /**
   * Encontra todas as despesas de um usuário em uma data
   */
  findByUserAndDate(userId: string, date: Date): Promise<Expense[]>;

  /**
   * Encontra despesas de um usuário em um intervalo de datas
   */
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]>;

  /**
   * Encontra despesas por tipo
   */
  findByUserDateAndType(
    userId: string,
    date: Date,
    type: ExpenseType
  ): Promise<Expense[]>;

  /**
   * Calcula total de despesas de um usuário em uma data
   */
  getTotalExpensesByUserAndDate(userId: string, date: Date): Promise<number>;

  /**
   * Calcula total de despesas de combustível
   */
  getTotalFuelExpensesByUserAndDate(userId: string, date: Date): Promise<number>;
}

