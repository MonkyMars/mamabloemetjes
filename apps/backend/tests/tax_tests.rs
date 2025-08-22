use mamabloemetjes_backend::utils::tax::Tax;
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
