import { Money } from '../value-objects/Money';

export enum PendingTripStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PendingTripProps {
  id: string;
  userId: string;
  earnings: Money;
  km: number;
  fuel?: Money;
  estimatedDuration: number; // minutos
  status: PendingTripStatus;
  evaluatedAt: Date; // quando avaliou (v 45 12)
  completedAt?: Date; // quando registrou de fato
  reminderSentAt?: Date; // quando enviou lembrete
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PendingTrip Entity
 * Representa uma corrida que foi avaliada mas ainda não foi registrada
 * Permite fluxo: avaliar → fazer corrida → registrar facilmente
 */
export class PendingTrip {
  private constructor(private props: PendingTripProps) {
    this.validate();
  }

  public static create(data: {
    userId: string;
    earnings: Money;
    km: number;
    fuel?: Money;
    estimatedDuration: number;
  }): PendingTrip {
    return new PendingTrip({
      id: crypto.randomUUID(),
      userId: data.userId,
      earnings: data.earnings,
      km: data.km,
      fuel: data.fuel,
      estimatedDuration: data.estimatedDuration,
      status: PendingTripStatus.PENDING,
      evaluatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static restore(props: PendingTripProps): PendingTrip {
    return new PendingTrip(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('PendingTrip ID is required');
    }

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (this.props.earnings.value <= 0) {
      throw new Error('Earnings must be positive');
    }

    if (this.props.km <= 0) {
      throw new Error('KM must be positive');
    }

    if (this.props.estimatedDuration < 0) {
      throw new Error('Estimated duration cannot be negative');
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get earnings(): Money {
    return this.props.earnings;
  }

  public get km(): number {
    return this.props.km;
  }

  public get fuel(): Money | undefined {
    return this.props.fuel;
  }

  public get estimatedDuration(): number {
    return this.props.estimatedDuration;
  }

  public get status(): PendingTripStatus {
    return this.props.status;
  }

  public get evaluatedAt(): Date {
    return this.props.evaluatedAt;
  }

  public get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  public get reminderSentAt(): Date | undefined {
    return this.props.reminderSentAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  public markInProgress(): void {
    this.props.status = PendingTripStatus.IN_PROGRESS;
    this.props.updatedAt = new Date();
  }

  public complete(): void {
    this.props.status = PendingTripStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    this.props.status = PendingTripStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public markReminderSent(): void {
    this.props.reminderSentAt = new Date();
    this.props.updatedAt = new Date();
  }

  public updateFuel(fuel: Money): void {
    this.props.fuel = fuel;
    this.props.updatedAt = new Date();
  }

  public isExpired(maxAgeMinutes: number = 120): boolean {
    const now = new Date();
    const ageMinutes = (now.getTime() - this.props.evaluatedAt.getTime()) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }

  public shouldSendReminder(): boolean {
    // Envia lembrete se:
    // 1. Status é pending ou in_progress
    // 2. Ainda não enviou lembrete
    // 3. Passou o tempo estimado
    if (this.props.status !== PendingTripStatus.PENDING && 
        this.props.status !== PendingTripStatus.IN_PROGRESS) {
      return false;
    }

    if (this.props.reminderSentAt) {
      return false;
    }

    const now = new Date();
    const elapsedMinutes = (now.getTime() - this.props.evaluatedAt.getTime()) / (1000 * 60);
    return elapsedMinutes >= this.props.estimatedDuration;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      earnings: this.props.earnings.toJSON(),
      km: this.props.km,
      fuel: this.props.fuel?.toJSON(),
      estimatedDuration: this.props.estimatedDuration,
      status: this.props.status,
      evaluatedAt: this.props.evaluatedAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      reminderSentAt: this.props.reminderSentAt?.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

