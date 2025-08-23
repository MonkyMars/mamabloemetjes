use crate::actions::get::get_order_by_id_and_user;
use crate::actions::get::order_line::get_order_lines;
use crate::middleware::auth::AuthUser;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::structs::order::OrderLine;
use axum::{Extension, extract::Path};
use uuid::Uuid;

/// Get all order lines for a specific order (only if owned by authenticated user)
pub async fn get_order_lines_by_order_id(
    Extension(auth_user): Extension<AuthUser>,
    Path(order_id): Path<Uuid>,
) -> ApiResponse<Vec<OrderLine>> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // First verify that the user owns this order
    match get_order_by_id_and_user(order_id, user_id).await {
        Ok(Some(_)) => {
            // User owns the order, proceed to get order lines
        }
        Ok(_) => {
            return AppResponse::Error(AppError::NotFound(format!(
                "Order {} not found or you don't have permission to view it",
                order_id
            )));
        }
        Err(e) => {
            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to verify order ownership: {}",
                e
            )));
        }
    }

    // Get the order lines
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

/// Admin-only endpoint to get order lines for any order
pub async fn get_order_lines_by_order_id_admin(
    Extension(auth_user): Extension<AuthUser>,
    Path(order_id): Path<Uuid>,
) -> ApiResponse<Vec<OrderLine>> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    // Get the order lines (no ownership check for admin)
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
