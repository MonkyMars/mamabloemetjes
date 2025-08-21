use axum::extract::Path;
use uuid::Uuid;

use crate::actions::get::{get_all_orders, get_order_by_id};
use crate::actions::post::order::get_order_with_lines;
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::order::{Order, OrderWithLines};

// GET /orders - Get all orders
pub async fn get_orders() -> ApiResponse<Vec<Order>> {
    match get_all_orders().await {
        Ok(orders) => success(orders),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve orders due to a database error: {}. Please try again later or contact support if the problem persists.",
            db_error
        ))),
    }
}

// GET /orders/:id - Get order by ID
pub async fn get_order(Path(id): Path<Uuid>) -> ApiResponse<Order> {
    match get_order_by_id(id).await {
        Ok(Some(order)) => success(order),
        Ok(_) => AppResponse::Error(AppError::NotFound(format!(
            "Order with ID {} not found. Please check the order ID and try again.",
            id
        ))),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve order with ID {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            id, db_error
        ))),
    }
}

// GET /orders/:id/details - Get order with all order lines
pub async fn get_order_with_order_lines(Path(id): Path<Uuid>) -> ApiResponse<OrderWithLines> {
    match get_order_with_lines(id).await {
        Ok(Some(order_with_lines)) => success(order_with_lines),
        Ok(_) => AppResponse::Error(AppError::NotFound(format!(
            "Order with ID {} not found. Please check the order ID and try again.",
            id
        ))),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve order details for ID {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            id, db_error
        ))),
    }
}
