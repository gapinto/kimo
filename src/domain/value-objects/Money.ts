/**
 * Value Object: Money
 * Representa valores monetários com validação e operações seguras
 * Princípio: Immutability + Value Object Pattern
 */

export class Money {
  private readonly _amount: number;

  private constructor(amount: number) {
    this._amount = amount;
  }

  public static create(amount: number): Money {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    // Arredonda para 2 casas decimais
    const rounded = Math.round(amount * 100) / 100;
    return new Money(rounded);
  }

  public get value(): number {
    return this._amount;
  }

  public add(other: Money): Money {
    return Money.create(this._amount + other._amount);
  }

  public subtract(other: Money): Money {
    return Money.create(this._amount - other._amount);
  }

  public multiply(factor: number): Money {
    return Money.create(this._amount * factor);
  }

  public divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return Money.create(this._amount / divisor);
  }

  public isGreaterThan(other: Money): boolean {
    return this._amount > other._amount;
  }

  public isLessThan(other: Money): boolean {
    return this._amount < other._amount;
  }

  public equals(other: Money): boolean {
    return this._amount === other._amount;
  }

  public toString(): string {
    return `R$ ${this._amount.toFixed(2)}`;
  }

  public toJSON(): number {
    return this._amount;
  }
}

