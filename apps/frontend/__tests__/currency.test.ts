import { CurrencyCalculator, Decimal } from '../lib/currency';

describe('CurrencyCalculator', () => {
  describe('Basic conversions', () => {
    test('should convert cents to decimal correctly', () => {
      expect(CurrencyCalculator.centsToDecimal(2500).toNumber()).toBe(25.00);
      expect(CurrencyCalculator.centsToDecimal(1).toNumber()).toBe(0.01);
      expect(CurrencyCalculator.centsToDecimal(0).toNumber()).toBe(0);
    });

    test('should convert decimal to cents correctly', () => {
      expect(CurrencyCalculator.decimalToCents(new Decimal(25.00))).toBe(2500);
      expect(CurrencyCalculator.decimalToCents(new Decimal(0.01))).toBe(1);
      expect(CurrencyCalculator.decimalToCents(new Decimal(0))).toBe(0);
    });

    test('should convert numbers to decimal correctly', () => {
      expect(CurrencyCalculator.numberToDecimal(25.99).toString()).toBe('25.99');
      expect(CurrencyCalculator.numberToDecimal(0).toString()).toBe('0');
    });
  });

  describe('Mathematical operations', () => {
    test('should multiply price by quantity correctly', () => {
      const price = new Decimal('12.99');
      const result = CurrencyCalculator.multiply(price, 3);
      expect(result.toString()).toBe('38.97');
    });

    test('should handle floating point edge cases', () => {
      // Test case that would fail with regular JavaScript arithmetic
      const price = new Decimal('0.1');
      const result = CurrencyCalculator.multiply(price, 3);
      expect(result.toString()).toBe('0.3'); // JavaScript would give 0.30000000000000004
    });

    test('should add decimals correctly', () => {
      const a = new Decimal('12.99');
      const b = new Decimal('7.50');
      const result = CurrencyCalculator.add(a, b);
      expect(result.toString()).toBe('20.49');
    });

    test('should subtract decimals correctly', () => {
      const a = new Decimal('20.49');
      const b = new Decimal('7.50');
      const result = CurrencyCalculator.subtract(a, b);
      expect(result.toString()).toBe('12.99');
    });

    test('should sum arrays of decimals correctly', () => {
      const values = [
        new Decimal('12.99'),
        new Decimal('7.50'),
        new Decimal('4.25')
      ];
      const result = CurrencyCalculator.sum(values);
      expect(result.toString()).toBe('24.74');
    });
  });

  describe('Tax calculations', () => {
    test('should calculate 21% tax correctly', () => {
      const subtotal = new Decimal('100.00');
      const tax = CurrencyCalculator.calculateTax(subtotal);
      expect(tax.toString()).toBe('21');
    });

    test('should add tax correctly', () => {
      const subtotal = new Decimal('100.00');
      const withTax = CurrencyCalculator.addTax(subtotal);
      expect(withTax.toString()).toBe('121');
    });
  });

  describe('Shipping calculations', () => {
    test('should apply free shipping over threshold', () => {
      const total = new Decimal('80.00');
      const shipping = CurrencyCalculator.calculateShipping(total, 75, 7.5);
      expect(shipping.toString()).toBe('0');
    });

    test('should charge shipping under threshold', () => {
      const total = new Decimal('50.00');
      const shipping = CurrencyCalculator.calculateShipping(total, 75, 7.5);
      expect(shipping.toString()).toBe('7.5');
    });

    test('should calculate shipping remaining correctly', () => {
      const total = new Decimal('60.00');
      const remaining = CurrencyCalculator.calculateShippingRemaining(total, 75);
      expect(remaining.toString()).toBe('15');
    });

    test('should return zero remaining if over threshold', () => {
      const total = new Decimal('80.00');
      const remaining = CurrencyCalculator.calculateShippingRemaining(total, 75);
      expect(remaining.toString()).toBe('0');
    });
  });

  describe('Formatting', () => {
    test('should format currency correctly', () => {
      const amount = new Decimal('12.99');
      expect(CurrencyCalculator.format(amount)).toBe('€12.99');
    });

    test('should format currency with custom symbol', () => {
      const amount = new Decimal('12.99');
      expect(CurrencyCalculator.format(amount, '$')).toBe('$12.99');
    });

    test('should format small amounts correctly', () => {
      const amount = new Decimal('0.01');
      expect(CurrencyCalculator.format(amount)).toBe('€0.01');
    });
  });

  describe('Comparisons', () => {
    test('should compare equality correctly', () => {
      const a = new Decimal('12.99');
      const b = new Decimal('12.99');
      const c = new Decimal('13.00');

      expect(CurrencyCalculator.isEqual(a, b)).toBe(true);
      expect(CurrencyCalculator.isEqual(a, c)).toBe(false);
    });

    test('should compare greater than correctly', () => {
      const a = new Decimal('13.00');
      const b = new Decimal('12.99');

      expect(CurrencyCalculator.isGreaterThan(a, b)).toBe(true);
      expect(CurrencyCalculator.isGreaterThan(b, a)).toBe(false);
    });
  });

  describe('Order summary calculations', () => {
    test('should calculate authenticated cart summary correctly', () => {
      const items = [
        {
          quantity: 2,
          unit_price_cents: 1299, // €12.99
          unit_tax_cents: 273,    // €2.73
          unit_subtotal_cents: 1026 // €10.26
        },
        {
          quantity: 1,
          unit_price_cents: 750,  // €7.50
          unit_tax_cents: 158,    // €1.58
          unit_subtotal_cents: 592 // €5.92
        }
      ];

      const summary = CurrencyCalculator.calculateAuthenticatedCartSummary(items);

      expect(summary.priceTotal.toString()).toBe('33.48'); // (12.99 * 2) + 7.50
      expect(summary.subtotal.toString()).toBe('26.44');   // (10.26 * 2) + 5.92
      expect(summary.tax.toString()).toBe('7.04');         // (2.73 * 2) + 1.58
      expect(summary.itemCount).toBe(3);
      expect(summary.shipping.toString()).toBe('7.5');     // Under €75 threshold
      expect(summary.total.toString()).toBe('40.98');      // 33.48 + 7.50
    });

    test('should calculate guest cart summary correctly', () => {
      const items = [
        { productId: 'product1', quantity: 2 },
        { productId: 'product2', quantity: 1 }
      ];

      const products = {
        product1: { price: 12.99, tax: 2.73, subtotal: 10.26 },
        product2: { price: 7.50, tax: 1.58, subtotal: 5.92 }
      };

      const summary = CurrencyCalculator.calculateGuestCartSummary(items, products);

      expect(summary.priceTotal.toString()).toBe('33.48');
      expect(summary.subtotal.toString()).toBe('26.44');
      expect(summary.tax.toString()).toBe('7.04');
      expect(summary.itemCount).toBe(3);
    });

    test('should handle free shipping correctly in order summary', () => {
      const items = [
        {
          quantity: 6,
          unit_price_cents: 1500, // €15.00 each, total €90.00
          unit_tax_cents: 315,
          unit_subtotal_cents: 1185
        }
      ];

      const summary = CurrencyCalculator.calculateAuthenticatedCartSummary(items);

      expect(summary.priceTotal.toString()).toBe('90');
      expect(summary.shipping.toString()).toBe('0'); // Free shipping over €75
      expect(summary.total.toString()).toBe('90');
    });
  });

  describe('Precision edge cases', () => {
    test('should handle many small calculations without precision loss', () => {
      // Simulate adding many small amounts (like individual product calculations)
      const smallAmounts = Array(100).fill(new Decimal('0.01'));
      const result = CurrencyCalculator.sum(smallAmounts);
      expect(result.toString()).toBe('1');
    });

    test('should handle large calculations correctly', () => {
      const price = new Decimal('999.99');
      const result = CurrencyCalculator.multiply(price, 100);
      expect(result.toString()).toBe('99999');
    });

    test('should maintain precision in complex calculations', () => {
      // Test a complex calculation that would lose precision with floating point
      const price = new Decimal('10.00');
      const quantity = 3;
      const discount = new Decimal('0.99');

      const lineTotal = CurrencyCalculator.multiply(price, quantity);
      const afterDiscount = CurrencyCalculator.subtract(lineTotal, discount);
      const withTax = CurrencyCalculator.addTax(afterDiscount);

      expect(lineTotal.toString()).toBe('30');
      expect(afterDiscount.toString()).toBe('29.01');
      expect(withTax.toString()).toBe('35.1021');
    });
  });
});
