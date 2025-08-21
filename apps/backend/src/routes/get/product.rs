use axum::extract::Path;
use uuid::Uuid;

use crate::actions::get::{get_all_products, get_product_by_id};
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::product::Product;

// GET /products - Get all products
pub async fn get_products() -> ApiResponse<Vec<Product>> {
    match get_all_products().await {
        Ok(products) => success(products),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve products due to a database error: {}. Please try again later or contact support if the problem persists.",
            db_error
        ))),
    }
}

// // GET /product/:id - Get product by ID
pub async fn get_product(Path(id): Path<Uuid>) -> ApiResponse<Product> {
    match get_product_by_id(id).await {
        Ok(Some(product)) => success(product),
        Ok(_) => AppResponse::Error(AppError::NotFound(format!(
            "Product with ID {} not found. Please check the product ID and try again.",
            id
        ))),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve product with ID {} due to a database error: {}. Please try again later or contact support if the problem persists.",
            id, db_error
        ))),
    }
}
