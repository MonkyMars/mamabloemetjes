use crate::actions::get::get_product_by_id;
use crate::pool::connect::pool;
use crate::response::{AppResponse, error::AppError};
use crate::structs::order::{IncomingOrder, ProductEntry};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Product data with pricing information for calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductPriceInfo {
    pub id: Uuid,
    pub name: String,
    pub original_price: Decimal,
    pub quantity: i32,
    pub line_total: Decimal,
    pub best_discount_percentage: Decimal,
    pub discounted_price: Decimal,
    pub final_line_total: Decimal,
}

/// Discount promotion data from database
#[derive(Debug, FromRow)]
struct DiscountPromotionRow {
    discount_percentage: Decimal,
    product_ids: Vec<Uuid>,
}

/// Service for handling product data fetching and price calculations
pub struct ProductService;

impl ProductService {
    /// Fetch product pricing information with discount calculations
    /// This consolidates database calls for both validation and discount calculation
    pub async fn fetch_products_with_pricing(
        order: &IncomingOrder,
    ) -> AppResponse<Vec<ProductPriceInfo>> {
        let pool = pool();
        let mut product_infos = Vec::new();

        // Fetch all active promotions once
        let promotions = match Self::fetch_active_promotions(pool).await {
            Ok(promos) => promos,
            Err(err) => return AppResponse::Error(err),
        };

        // Process each product in the order
        for content in &order.items {
            for entry in &content.product {
                match Self::process_product_entry(entry, &promotions).await {
                    Ok(product_info) => product_infos.push(product_info),
                    Err(err) => return AppResponse::Error(err),
                }
            }
        }

        AppResponse::Success(product_infos)
    }

    /// Calculate total price from product pricing information
    pub fn calculate_total_from_products(products: &[ProductPriceInfo]) -> Decimal {
        products
            .iter()
            .map(|product| product.final_line_total)
            .sum()
    }

    /// Validate that calculated total matches expected price
    pub fn validate_total_price(
        calculated_total: Decimal,
        expected_total: Decimal,
    ) -> Result<(), AppError> {
        if calculated_total != expected_total {
            Err(AppError::ValidationError(format!(
                "Price mismatch: calculated price {} does not match provided price {}",
                calculated_total, expected_total
            )))
        } else {
            Ok(())
        }
    }

    /// Get products with original prices only (no discount calculation)
    pub async fn fetch_products_for_validation(
        order: &IncomingOrder,
    ) -> AppResponse<Vec<ProductPriceInfo>> {
        let mut product_infos = Vec::new();

        for content in &order.items {
            for entry in &content.product {
                match get_product_by_id(entry.product_id).await {
                    Ok(Some(product)) => {
                        let quantity_decimal = Decimal::from(entry.quantity);
                        let line_total = product.price * quantity_decimal;

                        let product_info = ProductPriceInfo {
                            id: product.id,
                            name: product.name,
                            original_price: product.price,
                            quantity: entry.quantity,
                            line_total,
                            best_discount_percentage: dec!(0),
                            discounted_price: product.price,
                            final_line_total: line_total,
                        };

                        product_infos.push(product_info);
                    }
                    Ok(_) => {
                        return AppResponse::Error(AppError::NotFound(format!(
                            "Product with ID {} does not exist in our catalog",
                            entry.product_id
                        )));
                    }
                    Err(db_error) => {
                        return AppResponse::Error(AppError::DatabaseError(format!(
                            "Failed to verify product {} due to database error: {}",
                            entry.product_id, db_error
                        )));
                    }
                }
            }
        }

        AppResponse::Success(product_infos)
    }

    /// Internal: Fetch active discount promotions
    async fn fetch_active_promotions(
        pool: &sqlx::PgPool,
    ) -> Result<Vec<DiscountPromotionRow>, AppError> {
        sqlx::query_as::<_, DiscountPromotionRow>(
            r#"
            SELECT discount_percentage, product_ids
            FROM discount_promotions
            WHERE NOW() BETWEEN start_date AND end_date
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch discount promotions: {}", e)))
    }

    /// Internal: Process a single product entry with discount calculation
    async fn process_product_entry(
        entry: &ProductEntry,
        promotions: &[DiscountPromotionRow],
    ) -> Result<ProductPriceInfo, AppError> {
        // Fetch product data
        let product = match get_product_by_id(entry.product_id).await {
            Ok(Some(product)) => product,
            Ok(_) => {
                return Err(AppError::NotFound(format!(
                    "Product with ID {} does not exist in our catalog",
                    entry.product_id
                )));
            }
            Err(db_error) => {
                return Err(AppError::DatabaseError(format!(
                    "Failed to verify product {} due to database error: {}",
                    entry.product_id, db_error
                )));
            }
        };

        let quantity_decimal = Decimal::from(entry.quantity);
        let line_total = product.price * quantity_decimal;

        // Find best applicable discount
        let best_discount = Self::find_best_discount(entry.product_id, promotions);

        // Calculate discounted price
        let discounted_price = if best_discount > dec!(0) {
            product.price * (Decimal::ONE - best_discount / dec!(100))
        } else {
            product.price
        };

        let final_line_total = discounted_price * quantity_decimal;

        Ok(ProductPriceInfo {
            id: product.id,
            name: product.name,
            original_price: product.price,
            quantity: entry.quantity,
            line_total,
            best_discount_percentage: best_discount,
            discounted_price: discounted_price.round_dp(2),
            final_line_total: final_line_total.round_dp(2),
        })
    }

    /// Internal: Find the best discount percentage for a product
    fn find_best_discount(product_id: Uuid, promotions: &[DiscountPromotionRow]) -> Decimal {
        promotions
            .iter()
            .filter(|promo| promo.product_ids.contains(&product_id))
            .map(|promo| promo.discount_percentage)
            .max()
            .unwrap_or(dec!(0))
    }
}
