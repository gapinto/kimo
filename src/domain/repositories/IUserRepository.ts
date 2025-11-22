import { User } from '../entities/User';
import { Phone } from '../value-objects/Phone';

/**
 * Interface IUserRepository
 * Princípio: Dependency Inversion - Use cases dependem desta interface,
 * não de implementações concretas
 */
export interface IUserRepository {
  /**
   * Encontra usuário por telefone
   */
  findByPhone(phone: Phone): Promise<User | null>;

  /**
   * Encontra usuário por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Salva um novo usuário
   */
  save(user: User): Promise<void>;

  /**
   * Atualiza um usuário existente
   */
  update(user: User): Promise<void>;

  /**
   * Verifica se usuário existe por telefone
   */
  existsByPhone(phone: Phone): Promise<boolean>;
}

