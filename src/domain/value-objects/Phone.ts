/**
 * Value Object: Phone
 * Representa número de telefone brasileiro com validação
 */

export class Phone {
  private readonly _number: string;

  private constructor(number: string) {
    this._number = number;
  }

  public static create(phone: string): Phone {
    const cleaned = phone.replace(/\D/g, '');

    // Valida formato brasileiro: deve ter 10 ou 11 dígitos
    // Ex: 11999999999 ou 1133334444
    if (cleaned.length < 10 || cleaned.length > 11) {
      throw new Error('Invalid phone number format');
    }

    // Adiciona código do país se não tiver
    const withCountryCode = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    return new Phone(withCountryCode);
  }

  public get value(): string {
    return this._number;
  }

  public formatted(): string {
    // Formata: +55 11 99999-9999
    if (this._number.length === 13) {
      return `+${this._number.slice(0, 2)} ${this._number.slice(2, 4)} ${this._number.slice(
        4,
        9
      )}-${this._number.slice(9)}`;
    }
    // Formata: +55 11 3333-4444
    return `+${this._number.slice(0, 2)} ${this._number.slice(2, 4)} ${this._number.slice(
      4,
      8
    )}-${this._number.slice(8)}`;
  }

  public equals(other: Phone): boolean {
    return this._number === other._number;
  }

  public toString(): string {
    return this.formatted();
  }

  public toJSON(): string {
    return this._number;
  }
}

