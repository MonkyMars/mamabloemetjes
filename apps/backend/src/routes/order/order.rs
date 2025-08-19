use axum::Json;

use crate::pool::{get_product_by_id, insert_order, update_inventory};
use crate::response::{ApiResponse, AppResponse, error::AppError};
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
    if let Err(validation_err) = validate_order(&payload) {
        return AppResponse::Error(validation_err);
    }

    // 2. Check if the products exist.
    for content in &payload.content {
        for entry in &content.product {
            match get_product_by_id(entry.product_id).await {
                Ok(Some(_)) => {
                    // Product exists, continue
                }
                Ok(None) => {
                    return AppResponse::Error(AppError::NotFound(format!(
                        "Product with ID {} does not exist in our catalog. Please check the product ID and try again.",
                        entry.product_id
                    )));
                }
                Err(db_error) => {
                    return AppResponse::Error(AppError::DatabaseError(format!(
                        "Failed to verify product with ID {} due to a database error: {}. Please try again later.",
                        entry.product_id, db_error
                    )));
                }
            }
        }
    }

    // 3. Insert the order into the database
    let inserted_order = match insert_order(&payload).await {
        Ok(order) => order,
        Err(db_error) => {
            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to create order due to a database error: {}. Please try again later or contact support if the problem persists.",
                db_error
            )));
        }
    };

    // 4. Update inventory
    for product in &inserted_order.content {
        for entry in &product.product {
            match update_inventory(entry.product_id, entry.quantity).await {
                Ok(Some(remaining_quantity)) => {
                    if remaining_quantity < 0 {
                        return AppResponse::Error(AppError::ValidationError(format!(
                            "inventory: Insufficient inventory for product {}. Only {} items available, but {} requested.",
                            entry.product_id,
                            remaining_quantity + entry.quantity,
                            entry.quantity
                        )));
                    }
                }
                Ok(None) => {
                    return AppResponse::Error(AppError::NotFound(format!(
                        "Product {} not found in inventory. The product may have been discontinued.",
                        entry.product_id
                    )));
                }
                Err(inventory_error) => {
                    return AppResponse::Error(AppError::DatabaseError(format!(
                        "Failed to update inventory for product {} due to a database error: {}. Your order was created but inventory was not updated. Please contact support.",
                        entry.product_id, inventory_error
                    )));
                }
            }
        }
    }

    AppResponse::Success(inserted_order)
}
