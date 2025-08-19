use axum::Json;

use crate::pool::{get_product_by_id, insert_order, update_inventory};
use crate::response::{ApiResponse, AppResponse, error::AppError, success};
use crate::structs::order::Order;
use crate::validate::order::validate_order;

// 1. Send confirmation email
// 2. Process payment
// 3. Put order in database
// 4. Update inventory
// 5. Send an email to the user with the order details if all has succeeded.

// POST request to order something.
pub async fn order(Json(payload): Json<Order>) -> ApiResponse<Order> {
    // Validate the incoming order
    if let Err(validation_error) = validate_order(&payload) {
        return AppResponse::Error(validation_error);
    }

    // 2. Check if the products exist.
    for content in &payload.content {
        for entry in &content.product {
            if let Err(product_error) = get_product_by_id(entry.product_id).await {
                return AppResponse::Error(AppError::NotFound(format!(
                    "Product with ID {} not found: {}",
                    entry.product_id, product_error
                )));
            }
        }
    }

    // 3. Insert the order into the database
    match insert_order(&payload).await {
        Ok(inserted_order) => {
            // 4. Update inventory
            for product in &inserted_order.content {
                for entry in &product.product {
                    if let Err(inventory_error) =
                        update_inventory(entry.product_id, entry.quantity).await
                    {
                        return AppResponse::Error(AppError::NotEnoughInventory(
                            inventory_error.to_string(),
                        ));
                    }
                }
            }

            success(inserted_order)
        }
        Err(db_error) => AppResponse::Error(AppError::DatabaseError(db_error.to_string())),
    }
}
