use crate::actions::get::get_product_by_id;
use crate::response::{AppResponse, error::AppError};
use crate::structs::order::IncomingOrder;
use rust_decimal::Decimal;
use rust_decimal::prelude::FromPrimitive;
use tracing::info;

pub struct Calculate;

pub struct CalculateResult {
    pub total: Decimal,
    pub error: Option<AppError>,
}

impl Calculate {
    /// Calculate the total price of an order and validate it against the provided price.
    /// Returns Ok(total) or AppResponse::Error on mismatch or missing product.
    pub async fn calculate_total_price(payload: &IncomingOrder) -> AppResponse<Decimal> {
        let mut total: Decimal = Decimal::ZERO;

        for content in &payload.items {
            for entry in &content.product {
                let result = get_product_by_id(entry.product_id).await;
                match result {
                    Ok(Some(product)) => {
                        let quantity =
                            Decimal::from_i32(entry.quantity).unwrap_or_else(|| Decimal::ZERO);
                        info!("{} * {} = {}", product.price, quantity, total);
                        total += product.price * quantity;
                    }
                    Ok(_) => {
                        return AppResponse::Error(AppError::NotFound(format!(
                            "Product with ID {} does not exist in our catalog.",
                            entry.product_id
                        )));
                    }
                    Err(db_error) => {
                        return AppResponse::Error(AppError::DatabaseError(format!(
                            "Failed to verify product {} due to a database error: {}.",
                            entry.product_id, db_error
                        )));
                    }
                }
            }
        }

        // Validate total against payload
        if total != payload.price {
            return AppResponse::Error(AppError::ValidationError(format!(
                "Price mismatch: calculated price {} does not match provided price {}.",
                total, payload.price
            )));
        }

        AppResponse::Success(total)
    }
}
