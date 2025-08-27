use crate::pool::connect::pool;
use crate::response::{AppResponse, error::AppError};
use crate::structs::product::Product;
use crate::structs::promotion::{
    DiscountPromotionWithProducts, PriceValidationRequest, PriceValidationResponse,
    ValidatedPriceItem,
};
use crate::utils::tax::Tax;
use chrono::Utc;
use rust_decimal::Decimal;
use sqlx::Row;
use std::collections::HashMap;
use uuid::Uuid;

pub struct PromotionService;

impl PromotionService {
    /// Get all active promotions for given product IDs
    pub async fn get_active_promotions_for_products(
        product_ids: &[Uuid],
    ) -> AppResponse<Vec<DiscountPromotionWithProducts>> {
        let pool = pool();
        let now = Utc::now();

        let query = sqlx::query(
            r#"
            SELECT
                dp.id,
                dp.created_at,
                dp.updated_at,
                dp.discount_type,
                dp.discount_value,
                dp.start_date,
                dp.end_date,
                ARRAY_AGG(dpp.product_id) as product_ids
            FROM discount_promotions dp
            JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
            WHERE dp.start_date <= $1
                AND dp.end_date >= $1
                AND dpp.product_id = ANY($2)
            GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
            ORDER BY
                CASE
                    WHEN dp.discount_type = 'percentage' THEN dp.discount_value
                    ELSE 0
                END DESC,
                CASE
                    WHEN dp.discount_type = 'fixed_amount' THEN dp.discount_value
                    ELSE 0
                END DESC
            "#,
        )
        .bind(now)
        .bind(product_ids);

        match query.fetch_all(pool).await {
            Ok(rows) => {
                let mut promotions = Vec::new();
                for row in rows {
                    let promotion = DiscountPromotionWithProducts {
                        id: row.get("id"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                        discount_type: row.get("discount_type"),
                        discount_value: row.get("discount_value"),
                        start_date: row.get("start_date"),
                        end_date: row.get("end_date"),
                        product_ids: row.get("product_ids"),
                    };
                    promotions.push(promotion);
                }
                AppResponse::Success(promotions)
            }
            Err(e) => {
                tracing::error!("Failed to fetch active promotions: {}", e);
                AppResponse::Error(AppError::DatabaseError(e.to_string()))
            }
        }
    }

    /// Get the best (highest discount) promotion for a specific product
    pub async fn get_best_promotion_for_product(
        product_id: &Uuid,
        product_price: Decimal,
    ) -> AppResponse<Option<DiscountPromotionWithProducts>> {
        let promotions = match Self::get_active_promotions_for_products(&[*product_id]).await {
            AppResponse::Success(promotions) => promotions,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        let best_promotion = promotions
            .into_iter()
            .filter(|p| p.applies_to_product(product_id))
            .max_by(|a, b| {
                let a_discount = a.calculate_discount_amount(product_price);
                let b_discount = b.calculate_discount_amount(product_price);
                a_discount.cmp(&b_discount)
            });

        AppResponse::Success(best_promotion)
    }

    /// Get all active promotions
    pub async fn get_all_active_promotions() -> AppResponse<Vec<DiscountPromotionWithProducts>> {
        let pool = pool();
        let now = Utc::now();

        let query = sqlx::query(
            r#"
            SELECT
                dp.id,
                dp.created_at,
                dp.updated_at,
                dp.discount_type,
                dp.discount_value,
                dp.start_date,
                dp.end_date,
                ARRAY_AGG(dpp.product_id) as product_ids
            FROM discount_promotions dp
            JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
            WHERE dp.start_date <= $1 AND dp.end_date >= $1
            GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
            ORDER BY dp.created_at DESC
            "#,
        )
        .bind(now);

        match query.fetch_all(pool).await {
            Ok(rows) => {
                let mut promotions = Vec::new();
                for row in rows {
                    let promotion = DiscountPromotionWithProducts {
                        id: row.get("id"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                        discount_type: row.get("discount_type"),
                        discount_value: row.get("discount_value"),
                        start_date: row.get("start_date"),
                        end_date: row.get("end_date"),
                        product_ids: row.get("product_ids"),
                    };
                    promotions.push(promotion);
                }
                AppResponse::Success(promotions)
            }
            Err(e) => {
                tracing::error!("Failed to fetch all active promotions: {}", e);
                AppResponse::Error(AppError::DatabaseError(e.to_string()))
            }
        }
    }

    /// Validate prices for multiple items, applying best available promotions
    pub async fn validate_prices(
        request: PriceValidationRequest,
    ) -> AppResponse<PriceValidationResponse> {
        // Extract product IDs from request
        let product_ids: Vec<Uuid> = request.items.iter().map(|item| item.product_id).collect();

        // Fetch products
        let products = match Self::fetch_products_by_ids(&product_ids).await {
            AppResponse::Success(products) => products,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        // Create a map for quick product lookup
        let product_map: HashMap<Uuid, &Product> = products
            .iter()
            .map(|product| (product.id, product))
            .collect();

        // Get active promotions for these products
        let promotions = match Self::get_active_promotions_for_products(&product_ids).await {
            AppResponse::Success(promotions) => promotions,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        // Group promotions by product ID for efficient lookup
        let mut product_promotions: HashMap<Uuid, Vec<&DiscountPromotionWithProducts>> =
            HashMap::new();
        for promotion in &promotions {
            for product_id in &promotion.product_ids {
                product_promotions
                    .entry(*product_id)
                    .or_insert_with(Vec::new)
                    .push(promotion);
            }
        }

        // Validate each item
        let mut validated_items = Vec::new();
        let mut total_original_price_cents = 0;
        let mut total_discounted_price_cents = 0;
        let mut total_discount_amount_cents = 0;
        let mut total_tax = Decimal::ZERO;
        let mut total_subtotal = Decimal::ZERO;
        let mut all_valid = true;

        for item in request.items {
            let product = match product_map.get(&item.product_id) {
                Some(product) => product,
                None => {
                    all_valid = false;
                    continue;
                }
            };

            // Get best promotion for this product based on discount amount
            let best_promotion = product_promotions.get(&item.product_id).and_then(|promos| {
                promos.iter().max_by(|a, b| {
                    let a_discount = a.calculate_discount_amount(product.price);
                    let b_discount = b.calculate_discount_amount(product.price);
                    a_discount.cmp(&b_discount)
                })
            });

            // Calculate prices
            let original_unit_price_cents = Self::decimal_to_cents(product.price);

            let (discounted_unit_price_cents, discount_amount_cents, applied_promotion_id) =
                if let Some(promotion) = best_promotion {
                    let discounted_price = promotion.calculate_discounted_price(product.price);
                    let discount_amount = promotion.calculate_discount_amount(product.price);
                    (
                        Self::decimal_to_cents(discounted_price),
                        Self::decimal_to_cents(discount_amount),
                        Some(promotion.id),
                    )
                } else {
                    (original_unit_price_cents, 0, None)
                };

            // Calculate tax and subtotal on the final price (discounted if applicable)
            let final_price = if discounted_unit_price_cents != original_unit_price_cents {
                // Use discounted price
                Decimal::from(discounted_unit_price_cents) / Decimal::from(100)
            } else {
                // Use original price
                product.price
            };

            let unit_tax = final_price * Tax::RATE;
            let unit_subtotal = final_price - unit_tax;
            let unit_tax_cents = Self::decimal_to_cents(unit_tax);
            let unit_subtotal_cents = Self::decimal_to_cents(unit_subtotal);

            // Check if the expected price matches our calculated price
            let is_price_valid = item.expected_unit_price_cents == discounted_unit_price_cents;
            if !is_price_valid {
                all_valid = false;
            }

            // Add to totals (accumulate as Decimal for precision)
            let quantity = item.quantity;
            total_original_price_cents += original_unit_price_cents * quantity;
            total_discounted_price_cents += discounted_unit_price_cents * quantity;
            total_discount_amount_cents += discount_amount_cents * quantity;
            total_tax += unit_tax * Decimal::from(quantity);
            total_subtotal += unit_subtotal * Decimal::from(quantity);

            validated_items.push(ValidatedPriceItem {
                product_id: item.product_id,
                quantity: item.quantity,
                original_unit_price_cents,
                discounted_unit_price_cents,
                discount_amount_cents,
                unit_tax_cents,
                unit_subtotal_cents,
                applied_promotion_id,
                is_price_valid,
            });
        }

        // Convert accumulated totals to cents (round once at the end)
        let total_tax_cents = Self::decimal_to_cents(total_tax);
        let total_subtotal_cents = Self::decimal_to_cents(total_subtotal);

        let response = PriceValidationResponse {
            is_valid: all_valid,
            items: validated_items,
            total_original_price_cents,
            total_discounted_price_cents,
            total_discount_amount_cents,
            total_tax_cents,
            total_subtotal_cents,
        };

        AppResponse::Success(response)
    }

    /// Helper function to fetch products by IDs
    async fn fetch_products_by_ids(product_ids: &[Uuid]) -> AppResponse<Vec<Product>> {
        let pool = pool();

        let query = r#"
            SELECT
                p.id,
                p.name,
                p.sku,
                p.price,
                p.tax,
                p.subtotal,
                p.description,
                p.is_active,
                p.created_at,
                p.updated_at,
                p.size,
                p.colors,
                p.product_type,
                (i.quantity_on_hand - i.quantity_reserved) AS available_stock,
                -- discounted price calculation
                COALESCE((
                    SELECT
                        CASE
                            WHEN dp.discount_type = 'percentage' THEN ROUND(p.price - (p.price * dp.discount_value / 100), 2)
                            ELSE p.price - dp.discount_value
                        END
                    FROM discount_promotions_products dpp
                    JOIN discount_promotions dp ON dp.id = dpp.discount_id
                    WHERE dpp.product_id = p.id
                      AND now() BETWEEN dp.start_date AND dp.end_date
                    ORDER BY
                        CASE
                            WHEN dp.discount_type = 'percentage' THEN p.price * dp.discount_value / 100
                            ELSE dp.discount_value
                        END DESC
                    LIMIT 1
                ), p.price) AS discounted_price
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE p.id = ANY($1)
              AND p.is_active = true;
        "#;

        match sqlx::query(query).bind(product_ids).fetch_all(pool).await {
            Ok(rows) => {
                let mut products = Vec::new();
                for row in rows {
                    let product = Product {
                        id: row.get("id"),
                        name: row.get("name"),
                        sku: row.get("sku"),
                        price: row.get("price"),
                        discounted_price: row.get("discounted_price"),
                        tax: row.get("tax"),
                        subtotal: row.get("subtotal"),
                        description: row.get("description"),
                        is_active: row.get("is_active"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                        size: row.get("size"),
                        colors: row.get("colors"),
                        product_type: row.get("product_type"),
                        stock: row.get("available_stock"),
                        images: None,
                    };
                    products.push(product);
                }
                AppResponse::Success(products)
            }
            Err(e) => {
                tracing::error!("Failed to fetch products: {}", e);
                AppResponse::Error(AppError::DatabaseError(e.to_string()))
            }
        }
    }

    /// Convert Decimal to cents (multiply by 100 and round to nearest integer)
    fn decimal_to_cents(decimal: Decimal) -> i32 {
        use rust_decimal::prelude::ToPrimitive;
        let cents = decimal * Decimal::from(100);
        cents.round().to_i32().unwrap_or(0)
    }
}
