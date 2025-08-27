use mamabloemetjes_backend::utils::tax::Tax;
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal_macros::dec;

#[test]
fn test_calculate_tax_from_pretax_amount() {
    // 21% VAT on €100 should be €21
    let pretax = dec!(100.00);
    let tax = Tax::calculate_tax(pretax);
    assert_eq!(tax, dec!(21.00));
}

#[test]
fn test_total_with_tax() {
    // €100 + 21% VAT should be €121
    let pretax = dec!(100.00);
    let total = Tax::total_with_tax(pretax);
    assert_eq!(total, dec!(121.00));
}

#[test]
fn test_total_without_tax() {
    // €121 including 21% VAT should extract to €100 pretax
    let tax_inclusive = dec!(121.00);
    let pretax = Tax::total_without_tax(tax_inclusive);
    assert_eq!(pretax, dec!(100.00));
}

#[test]
fn test_tax_calculation_roundtrip() {
    // Start with tax-inclusive price, extract pretax, then calculate tax
    let tax_inclusive_price = dec!(121.00);
    let pretax_amount = Tax::total_without_tax(tax_inclusive_price);
    let tax_amount = tax_inclusive_price - pretax_amount;

    assert_eq!(pretax_amount, dec!(100.00));
    assert_eq!(tax_amount, dec!(21.00));
    assert_eq!(pretax_amount + tax_amount, tax_inclusive_price);
}

#[test]
fn test_price_validation_scenario() {
    // Simulate the order scenario: payload has €121 (tax-inclusive)
    let payload_price = dec!(121.00);

    // Extract pretax amount
    let pretax = Tax::total_without_tax(payload_price);

    // For validation, convert back to tax-inclusive
    let calculated_tax_inclusive = Tax::total_with_tax(pretax);

    // Should match original payload price
    assert_eq!(calculated_tax_inclusive, payload_price);
}

#[test]
fn test_tax_calculation_on_discounted_price() {
    // Test the new tax calculation method: tax = price * 0.21, subtotal = price - tax
    // Example: €47.99 discounted price (tax-inclusive)
    let discounted_price = dec!(47.99);

    // Calculate tax as 21% of the tax-inclusive price
    let tax = discounted_price * Tax::RATE;
    let subtotal = discounted_price - tax;

    // Expected values
    let expected_tax = dec!(10.0779); // 47.99 * 0.21
    let expected_subtotal = dec!(37.9121); // 47.99 - 10.0779

    assert_eq!(tax, expected_tax);
    assert_eq!(subtotal, expected_subtotal);

    // Verify they add up to the original price
    assert_eq!(subtotal + tax, discounted_price);
}

#[test]
fn test_tax_calculation_vs_traditional_method() {
    // Compare new method vs traditional method
    let tax_inclusive_price = dec!(47.99);

    // New method: tax = price * 0.21, subtotal = price - tax
    let new_tax = tax_inclusive_price * Tax::RATE;
    let new_subtotal = tax_inclusive_price - new_tax;

    // Traditional method: subtotal = price / 1.21, tax = subtotal * 0.21
    let traditional_subtotal = Tax::total_without_tax(tax_inclusive_price);
    let traditional_tax = Tax::calculate_tax(traditional_subtotal);

    // The new method should give different (correct) results for discount scenarios
    // New: tax = €47.99 * 0.21 = €10.08, subtotal = €37.91
    // Traditional: subtotal = €47.99 / 1.21 = €39.66, tax = €39.66 * 0.21 = €8.33

    assert_eq!(new_tax, dec!(10.0779));
    assert_eq!(new_subtotal, dec!(37.9121));
    assert_eq!(traditional_subtotal, dec!(39.66));
    assert_eq!(traditional_tax, dec!(8.33));

    // Both methods should reconstruct the original price
    assert_eq!(new_subtotal + new_tax, tax_inclusive_price);
    assert_eq!(traditional_subtotal + traditional_tax, tax_inclusive_price);
}

#[test]
fn test_multiple_items_rounding_precision() {
    // Test the exact scenario from the user: 8 items at €47.99 each
    let item_price = dec!(47.99);
    let quantity = 8;

    // Calculate total first, then round (correct approach)
    let total_price = item_price * Decimal::from(quantity);
    let total_tax = total_price * Tax::RATE;
    let total_subtotal = total_price - total_tax;

    // Convert to cents (this is what the backend should return)
    let total_price_cents = (total_price * Decimal::from(100)).round().to_i32().unwrap();
    let total_tax_cents = (total_tax * Decimal::from(100)).round().to_i32().unwrap();
    let total_subtotal_cents = (total_subtotal * Decimal::from(100))
        .round()
        .to_i32()
        .unwrap();

    // Expected values
    assert_eq!(total_price_cents, 38392); // €383.92
    assert_eq!(total_tax_cents, 8062); // €80.62 (not 8064!)
    assert_eq!(total_subtotal_cents, 30330); // €303.30

    // Verify math
    assert_eq!(total_tax, dec!(80.6232));
    assert_eq!(total_subtotal, dec!(303.2968));
    assert_eq!(total_price, dec!(383.92));
}

#[test]
fn test_incorrect_vs_correct_rounding() {
    // Show the difference between incorrect and correct rounding
    let item_price = dec!(47.99);
    let quantity = 8;

    // INCORRECT: Calculate per-item, round, then multiply
    let unit_tax = item_price * Tax::RATE;
    let unit_tax_cents = (unit_tax * Decimal::from(100)).round().to_i32().unwrap();
    let incorrect_total_tax_cents = unit_tax_cents * quantity;

    // CORRECT: Calculate total, then round
    let total_tax = (item_price * Decimal::from(quantity)) * Tax::RATE;
    let correct_total_tax_cents = (total_tax * Decimal::from(100)).round().to_i32().unwrap();

    assert_eq!(unit_tax_cents, 1008); // €10.08 per item (rounded)
    assert_eq!(incorrect_total_tax_cents, 8064); // €80.64 (wrong!)
    assert_eq!(correct_total_tax_cents, 8062); // €80.62 (correct!)

    // Show the 2-cent difference
    assert_eq!(incorrect_total_tax_cents - correct_total_tax_cents, 2);
}
