import { Phone } from '../value-objects/Phone';
import { DriverProfile, SubscriptionPlan } from '../enums';

export interface UserProps {
  id: string;
  phone: Phone;
  name?: string;
  weeklyGoal?: number;
  profile?: DriverProfile;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Entity (Motorista)
 * Representa um motorista no sistema
 * Princípio: Single Responsibility - apenas dados e validações do usuário
 */
export class User {
  private constructor(private readonly props: UserProps) {
    this.validate();
  }

  public static create(data: {
    phone: Phone;
    name?: string;
    weeklyGoal?: number;
    profile?: DriverProfile;
  }): User {
    return new User({
      id: crypto.randomUUID(),
      phone: data.phone,
      name: data.name,
      weeklyGoal: data.weeklyGoal,
      profile: data.profile,
      subscriptionPlan: SubscriptionPlan.FREE,
      subscriptionExpiresAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static restore(props: UserProps): User {
    return new User(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('User ID is required');
    }

    if (!this.props.phone) {
      throw new Error('User phone is required');
    }

    if (this.props.weeklyGoal !== undefined && this.props.weeklyGoal < 0) {
      throw new Error('Weekly goal cannot be negative');
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get phone(): Phone {
    return this.props.phone;
  }

  public get name(): string | undefined {
    return this.props.name;
  }

  public get weeklyGoal(): number | undefined {
    return this.props.weeklyGoal;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get profile(): DriverProfile | undefined {
    return this.props.profile;
  }

  public get subscriptionPlan(): SubscriptionPlan {
    return this.props.subscriptionPlan;
  }

  public get subscriptionExpiresAt(): Date | undefined {
    return this.props.subscriptionExpiresAt;
  }

  // Methods
  public updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  public updateWeeklyGoal(goal: number): void {
    if (goal < 0) {
      throw new Error('Weekly goal cannot be negative');
    }
    this.props.weeklyGoal = goal;
    this.props.updatedAt = new Date();
  }

  public updateProfile(profile: DriverProfile): void {
    this.props.profile = profile;
    this.props.updatedAt = new Date();
  }

  public upgradeToPro(expiresAt: Date): void {
    this.props.subscriptionPlan = SubscriptionPlan.PRO;
    this.props.subscriptionExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  public upgradeToProfessional(expiresAt: Date): void {
    this.props.subscriptionPlan = SubscriptionPlan.PROFESSIONAL;
    this.props.subscriptionExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  public downgradeToFree(): void {
    this.props.subscriptionPlan = SubscriptionPlan.FREE;
    this.props.subscriptionExpiresAt = undefined;
    this.props.updatedAt = new Date();
  }

  public isSubscriptionActive(): boolean {
    if (this.props.subscriptionPlan === SubscriptionPlan.FREE) {
      return true; // Free sempre ativo
    }

    if (!this.props.subscriptionExpiresAt) {
      return false;
    }

    return this.props.subscriptionExpiresAt > new Date();
  }

  public hasProFeatures(): boolean {
    return (
      this.isSubscriptionActive() &&
      (this.props.subscriptionPlan === SubscriptionPlan.PRO ||
        this.props.subscriptionPlan === SubscriptionPlan.PROFESSIONAL)
    );
  }

  public hasProfessionalFeatures(): boolean {
    return (
      this.isSubscriptionActive() && this.props.subscriptionPlan === SubscriptionPlan.PROFESSIONAL
    );
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      phone: this.props.phone.toJSON(),
      name: this.props.name,
      weeklyGoal: this.props.weeklyGoal,
      profile: this.props.profile,
      subscriptionPlan: this.props.subscriptionPlan,
      subscriptionExpiresAt: this.props.subscriptionExpiresAt?.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

