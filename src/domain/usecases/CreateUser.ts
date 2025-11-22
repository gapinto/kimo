import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';
import { Phone } from '../value-objects/Phone';

export interface CreateUserInput {
  phone: string;
  name?: string;
  weeklyGoal?: number;
}

export interface CreateUserOutput {
  userId: string;
  phone: string;
  isNewUser: boolean;
}

/**
 * Use Case: CreateUser
 * Princípio: Single Responsibility - apenas cria/busca usuário
 * Princípio: Open/Closed - pode ser estendido sem modificação
 */
export class CreateUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // Validações
    if (!input.phone) {
      throw new Error('Phone is required');
    }

    // Criar phone value object
    const phone = Phone.create(input.phone);

    // Verificar se usuário já existe
    const existingUser = await this.userRepository.findByPhone(phone);

    if (existingUser) {
      return {
        userId: existingUser.id,
        phone: existingUser.phone.value,
        isNewUser: false,
      };
    }

    // Criar novo usuário
    const user = User.create({
      phone,
      name: input.name,
      weeklyGoal: input.weeklyGoal,
    });

    // Persistir
    await this.userRepository.save(user);

    return {
      userId: user.id,
      phone: user.phone.value,
      isNewUser: true,
    };
  }
}

