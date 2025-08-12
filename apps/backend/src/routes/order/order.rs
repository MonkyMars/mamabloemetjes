use axum::Json;

use crate::response::{ApiResponse, AppResponse, success};
use crate::structs::order::Order;
use crate::validate::order::validate_order;

pub async fn order(Json(payload): Json<Order>) -> ApiResponse<Order> {
    // Validate the incoming order
    if let Err(validation_error) = validate_order(&payload) {
        return AppResponse::Error(validation_error);
    }

    // If validation passes, process the order
    // TODO:
    // 1. Save to database
    // 2. Process payment
    // 3. Send confirmation email
    // 4. Update inventory

    // For now, we'll just return the validated order with a generated ID
    let mut processed_order = payload;
    processed_order.id = Some(uuid::Uuid::new_v4());
    processed_order.created_at = Some(chrono::Utc::now().naive_utc());
    processed_order.updated_at = Some(chrono::Utc::now().naive_utc());

    success(processed_order)
}
