import { FixedCost } from '../entities/FixedCost';

/**
 * Interface IFixedCostRepository
 * Operações com custos fixos
 */
export interface IFixedCostRepository {
  /**
   * Salva um custo fixo
   */
  save(fixedCost: FixedCost): Promise<void>;

  /**
   * Encontra custo fixo por ID
   */
  findById(id: string): Promise<FixedCost | null>;

  /**
   * Encontra todos os custos fixos ativos de um usuário
   */
  findActiveByUserId(userId: string): Promise<FixedCost[]>;

  /**
   * Encontra todos os custos fixos de um usuário (ativos e inativos)
   */
  findAllByUserId(userId: string): Promise<FixedCost[]>;

  /**
   * Atualiza um custo fixo
   */
  update(fixedCost: FixedCost): Promise<void>;

  /**
   * Calcula total de custos fixos mensais
   */
  getTotalMonthlyFixedCosts(userId: string): Promise<number>;

  /**
   * Calcula total de custos fixos semanais
   */
  getTotalWeeklyFixedCosts(userId: string): Promise<number>;

  /**
   * Calcula total de custos fixos diários
   */
  getTotalDailyFixedCosts(userId: string): Promise<number>;
}

