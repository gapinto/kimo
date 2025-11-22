import { ITripRepository } from '../repositories/ITripRepository';
import { Trip } from '../entities/Trip';
import { Money } from '../value-objects/Money';
import { Distance } from '../value-objects/Distance';

export interface RegisterTripInput {
  userId: string;
  date: Date;
  earnings: number;
  km: number;
  timeOnlineMinutes: number;
  note?: string;
}

export interface RegisterTripOutput {
  tripId: string;
}

/**
 * Use Case: RegisterTrip
 * Princípio: Single Responsibility - apenas registra corrida
 * Princípio: Dependency Inversion - depende de interface, não implementação
 */
export class RegisterTrip {
  constructor(private readonly tripRepository: ITripRepository) {}

  async execute(input: RegisterTripInput): Promise<RegisterTripOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (!input.date) {
      throw new Error('Date is required');
    }

    if (input.earnings < 0) {
      throw new Error('Earnings cannot be negative');
    }

    if (input.km < 0) {
      throw new Error('Distance cannot be negative');
    }

    if (input.timeOnlineMinutes < 0) {
      throw new Error('Time online cannot be negative');
    }

    // Criar entidade
    const earnings = Money.create(input.earnings);
    const km = Distance.create(input.km);

    const trip = Trip.create({
      userId: input.userId,
      date: input.date,
      earnings,
      km,
      timeOnlineMinutes: input.timeOnlineMinutes,
      note: input.note,
    });

    // Persistir
    await this.tripRepository.save(trip);

    return {
      tripId: trip.id,
    };
  }
}

