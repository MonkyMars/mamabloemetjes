import Decimal from 'decimal.js';

// Configure decimal.js for currency precision (2 decimal places)
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
  modulo: Decimal.ROUND_HALF_UP,
});

export class CurrencyCalculator {
  /**
   * Convert cents (integer) to Decimal euros
   */
  static centsToDecimal(cents: number): Decimal {
    return new Decimal(cents).dividedBy(100);
  }

  /**
   * Convert Decimal euros to cents (integer)
   */
  static decimalToCents(decimal: Decimal): number {
    return decimal.mul(100).toNumber();
  }

  /**
   * Convert number euros to Decimal
   */
  static numberToDecimal(euros: number): Decimal {
    return new Decimal(euros);
  }

  /**
   * Multiply price by quantity with precision
   */
  static multiply(price: Decimal, quantity: number): Decimal {
    return price.mul(new Decimal(quantity));
  }

  /**
   * Add two decimal values
   */
  static add(a: Decimal, b: Decimal): Decimal {
    return a.add(b);
  }

  /**
   * Subtract two decimal values
   */
  static subtract(a: Decimal, b: Decimal): Decimal {
    return a.sub(b);
  }

  /**
   * Divide two decimal values
   */
  static divide(a: Decimal, b: Decimal): Decimal {
    return a.div(b);
  }

  /**
   * Sum an array of decimal values
   */
  static sum(values: Decimal[]): Decimal {
    return values.reduce((sum, value) => sum.add(value), new Decimal(0));
  }

  /**
   * Calculate line total: (price * quantity)
   */
  static calculateLineTotal(price: Decimal, quantity: number): Decimal {
    return this.multiply(price, quantity);
  }

  /**
   * Calculate tax amount (21% VAT) from tax-inclusive price
   */
  static calculateTax(priceIncludingTax: Decimal): Decimal {
    return priceIncludingTax.mul(new Decimal('0.21'));
  }

  /**
   * Calculate subtotal (tax-exclusive) from tax-inclusive price
   */
  static calculateSubtotal(priceIncludingTax: Decimal): Decimal {
    return priceIncludingTax.minus(this.calculateTax(priceIncludingTax));
  }

  /**
   * Calculate total with tax (backward compatibility)
   * @deprecated Use calculateTax for tax-inclusive prices instead
   */
  static addTax(subtotal: Decimal): Decimal {
    return subtotal.mul(new Decimal('1.21'));
  }

  /**
   * Calculate shipping cost based on threshold
   */
  static calculateShipping(
    total: Decimal,
    threshold: number = 75,
    shippingCost: number = 7.5,
  ): Decimal {
    return total.gte(new Decimal(threshold))
      ? new Decimal(0)
      : new Decimal(shippingCost);
  }

  /**
   * Format decimal as currency string
   */
  static format(decimal: Decimal, currency: string = '€'): string {
    return `${currency}${decimal.toFixed(2)}`;
  }

  /**
   * Compare two decimal values
   */
  static isEqual(a: Decimal, b: Decimal): boolean {
    return a.equals(b);
  }

  static isGreaterThan(a: Decimal, b: Decimal): boolean {
    return a.gt(b);
  }

  static isGreaterThanOrEqual(a: Decimal, b: Decimal): boolean {
    return a.gte(b);
  }

  static isLessThan(a: Decimal, b: Decimal): boolean {
    return a.lt(b);
  }

  /**
   * Calculate order summary with precision
   */
  static calculateOrderSummary(
    items: Array<{
      price: Decimal;
      quantity: number;
    }>,
  ): {
    subtotal: Decimal;
    tax: Decimal;
    shipping: Decimal;
    total: Decimal;
    itemCount: number;
    priceTotal: Decimal;
  } {
    // Calculate price total (tax-inclusive)
    const priceTotal = this.sum(
      items.map((item) => this.calculateLineTotal(item.price, item.quantity)),
    );

    // Calculate tax and subtotal from tax-inclusive price
    const tax = this.calculateTax(priceTotal);
    const subtotal = this.calculateSubtotal(priceTotal);

    // Total before shipping is the same as price total
    const totalBeforeShipping = priceTotal;

    // Calculate shipping
    const shipping = this.calculateShipping(totalBeforeShipping);

    // Calculate final total
    const total = this.add(totalBeforeShipping, shipping);

    // Calculate item count
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount,
      priceTotal,
    };
  }

  /**
   * Calculate guest cart summary from products and quantities
   */
  static calculateGuestCartSummary(
    items: Array<{
      productId: string;
      quantity: number;
    }>,
    products: Record<
      string,
      {
        price: number;
        tax: number;
        subtotal: number;
      }
    >,
  ): {
    subtotal: Decimal;
    tax: Decimal;
    shipping: Decimal;
    total: Decimal;
    itemCount: number;
    priceTotal: Decimal;
  } {
    // Convert to decimal items
    const decimalItems = items.map((item) => {
      const product = products[item.productId];
      if (!product) {
        return {
          price: new Decimal(0),
          tax: new Decimal(0),
          subtotal: new Decimal(0),
          quantity: 0,
        };
      }

      return {
        price: this.numberToDecimal(product.price),
        tax: this.numberToDecimal(product.tax),
        subtotal: this.numberToDecimal(product.subtotal),
        quantity: item.quantity,
      };
    });

    // Calculate totals
    const priceTotal = this.sum(
      decimalItems.map((item) => this.multiply(item.price, item.quantity)),
    );

    const subtotal = this.sum(
      decimalItems.map((item) => this.multiply(item.subtotal, item.quantity)),
    );

    const tax = this.sum(
      decimalItems.map((item) => this.multiply(item.tax, item.quantity)),
    );

    // Calculate shipping
    const shipping = this.calculateShipping(priceTotal);

    // Calculate final total
    const total = this.add(priceTotal, shipping);

    // Calculate item count
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount,
      priceTotal,
    };
  }

  /**
   * Calculate authenticated cart summary from cart items
   */
  static calculateAuthenticatedCartSummary(
    items: Array<{
      quantity: number;
      unit_price_cents: number;
      unit_tax_cents: number;
      unit_subtotal_cents: number;
    }>,
  ): {
    subtotal: Decimal;
    tax: Decimal;
    shipping: Decimal;
    total: Decimal;
    itemCount: number;
    priceTotal: Decimal;
  } {
    // Convert cents to decimals and calculate
    const priceTotal = this.sum(
      items.map((item) =>
        this.multiply(
          this.centsToDecimal(item.unit_price_cents),
          item.quantity,
        ),
      ),
    );

    const subtotal = this.sum(
      items.map((item) =>
        this.multiply(
          this.centsToDecimal(item.unit_subtotal_cents),
          item.quantity,
        ),
      ),
    );

    const tax = this.sum(
      items.map((item) =>
        this.multiply(this.centsToDecimal(item.unit_tax_cents), item.quantity),
      ),
    );

    // Calculate shipping
    const shipping = this.calculateShipping(priceTotal);

    // Calculate final total
    const total = this.add(priceTotal, shipping);

    // Calculate item count
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount,
      priceTotal,
    };
  }

  /**
   * Calculate remaining amount for free shipping
   */
  static calculateShippingRemaining(
    currentTotal: Decimal,
    threshold: number = 75,
  ): Decimal {
    const thresholdDecimal = new Decimal(threshold);
    return this.isLessThan(currentTotal, thresholdDecimal)
      ? this.subtract(thresholdDecimal, currentTotal)
      : new Decimal(0);
  }
}

// Export Decimal for direct use when needed
export { Decimal };
