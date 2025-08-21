use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub struct Tax;

impl Tax {
    /// 21% VAT
    pub const RATE: Decimal = dec!(0.21);
    pub const RATE_STR: &'static str = "21%";

    /// Calculate VAT for a given total
    pub fn calculate_tax(total: Decimal) -> Decimal {
        (total * Self::RATE).round_dp(2)
    }

    /// Calculate total including VAT
    pub fn total_with_tax(total: Decimal) -> Decimal {
        (total * (Decimal::ONE + Self::RATE)).round_dp(2)
    }

    /// Calculate total excluding VAT
    pub fn total_without_tax(total: Decimal) -> Decimal {
        (total / (Decimal::ONE + Self::RATE)).round_dp(2)
    }
}
