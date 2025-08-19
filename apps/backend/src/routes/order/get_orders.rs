use axum::extract::Path;
use uuid::Uuid;

use crate::pool::{get_all_orders, get_order_by_id};
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::order::Order;

// GET /orders - Get all orders
pub async fn get_orders() -> ApiResponse<Vec<Order>> {
    match get_all_orders().await {
        Ok(orders) => success(orders),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(db_error.to_string())),
    }
}

// GET /orders/:id - Get order by ID
pub async fn get_order(Path(id): Path<Uuid>) -> ApiResponse<Order> {
    match get_order_by_id(id).await {
        Ok(Some(order)) => success(order),
        Ok(_) => AppResponse::Error(AppError::NotFound("Order not found".to_string())),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(db_error.to_string())),
    }
}
