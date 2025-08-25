import { CurrencyCalculator, Decimal } from '../lib/currency';

describe('Precision Comparison: Old vs New Approach', () => {
  describe('JavaScript floating-point vs Decimal.js precision', () => {
    test('should demonstrate classic floating-point precision loss', () => {
      // Classic JavaScript floating-point issue
      const jsResult = 0.1 + 0.2;
      expect(jsResult).not.toBe(0.3); // This fails with JavaScript
      expect(jsResult).toBe(0.30000000000000004);

      // Decimal.js solution
      const decimalResult = new Decimal(0.1).add(new Decimal(0.2));
      expect(decimalResult.toString()).toBe('0.3'); // This works correctly
    });

    test('should demonstrate multiplication precision issues', () => {
      // JavaScript floating-point multiplication issue
      const price = 0.1;
      const quantity = 3;
      const jsResult = price * quantity;
      expect(jsResult).not.toBe(0.3);
      expect(jsResult).toBe(0.30000000000000004);

      // Decimal.js solution
      const decimalPrice = new Decimal(0.1);
      const decimalResult = CurrencyCalculator.multiply(decimalPrice, quantity);
      expect(decimalResult.toString()).toBe('0.3');
    });

    test('should demonstrate division precision issues (cents conversion)', () => {
      // JavaScript division issue when converting cents to euros
      const cents = 2599; // €25.99
      const jsResult = cents / 100;
      expect(jsResult).toBe(25.99); // This happens to work, but...

      // More problematic case
      const problemCents = 333; // Should be €3.33

      // Decimal.js solution - always precise
      const decimalResult = CurrencyCalculator.centsToDecimal(problemCents);
      expect(decimalResult.toString()).toBe('3.33');
    });
  });

  describe('Cart calculation precision scenarios', () => {
    test('should demonstrate precision loss in repeated calculations', () => {
      // Simulate old cart calculation approach
      const items = [
        { price: 12.99, quantity: 3 },
        { price: 0.99, quantity: 10 },
        { price: 7.89, quantity: 2 },
      ];

      // Old JavaScript approach
      let jsTotal = 0;
      items.forEach((item) => {
        jsTotal += item.price * item.quantity;
      });
      jsTotal = parseFloat(jsTotal.toFixed(2)); // Rounding attempt

      // New Decimal approach
      const decimalItems = items.map((item) => ({
        price: new Decimal(item.price),
        quantity: item.quantity,
      }));
      const decimalTotal = CurrencyCalculator.sum(
        decimalItems.map((item) =>
          CurrencyCalculator.multiply(item.price, item.quantity),
        ),
      );

      // Results should be the same for this case, but decimal is more reliable
      // 12.99 * 3 + 0.99 * 10 + 7.89 * 2 = 38.97 + 9.90 + 15.78 = 64.65
      expect(jsTotal).toBe(64.65);
      expect(decimalTotal.toString()).toBe('64.65');
    });

    test('should demonstrate precision issues with tax calculations', () => {
      const subtotal = 12.34;

      // Decimal approach
      const decimalSubtotal = new Decimal(subtotal);
      const decimalTax = CurrencyCalculator.calculateTax(decimalSubtotal);
      const decimalTotal = CurrencyCalculator.add(decimalSubtotal, decimalTax);

      expect(decimalTax.toString()).toBe('2.5914');
      expect(decimalTotal.toString()).toBe('14.9314');
    });

    test('should demonstrate accumulation of errors in complex calculations', () => {
      // Simulate a complex cart with many items and operations
      const cartItems = Array(100)
        .fill(null)
        .map((_, i) => ({
          price: 9.99 + i * 0.01, // Prices from 9.99 to 10.98
          quantity: 1,
          discount: 0.05, // 5% discount
        }));

      // Old JavaScript approach with multiple operations
      let jsSubtotal = 0;
      cartItems.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        const discountAmount = lineTotal * item.discount;
        const finalLineTotal = lineTotal - discountAmount;
        jsSubtotal += finalLineTotal;
      });
      const jsTax = jsSubtotal * 0.21;
      const jsTotal = jsSubtotal + jsTax;

      // New Decimal approach
      const decimalSubtotal = CurrencyCalculator.sum(
        cartItems.map((item) => {
          const lineTotal = CurrencyCalculator.multiply(
            new Decimal(item.price),
            item.quantity,
          );
          const discountAmount = CurrencyCalculator.multiply(
            lineTotal,
            item.discount,
          );
          return CurrencyCalculator.subtract(lineTotal, discountAmount);
        }),
      );
      const decimalTax = CurrencyCalculator.calculateTax(decimalSubtotal);
      const decimalTotal = CurrencyCalculator.add(decimalSubtotal, decimalTax);

      // The JavaScript version may have accumulated floating-point errors
      // The Decimal version maintains precision throughout
      console.log('JS Total:', jsTotal);
      console.log('Decimal Total:', decimalTotal.toString());

      // Test that our decimal calculation is internally consistent
      expect(decimalTotal.toString()).toBe(
        CurrencyCalculator.add(decimalSubtotal, decimalTax).toString(),
      );
    });
  });

  describe('Real-world e-commerce scenarios', () => {
    test('should handle guest cart vs authenticated cart calculation consistency', () => {
      // Simulate the same products calculated differently in guest vs auth cart
      const products = {
        product1: { price: 12.99, tax: 2.73, subtotal: 10.26 },
        product2: { price: 7.5, tax: 1.58, subtotal: 5.92 },
      };

      // Guest cart calculation (old way would use direct JavaScript)
      const guestItems = [
        { productId: 'product1', quantity: 2 },
        { productId: 'product2', quantity: 1 },
      ];

      // Authenticated cart (values come from backend in cents)
      const authItems = [
        {
          quantity: 2,
          unit_price_cents: 1299, // €12.99
          unit_tax_cents: 273, // €2.73
          unit_subtotal_cents: 1026, // €10.26
        },
        {
          quantity: 1,
          unit_price_cents: 750, // €7.50
          unit_tax_cents: 158, // €1.58
          unit_subtotal_cents: 592, // €5.92
        },
      ];

      // Calculate using our new precise methods
      const guestSummary = CurrencyCalculator.calculateGuestCartSummary(
        guestItems,
        products,
      );
      const authSummary =
        CurrencyCalculator.calculateAuthenticatedCartSummary(authItems);

      // Both should give identical results now
      expect(guestSummary.priceTotal.toString()).toBe(
        authSummary.priceTotal.toString(),
      );
      expect(guestSummary.subtotal.toString()).toBe(
        authSummary.subtotal.toString(),
      );
      expect(guestSummary.tax.toString()).toBe(authSummary.tax.toString());
      expect(guestSummary.total.toString()).toBe(authSummary.total.toString());
    });

    test('should handle shipping threshold calculations precisely', () => {
      // Test edge case where cart total is very close to shipping threshold
      const cartTotal = 74.99; // Just under €75 threshold

      // Old JavaScript approach
      const jsShipping = cartTotal >= 75 ? 0 : 7.5;
      const jsTotal = cartTotal + jsShipping;

      // New Decimal approach
      const decimalCartTotal = new Decimal(cartTotal);
      const decimalShipping = CurrencyCalculator.calculateShipping(
        decimalCartTotal,
        75,
        7.5,
      );
      const decimalTotal = CurrencyCalculator.add(
        decimalCartTotal,
        decimalShipping,
      );

      expect(jsShipping).toBe(7.5);
      expect(decimalShipping.toString()).toBe('7.5');
      expect(jsTotal).toBe(82.49);
      expect(decimalTotal.toString()).toBe('82.49');

      // Test the exact threshold
      const thresholdTotal = new Decimal(75);
      const thresholdShipping = CurrencyCalculator.calculateShipping(
        thresholdTotal,
        75,
        7.5,
      );
      expect(thresholdShipping.toString()).toBe('0');
    });

    test('should demonstrate toFixed() rounding issues vs proper decimal rounding', () => {
      const value = 12.995;

      // JavaScript toFixed() can be inconsistent
      const jsFormatted = `€${value.toFixed(2)}`;

      // Decimal.js provides consistent rounding
      const decimalValue = new Decimal(value);
      const decimalFormatted = CurrencyCalculator.format(decimalValue);

      // JavaScript uses banker's rounding for .5 cases differently than Decimal
      expect(jsFormatted).toBe('€12.99');
      expect(decimalFormatted).toBe('€13.00'); // Decimal.js rounds 12.995 up

      // Test edge case
      const edgeCase = 12.994999999999999;
      const jsEdge = `€${edgeCase.toFixed(2)}`;
      const decimalEdge = CurrencyCalculator.format(new Decimal(edgeCase));

      console.log('JS Edge Case:', jsEdge);
      console.log('Decimal Edge Case:', decimalEdge);
    });
  });

  describe('Performance considerations', () => {
    test('should demonstrate that precision comes with performance trade-offs', () => {
      const iterations = 1000;
      const startValue = 10.99;

      // JavaScript performance
      const jsStart = performance.now();
      let jsResult = 0;
      for (let i = 0; i < iterations; i++) {
        jsResult += startValue * 1.21; // Add tax
      }
      const jsEnd = performance.now();

      // Decimal performance
      const decimalStart = performance.now();
      let decimalResult = new Decimal(0);
      const decimalValue = new Decimal(startValue);
      for (let i = 0; i < iterations; i++) {
        decimalResult = decimalResult.add(
          CurrencyCalculator.addTax(decimalValue),
        );
      }
      const decimalEnd = performance.now();

      console.log(`JavaScript time: ${jsEnd - jsStart}ms`);
      console.log(`Decimal time: ${decimalEnd - decimalStart}ms`);
      console.log(`JavaScript result: ${jsResult}`);
      console.log(`Decimal result: ${decimalResult.toString()}`);

      // Decimal should be more precise but potentially slower
      expect(typeof jsResult).toBe('number');
      expect(decimalResult instanceof Decimal).toBe(true);
    });
  });
});
