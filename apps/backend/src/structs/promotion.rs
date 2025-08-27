use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct DiscountPromotion {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub discount_type: String, // 'percentage' or 'fixed_amount'
    pub discount_value: Decimal,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
}

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct DiscountPromotionProduct {
    pub discount_id: Uuid,
    pub product_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DiscountPromotionWithProducts {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub discount_type: String,
    pub discount_value: Decimal,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub product_ids: Vec<Uuid>,
}

impl DiscountPromotion {
    /// Check if the promotion is currently active
    pub fn is_active(&self) -> bool {
        let now = Utc::now();
        now >= self.start_date && now <= self.end_date
    }

    /// Calculate the discounted price for a given price
    pub fn calculate_discounted_price(&self, original_price: Decimal) -> Decimal {
        match self.discount_type.as_str() {
            "percentage" => {
                let discount_amount = original_price * (self.discount_value / Decimal::from(100));
                original_price - discount_amount
            }
            "fixed_amount" => {
                let discounted = original_price - self.discount_value;
                if discounted < Decimal::ZERO {
                    Decimal::ZERO
                } else {
                    discounted
                }
            }
            _ => original_price,
        }
    }

    /// Calculate the discount amount for a given price
    pub fn calculate_discount_amount(&self, original_price: Decimal) -> Decimal {
        match self.discount_type.as_str() {
            "percentage" => original_price * (self.discount_value / Decimal::from(100)),
            "fixed_amount" => {
                if self.discount_value > original_price {
                    original_price
                } else {
                    self.discount_value
                }
            }
            _ => Decimal::ZERO,
        }
    }

    /// Get discount value for comparison/sorting purposes
    pub fn get_discount_value_for_price(&self, price: Decimal) -> Decimal {
        match self.discount_type.as_str() {
            "percentage" => price * (self.discount_value / Decimal::from(100)),
            "fixed_amount" => self.discount_value,
            _ => Decimal::ZERO,
        }
    }
}

impl DiscountPromotionWithProducts {
    /// Check if the promotion is currently active
    pub fn is_active(&self) -> bool {
        let now = Utc::now();
        now >= self.start_date && now <= self.end_date
    }

    /// Check if the promotion applies to a specific product
    pub fn applies_to_product(&self, product_id: &Uuid) -> bool {
        self.product_ids.contains(product_id)
    }

    /// Calculate the discounted price for a given price
    pub fn calculate_discounted_price(&self, original_price: Decimal) -> Decimal {
        match self.discount_type.as_str() {
            "percentage" => {
                let discount_amount = original_price * (self.discount_value / Decimal::from(100));
                original_price - discount_amount
            }
            "fixed_amount" => {
                let discounted = original_price - self.discount_value;
                if discounted < Decimal::ZERO {
                    Decimal::ZERO
                } else {
                    discounted
                }
            }
            _ => original_price,
        }
    }

    /// Calculate the discount amount for a given price
    pub fn calculate_discount_amount(&self, original_price: Decimal) -> Decimal {
        match self.discount_type.as_str() {
            "percentage" => original_price * (self.discount_value / Decimal::from(100)),
            "fixed_amount" => {
                if self.discount_value > original_price {
                    original_price
                } else {
                    self.discount_value
                }
            }
            _ => Decimal::ZERO,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateDiscountPromotion {
    pub product_ids: Vec<Uuid>,
    pub discount_type: String,
    pub discount_value: Decimal,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
}

impl CreateDiscountPromotion {
    pub fn validate(&self) -> Result<(), String> {
        // Validate discount type
        if self.discount_type != "percentage" && self.discount_type != "fixed_amount" {
            return Err("Discount type must be 'percentage' or 'fixed_amount'".to_string());
        }

        // Validate discount value
        if self.discount_value <= Decimal::ZERO {
            return Err("Discount value must be greater than 0".to_string());
        }

        if self.discount_type == "percentage" && self.discount_value > Decimal::from(100) {
            return Err("Percentage discount cannot exceed 100%".to_string());
        }

        // Validate dates
        if self.start_date >= self.end_date {
            return Err("Start date must be before end date".to_string());
        }

        // Validate product IDs
        if self.product_ids.is_empty() {
            return Err("At least one product ID is required".to_string());
        }

        Ok(())
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PriceValidationRequest {
    pub items: Vec<PriceValidationItem>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PriceValidationItem {
    pub product_id: Uuid,
    pub quantity: i32,
    pub expected_unit_price_cents: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PriceValidationResponse {
    pub is_valid: bool,
    pub items: Vec<ValidatedPriceItem>,
    pub total_original_price_cents: i32,
    pub total_discounted_price_cents: i32,
    pub total_discount_amount_cents: i32,
    pub total_tax_cents: i32,
    pub total_subtotal_cents: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValidatedPriceItem {
    pub product_id: Uuid,
    pub quantity: i32,
    pub original_unit_price_cents: i32,
    pub discounted_unit_price_cents: i32,
    pub discount_amount_cents: i32,
    pub unit_tax_cents: i32,
    pub unit_subtotal_cents: i32,
    pub applied_promotion_id: Option<Uuid>,
    pub is_price_valid: bool,
}
