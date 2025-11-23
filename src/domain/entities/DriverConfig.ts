import { Money } from '../value-objects/Money';
import { DriverProfile } from '../enums';

export interface DriverConfigProps {
  id: string;
  userId: string;
  profile: DriverProfile;
  carValue?: Money;              // Valor do carro (para depreciação)
  fuelConsumption: number;       // km por litro
  avgFuelPrice: Money;           // Preço médio do combustível
  avgKmPerDay: number;           // KM médio por dia
  workDaysPerWeek: number;       // Dias trabalhados por semana
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DriverConfig Entity
 * Configurações específicas do motorista para cálculos precisos
 * Princípio: Single Responsibility
 */
export class DriverConfig {
  private constructor(private props: DriverConfigProps) {
    this.validate();
  }

  public static create(data: {
    userId: string;
    profile: DriverProfile;
    carValue?: Money;
    fuelConsumption: number;
    avgFuelPrice: Money;
    avgKmPerDay: number;
    workDaysPerWeek?: number;
  }): DriverConfig {
    return new DriverConfig({
      id: crypto.randomUUID(),
      userId: data.userId,
      profile: data.profile,
      carValue: data.carValue,
      fuelConsumption: data.fuelConsumption,
      avgFuelPrice: data.avgFuelPrice,
      avgKmPerDay: data.avgKmPerDay,
      workDaysPerWeek: data.workDaysPerWeek ?? 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static restore(props: DriverConfigProps): DriverConfig {
    return new DriverConfig(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('DriverConfig ID is required');
    }

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.profile) {
      throw new Error('Driver profile is required');
    }

    if (this.props.fuelConsumption <= 0) {
      throw new Error('Fuel consumption must be positive');
    }

    if (this.props.avgKmPerDay < 0) {
      throw new Error('Average km per day cannot be negative');
    }

    if (this.props.workDaysPerWeek < 1 || this.props.workDaysPerWeek > 7) {
      throw new Error('Work days per week must be between 1 and 7');
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get profile(): DriverProfile {
    return this.props.profile;
  }

  public get carValue(): Money | undefined {
    return this.props.carValue;
  }

  public get fuelConsumption(): number {
    return this.props.fuelConsumption;
  }

  public get avgFuelPrice(): Money {
    return this.props.avgFuelPrice;
  }

  public get avgKmPerDay(): number {
    return this.props.avgKmPerDay;
  }

  public get workDaysPerWeek(): number {
    return this.props.workDaysPerWeek;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  public updateProfile(profile: DriverProfile): void {
    this.props.profile = profile;
    this.props.updatedAt = new Date();
  }

  public updateCarValue(value: Money): void {
    this.props.carValue = value;
    this.props.updatedAt = new Date();
  }

  public updateFuelConsumption(kmPerLiter: number): void {
    if (kmPerLiter <= 0) {
      throw new Error('Fuel consumption must be positive');
    }
    this.props.fuelConsumption = kmPerLiter;
    this.props.updatedAt = new Date();
  }

  public updateFuelPrice(pricePerLiter: number): void {
    if (pricePerLiter <= 0) {
      throw new Error('Fuel price must be positive');
    }
    this.props.avgFuelPrice = Money.create(pricePerLiter);
    this.props.updatedAt = new Date();
  }

  /**
   * Calcula custo de combustível por KM
   */
  public calculateFuelCostPerKm(): Money {
    // Custo/km = Preço do combustível / Consumo (km/litro)
    return this.props.avgFuelPrice.divide(this.props.fuelConsumption);
  }

  /**
   * Calcula depreciação mensal estimada
   * Baseado em: 15-20% do valor do carro por ano
   * Ajustado por KM rodado
   */
  public calculateMonthlyDepreciation(): Money | null {
    if (!this.props.carValue) {
      return null;
    }

    // Depreciação anual típica: 18%
    const annualDepreciationRate = 0.18;
    const annualDepreciation = this.props.carValue.multiply(annualDepreciationRate);
    const monthlyDepreciation = annualDepreciation.divide(12);

    return monthlyDepreciation;
  }

  /**
   * Calcula depreciação semanal
   */
  public calculateWeeklyDepreciation(): Money | null {
    const monthly = this.calculateMonthlyDepreciation();
    if (!monthly) return null;

    return monthly.divide(4.33); // ~4.33 semanas/mês
  }

  /**
   * Estima KM total por semana
   */
  public estimateWeeklyKm(): number {
    return this.props.avgKmPerDay * this.props.workDaysPerWeek;
  }

  /**
   * Estima KM total por mês
   */
  public estimateMonthlyKm(): number {
    return this.props.avgKmPerDay * this.props.workDaysPerWeek * 4.33;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      profile: this.props.profile,
      carValue: this.props.carValue?.toJSON(),
      fuelConsumption: this.props.fuelConsumption,
      avgFuelPrice: this.props.avgFuelPrice.toJSON(),
      avgKmPerDay: this.props.avgKmPerDay,
      workDaysPerWeek: this.props.workDaysPerWeek,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

