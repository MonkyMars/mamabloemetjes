use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub struct Tax;

impl Tax {
    /// 21% VAT
    pub const RATE: Decimal = dec!(0.21);
    pub const RATE_STR: &'static str = "21%";

    /// Calculate VAT for a given pre-tax total
    /// Use this when you have a pre-tax amount and want to know the tax
    pub fn calculate_tax(total: Decimal) -> Decimal {
        (total * Self::RATE).round_dp(2)
    }

    /// Calculate total including VAT from a pre-tax amount
    /// Use this when you have a pre-tax amount and want the tax-inclusive total
    pub fn total_with_tax(total: Decimal) -> Decimal {
        (total * (Decimal::ONE + Self::RATE)).round_dp(2)
    }

    /// Extract pre-tax amount from a tax-inclusive total
    /// Use this when you have a tax-inclusive amount and want the pre-tax amount
    pub fn total_without_tax(total: Decimal) -> Decimal {
        (total / (Decimal::ONE + Self::RATE)).round_dp(2)
    }
}
