use axum::Json;

use crate::pool::insert_order;
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::order::Order;
use crate::validate::order::validate_order;

// POST request to order something.
pub async fn order(Json(payload): Json<Order>) -> ApiResponse<Order> {
    // Validate the incoming order
    if let Err(validation_error) = validate_order(&payload) {
        return AppResponse::Error(validation_error);
    }

    // Insert the order into the database
    match insert_order(&payload).await {
        Ok(inserted_order) => {
            // TODO:
            // 2. Process payment
            // 3. Send confirmation email
            // 4. Update inventory

            success(inserted_order)
        }
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(db_error.to_string())),
    }
}
