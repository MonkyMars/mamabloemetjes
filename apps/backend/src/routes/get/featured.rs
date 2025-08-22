use crate::actions::get::get_all_featured_products;
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::product::Product;

// GET /products/featured - Get all products
pub async fn get_featured_products() -> ApiResponse<Vec<Product>> {
    match get_all_featured_products().await {
        Ok(products) => success(products),
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to retrieve products due to a database error: {}. Please try again later or contact support if the problem persists.",
            db_error
        ))),
    }
}
