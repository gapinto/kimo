import { DailySummary } from '../entities/DailySummary';

/**
 * Interface IDailySummaryRepository
 * Princípio: Dependency Inversion + Interface Segregation
 */
export interface IDailySummaryRepository {
  /**
   * Salva ou atualiza um resumo diário (upsert)
   */
  upsert(summary: DailySummary): Promise<void>;

  /**
   * Encontra resumo por ID
   */
  findById(id: string): Promise<DailySummary | null>;

  /**
   * Encontra resumo de um usuário em uma data específica
   */
  findByUserAndDate(userId: string, date: Date): Promise<DailySummary | null>;

  /**
   * Encontra resumos de um usuário em um intervalo de datas
   */
  findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailySummary[]>;

  /**
   * Calcula lucro total de um período
   */
  getTotalProfitByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number>;

  /**
   * Verifica se existe resumo para usuário e data
   */
  existsByUserAndDate(userId: string, date: Date): Promise<boolean>;
}

