import { DriverConfig } from '../entities/DriverConfig';

/**
 * Interface IDriverConfigRepository
 * Operações com configurações do motorista
 */
export interface IDriverConfigRepository {
  /**
   * Salva uma configuração
   */
  save(config: DriverConfig): Promise<void>;

  /**
   * Encontra configuração por ID
   */
  findById(id: string): Promise<DriverConfig | null>;

  /**
   * Encontra configuração por user ID
   */
  findByUserId(userId: string): Promise<DriverConfig | null>;

  /**
   * Atualiza uma configuração
   */
  update(config: DriverConfig): Promise<void>;

  /**
   * Verifica se usuário tem configuração
   */
  existsByUserId(userId: string): Promise<boolean>;
}

