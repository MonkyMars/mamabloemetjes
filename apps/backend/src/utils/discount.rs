use crate::{pool::connect::pool, response::AppResponse};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug)]
pub struct Item {
    pub id: Uuid,
    pub original: Decimal,
}

#[derive(Deserialize, sqlx::FromRow, Debug)]
pub struct DiscountPromotionRow {
    pub id: Uuid,
    pub discount_type: String,
    pub discount_value: Decimal,
    pub product_id: Uuid,
}

pub async fn get_price_with_discount(products: Vec<Item>) -> AppResponse<Decimal> {
    let pool = pool();

    // Extract product IDs for the query
    let product_ids: Vec<Uuid> = products.iter().map(|p| p.id).collect();

    // Fetch all active promotions for the given products
    let promotions: Vec<DiscountPromotionRow> = match sqlx::query_as::<_, DiscountPromotionRow>(
        r#"
        SELECT
            dp.id,
            dp.discount_type,
            dp.discount_value,
            dpp.product_id
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE NOW() BETWEEN dp.start_date AND dp.end_date
          AND dpp.product_id = ANY($1)
        "#,
    )
    .bind(&product_ids)
    .fetch_all(pool)
    .await
    {
        Ok(p) => p,
        Err(e) => {
            return AppResponse::Error(crate::response::error::AppError::DatabaseError(format!(
                "Failed to fetch discount promotions: {}",
                e
            )));
        }
    };

    let mut total_price = Decimal::ZERO;

    for product in &products {
        // Find all active discounts applicable to this product
        let applicable_promotions: Vec<&DiscountPromotionRow> = promotions
            .iter()
            .filter(|promo| promo.product_id == product.id)
            .collect();

        // Find the best discount (highest discount amount)
        let best_discount_amount = applicable_promotions
            .iter()
            .map(|promo| calculate_discount_amount(product.original, promo))
            .max()
            .unwrap_or(Decimal::ZERO);

        // Apply the best discount
        let discounted_price = product.original - best_discount_amount;
        total_price += discounted_price.max(Decimal::ZERO).round_dp(2); // Ensure non-negative and round to 2 decimals
    }

    AppResponse::Success(total_price)
}

/// Calculate discount amount for a given price and promotion
fn calculate_discount_amount(original_price: Decimal, promotion: &DiscountPromotionRow) -> Decimal {
    match promotion.discount_type.as_str() {
        "percentage" => original_price * (promotion.discount_value / dec!(100)),
        "fixed_amount" => {
            // Don't allow fixed discount to exceed the original price
            if promotion.discount_value > original_price {
                original_price
            } else {
                promotion.discount_value
            }
        }
        _ => Decimal::ZERO,
    }
}

/// Calculate the final discounted price for a single item
pub fn calculate_discounted_price(
    original_price: Decimal,
    discount_type: &str,
    discount_value: Decimal,
) -> Decimal {
    match discount_type {
        "percentage" => {
            let discount_amount = original_price * (discount_value / dec!(100));
            original_price - discount_amount
        }
        "fixed_amount" => {
            let discounted = original_price - discount_value;
            if discounted < Decimal::ZERO {
                Decimal::ZERO
            } else {
                discounted
            }
        }
        _ => original_price,
    }
}

/// Get the best active promotion for a specific product
pub async fn get_best_promotion_for_product(
    product_id: Uuid,
    product_price: Decimal,
) -> AppResponse<Option<DiscountPromotionRow>> {
    let pool = pool();

    let promotions: Vec<DiscountPromotionRow> = match sqlx::query_as::<_, DiscountPromotionRow>(
        r#"
        SELECT
            dp.id,
            dp.discount_type,
            dp.discount_value,
            dpp.product_id
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE NOW() BETWEEN dp.start_date AND dp.end_date
          AND dpp.product_id = $1
        ORDER BY
            CASE
                WHEN dp.discount_type = 'percentage' THEN $2 * dp.discount_value / 100
                ELSE dp.discount_value
            END DESC
        LIMIT 1
        "#,
    )
    .bind(product_id)
    .bind(product_price)
    .fetch_all(pool)
    .await
    {
        Ok(p) => p,
        Err(e) => {
            return AppResponse::Error(crate::response::error::AppError::DatabaseError(format!(
                "Failed to fetch best promotion: {}",
                e
            )));
        }
    };

    AppResponse::Success(promotions.into_iter().next())
}

/// Check if a promotion is currently active
pub fn is_promotion_active(
    start_date: chrono::DateTime<chrono::Utc>,
    end_date: chrono::DateTime<chrono::Utc>,
) -> bool {
    let now = chrono::Utc::now();
    now >= start_date && now <= end_date
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn test_calculate_discount_amount_percentage() {
        let promotion = DiscountPromotionRow {
            id: Uuid::new_v4(),
            discount_type: "percentage".to_string(),
            discount_value: dec!(20), // 20%
            product_id: Uuid::new_v4(),
        };

        let discount = calculate_discount_amount(dec!(100), &promotion);
        assert_eq!(discount, dec!(20));
    }

    #[test]
    fn test_calculate_discount_amount_fixed() {
        let promotion = DiscountPromotionRow {
            id: Uuid::new_v4(),
            discount_type: "fixed_amount".to_string(),
            discount_value: dec!(15),
            product_id: Uuid::new_v4(),
        };

        let discount = calculate_discount_amount(dec!(100), &promotion);
        assert_eq!(discount, dec!(15));
    }

    #[test]
    fn test_calculate_discount_amount_fixed_exceeds_price() {
        let promotion = DiscountPromotionRow {
            id: Uuid::new_v4(),
            discount_type: "fixed_amount".to_string(),
            discount_value: dec!(150), // More than the price
            product_id: Uuid::new_v4(),
        };

        let discount = calculate_discount_amount(dec!(100), &promotion);
        assert_eq!(discount, dec!(100)); // Should not exceed original price
    }

    #[test]
    fn test_calculate_discounted_price_percentage() {
        let discounted = calculate_discounted_price(dec!(100), "percentage", dec!(25));
        assert_eq!(discounted, dec!(75));
    }

    #[test]
    fn test_calculate_discounted_price_fixed() {
        let discounted = calculate_discounted_price(dec!(100), "fixed_amount", dec!(30));
        assert_eq!(discounted, dec!(70));
    }

    #[test]
    fn test_calculate_discounted_price_fixed_exceeds() {
        let discounted = calculate_discounted_price(dec!(50), "fixed_amount", dec!(75));
        assert_eq!(discounted, dec!(0)); // Should not go below zero
    }
}
