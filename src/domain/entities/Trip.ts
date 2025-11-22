import { Money } from '../value-objects/Money';
import { Distance } from '../value-objects/Distance';

export interface TripProps {
  id: string;
  userId: string;
  date: Date;
  earnings: Money;
  km: Distance;
  timeOnlineMinutes: number;
  isPersonalUse: boolean;        // Para perfil híbrido
  note?: string;
  createdAt: Date;
}

/**
 * Trip Entity (Corrida/Dia de trabalho)
 * Representa os ganhos de um dia de trabalho
 * Princípio: Single Responsibility - apenas dados de corrida
 */
export class Trip {
  private constructor(private readonly props: TripProps) {
    this.validate();
  }

  public static create(data: {
    userId: string;
    date: Date;
    earnings: Money;
    km: Distance;
    timeOnlineMinutes: number;
    isPersonalUse?: boolean;
    note?: string;
  }): Trip {
    return new Trip({
      id: crypto.randomUUID(),
      userId: data.userId,
      date: data.date,
      earnings: data.earnings,
      km: data.km,
      timeOnlineMinutes: data.timeOnlineMinutes,
      isPersonalUse: data.isPersonalUse ?? false,
      note: data.note,
      createdAt: new Date(),
    });
  }

  public static restore(props: TripProps): Trip {
    return new Trip(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Trip ID is required');
    }

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.date) {
      throw new Error('Date is required');
    }

    if (!this.props.earnings) {
      throw new Error('Earnings is required');
    }

    if (!this.props.km) {
      throw new Error('Distance is required');
    }

    if (this.props.timeOnlineMinutes < 0) {
      throw new Error('Time online cannot be negative');
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get date(): Date {
    return this.props.date;
  }

  public get earnings(): Money {
    return this.props.earnings;
  }

  public get km(): Distance {
    return this.props.km;
  }

  public get timeOnlineMinutes(): number {
    return this.props.timeOnlineMinutes;
  }

  public get note(): string | undefined {
    return this.props.note;
  }

  public get isPersonalUse(): boolean {
    return this.props.isPersonalUse;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  // Métodos de cálculo
  public calculateEarningsPerHour(): Money | null {
    if (this.props.timeOnlineMinutes === 0) {
      return null;
    }
    const hours = this.props.timeOnlineMinutes / 60;
    return this.props.earnings.divide(hours);
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      date: this.props.date.toISOString().split('T')[0], // YYYY-MM-DD
      earnings: this.props.earnings.toJSON(),
      km: this.props.km.toJSON(),
      timeOnlineMinutes: this.props.timeOnlineMinutes,
      isPersonalUse: this.props.isPersonalUse,
      note: this.props.note,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}

