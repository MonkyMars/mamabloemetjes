import { Decimal } from './currency';

export class PriceUtils {
  /**
   * Convert price from Decimal to cents
   */
  static decimalToCents(price: Decimal): number {
    return Math.round(price.toNumber() * 100);
  }

  /**
   * Convert price from cents to Decimal
   */
  static centsToDecimal(cents: number): Decimal {
    return new Decimal(cents).div(100);
  }

  /**
   * Convert price from number to cents
   */
  static numberToCents(price: number): number {
    return Math.round(price * 100);
  }

  /**
   * Convert price from cents to number
   */
  static centsToNumber(cents: number): number {
    return cents / 100;
  }

  /**
   * Format cents as currency string
   */
  static formatCents(cents: number, currency: string = 'EUR'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}
