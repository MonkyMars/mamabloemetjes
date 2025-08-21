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
struct DiscountPromotionRow {
    discount_percentage: Decimal,
    product_ids: Vec<Uuid>,
}

pub async fn get_price_with_discount(products: Vec<Item>) -> AppResponse<Decimal> {
    let pool = pool();

    // Fetch all active promotions
    let promotions: Vec<DiscountPromotionRow> = match sqlx::query_as::<_, DiscountPromotionRow>(
        r#"
        SELECT discount_percentage, product_ids
        FROM discount_promotions
        WHERE NOW() BETWEEN start_date AND end_date
        "#,
    )
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
        let mut best_discount = dec!(0);
        for promo in &promotions {
            if promo.product_ids.contains(&product.id) {
                if promo.discount_percentage > best_discount {
                    best_discount = promo.discount_percentage;
                }
            }
        }

        // Apply the discount if any
        let discounted_price = product.original * (Decimal::ONE - best_discount / dec!(100)); // (1 - discount_percentage / 100)
        total_price += discounted_price.round_dp(2); // Always 2 decimals
    }

    AppResponse::Success(total_price)
}
