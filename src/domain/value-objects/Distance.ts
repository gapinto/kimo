/**
 * Value Object: Distance
 * Representa distâncias em quilômetros
 */

export class Distance {
  private readonly _kilometers: number;

  private constructor(kilometers: number) {
    this._kilometers = kilometers;
  }

  public static create(kilometers: number): Distance {
    if (typeof kilometers !== 'number' || isNaN(kilometers)) {
      throw new Error('Distance must be a valid number');
    }

    if (kilometers < 0) {
      throw new Error('Distance cannot be negative');
    }

    // Arredonda para 2 casas decimais
    const rounded = Math.round(kilometers * 100) / 100;
    return new Distance(rounded);
  }

  public get value(): number {
    return this._kilometers;
  }

  public add(other: Distance): Distance {
    return Distance.create(this._kilometers + other._kilometers);
  }

  public toString(): string {
    return `${this._kilometers.toFixed(2)} km`;
  }

  public toJSON(): number {
    return this._kilometers;
  }
}

