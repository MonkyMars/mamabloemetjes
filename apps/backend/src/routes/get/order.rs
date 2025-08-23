use axum::{Extension, extract::Path};
use uuid::Uuid;

use crate::actions::get::{get_order_by_id_and_user, get_orders_by_user};
use crate::actions::post::order::get_order_with_lines_by_user;
use crate::middleware::auth::AuthUser;
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::order::{Order, OrderWithLines};

// GET /api/orders - Get all orders for authenticated user
pub async fn get_orders(Extension(auth_user): Extension<AuthUser>) -> ApiResponse<Vec<Order>> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match get_orders_by_user(user_id).await {
        Ok(orders) => success(orders),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve orders due to a database error: {}. Please try again later or contact support if the problem persists.",
            db_error
        ))),
    }
}

// GET /api/orders/:id - Get order by ID (only if owned by authenticated user)
pub async fn get_order(
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> ApiResponse<Order> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match get_order_by_id_and_user(id, user_id).await {
        Ok(Some(order)) => success(order),
        Ok(_) => AppResponse::Error(AppError::NotFound(format!(
            "Order with ID {} not found or you don't have permission to view it.",
            id
        ))),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve order with ID {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            id, db_error
        ))),
    }
}

// GET /api/orders/:id/details - Get order with all order lines (only if owned by authenticated user)
pub async fn get_order_with_order_lines(
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> ApiResponse<OrderWithLines> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match get_order_with_lines_by_user(id, user_id).await {
        Ok(Some(order_with_lines)) => success(order_with_lines),
        Ok(_) => AppResponse::Error(AppError::NotFound(format!(
            "Order with ID {} not found or you don't have permission to view it.",
            id
        ))),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve order details for ID {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            id, db_error
        ))),
    }
}

// Admin-only routes

// GET /admin/orders - Get all orders (admin only)
pub async fn get_all_orders_admin(
    Extension(auth_user): Extension<AuthUser>,
) -> ApiResponse<Vec<Order>> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match crate::actions::get::get_all_orders().await {
        Ok(orders) => success(orders),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve orders due to a database error: {}. Please try again later or contact support if the problem persists.",
            db_error
        ))),
    }
}

// GET /admin/orders/:id - Get any order by ID (admin only)
pub async fn get_order_admin(
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> ApiResponse<Order> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match crate::actions::get::get_order_by_id(id).await {
        Ok(Some(order)) => success(order),
        Ok(_) => AppResponse::Error(AppError::NotFound(format!(
            "Order with ID {} not found.",
            id
        ))),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve order with ID {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            id, db_error
        ))),
    }
}

// GET /admin/users/:user_id/orders - Get all orders for a specific user (admin only)
pub async fn get_orders_by_user_admin(
    Extension(auth_user): Extension<AuthUser>,
    Path(user_id): Path<Uuid>,
) -> ApiResponse<Vec<Order>> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match get_orders_by_user(user_id).await {
        Ok(orders) => success(orders),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve orders for user {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            user_id, db_error
        ))),
    }
}
