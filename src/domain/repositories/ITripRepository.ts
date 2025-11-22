import { Trip } from '../entities/Trip';

/**
 * Interface ITripRepository
 * Princípio: Dependency Inversion + Interface Segregation
 */
export interface ITripRepository {
  /**
   * Salva uma corrida
   */
  save(trip: Trip): Promise<void>;

  /**
   * Encontra corrida por ID
   */
  findById(id: string): Promise<Trip | null>;

  /**
   * Encontra todas as corridas de um usuário em uma data
   */
  findByUserAndDate(userId: string, date: Date): Promise<Trip[]>;

  /**
   * Encontra corridas de um usuário em um intervalo de datas
   */
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Trip[]>;

  /**
   * Calcula total de ganhos de um usuário em uma data
   */
  getTotalEarningsByUserAndDate(userId: string, date: Date): Promise<number>;

  /**
   * Calcula total de km de um usuário em uma data
   */
  getTotalKmByUserAndDate(userId: string, date: Date): Promise<number>;
}

