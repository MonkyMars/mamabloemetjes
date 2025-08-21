use crate::actions::get::order_line::get_order_lines;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::structs::order::OrderLine;
use axum::extract::Path;
use uuid::Uuid;

/// Get all order lines for a specific order
pub async fn get_order_lines_by_order_id(
    Path(order_id): Path<Uuid>,
) -> ApiResponse<Vec<OrderLine>> {
    match get_order_lines(order_id).await {
        Ok(order_lines) => {
            if order_lines.is_empty() {
                AppResponse::Error(AppError::NotFound(format!(
                    "No order lines found for order {}",
                    order_id
                )))
            } else {
                AppResponse::Success(order_lines)
            }
        }
        Err(sqlx_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve order lines for order {}: {}",
            order_id, sqlx_error
        ))),
    }
}
