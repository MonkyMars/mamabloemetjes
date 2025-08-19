use axum::extract::Path;
use uuid::Uuid;

use crate::pool::{get_all_products, get_product_by_id};
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::product::Product;

// GET /products - Get all products
pub async fn get_products() -> ApiResponse<Vec<Product>> {
    match get_all_products().await {
        Ok(products) => success(products),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(db_error.to_string())),
    }
}

// GET /product/:id - Get order by ID
pub async fn get_product(Path(id): Path<Uuid>) -> ApiResponse<Product> {
    match get_product_by_id(id).await {
        Ok(Some(order)) => success(order),
        Ok(_) => AppResponse::Error(AppError::NotFound("Order not found".to_string())),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(db_error.to_string())),
    }
}
