use crate::actions::post::order::create_order_with_lines;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::services::{InventoryService, PricingService};
use crate::structs::inventory::{InventoryReservation, InventoryUpdate};
use crate::structs::order::{IncomingOrder, Order, OrderLine};
use axum::Json;
use rust_decimal::Decimal;
use uuid::Uuid;

pub async fn order(Json(payload): Json<IncomingOrder>) -> ApiResponse<Order> {
    // Step 1: Validate and calculate pricing with discounts
    let pricing_result = match PricingService::calculate_and_validate_pricing(&payload).await {
        AppResponse::Success(result) => result,
        AppResponse::Error(err) => return AppResponse::Error(err),
    };

    // Step 2: Check inventory availability for all products first
    for content in &payload.items {
        for entry in &content.product {
            let quantity = Decimal::from(entry.quantity);
            match InventoryService::check_availability(entry.product_id, quantity).await {
                Ok(true) => continue, // Product has sufficient inventory
                Ok(false) => {
                    return AppResponse::Error(AppError::ValidationError(format!(
                        "Insufficient inventory for product {}. Requested quantity: {}",
                        entry.product_id, entry.quantity
                    )));
                }
                Err(err) => {
                    return AppResponse::Error(AppError::DatabaseError(format!(
                        "Failed to check inventory for product {}: {}",
                        entry.product_id, err
                    )));
                }
            }
        }
    }

    // Step 3: Reserve inventory for all products
    let mut reservations = Vec::new();
    for content in &payload.items {
        for entry in &content.product {
            reservations.push(InventoryReservation {
                product_id: entry.product_id,
                quantity_to_reserve: Decimal::from(entry.quantity),
            });
        }
    }

    if let Err(err) = InventoryService::reserve_inventory(&reservations).await {
        return AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to reserve inventory: {}",
            err
        )));
    }

    // Step 4: Build order with calculated pricing information
    let mut built_order = Order::build_order_with_pricing(&payload, &pricing_result);
    built_order.id = Some(Uuid::new_v4()); // Generate order ID

    // Step 5: Create order lines from the payload
    let mut order_lines = Vec::new();
    for content in &payload.items {
        for entry in &content.product {
            // Get product price from pricing result
            let unit_price = pricing_result
                .products
                .iter()
                .find(|p| p.id == entry.product_id)
                .map(|p| p.discounted_price)
                .unwrap_or_else(|| Decimal::from(0)); // Fallback, should not happen after validation

            let discount_amount = pricing_result
                .products
                .iter()
                .find(|p| p.id == entry.product_id)
                .map(|p| p.original_price - p.discounted_price)
                .unwrap_or_else(|| Decimal::from(0));

            let order_line = OrderLine::new(
                built_order.id.unwrap(),
                entry.product_id,
                Decimal::from(entry.quantity),
                unit_price,
                discount_amount * Decimal::from(entry.quantity), // Total discount for this line
            );
            order_lines.push(order_line);
        }
    }

    // Step 6: Create order and order lines in a single transaction
    let (created_order, created_order_lines) = match create_order_with_lines(
        &built_order,
        &order_lines,
    )
    .await
    {
        Ok(result) => result,
        Err(db_error) => {
            // Rollback: Release reserved inventory
            let inventory_updates: Vec<InventoryUpdate> = reservations
                .into_iter()
                .map(|r| InventoryUpdate {
                    product_id: r.product_id,
                    quantity_change: r.quantity_to_reserve,
                })
                .collect();

            if let Err(rollback_err) =
                InventoryService::release_reservations(&inventory_updates).await
            {
                return AppResponse::Error(AppError::DatabaseError(format!(
                    "Failed to create order AND failed to rollback reservations: Order error: {}, Rollback error: {}",
                    db_error, rollback_err
                )));
            }

            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to create order: {}",
                db_error
            )));
        }
    };

    // Step 7: Fulfill the order (decrease inventory quantities)
    let inventory_updates: Vec<InventoryUpdate> = created_order_lines
        .iter()
        .map(|line| InventoryUpdate {
            product_id: line.product_id,
            quantity_change: line.quantity,
        })
        .collect();

    if let Err(err) = InventoryService::fulfill_order(&inventory_updates).await {
        // This is a critical error - order was created but inventory wasn't updated
        return AppResponse::Error(AppError::DatabaseError(format!(
            "Order created successfully but failed to update inventory. Manual intervention required. Order ID: {:?}, Error: {}",
            created_order.id, err
        )));
    }

    AppResponse::Success(created_order)
}

/// Alternative endpoint for getting pricing information without creating an order
/// Useful for cart calculations and price previews
pub async fn calculate_order_pricing(
    Json(payload): Json<IncomingOrder>,
) -> ApiResponse<crate::services::PricingResult> {
    PricingService::calculate_discounted_pricing(&payload).await
}

/// Endpoint for validating order pricing without discounts
/// Useful for basic order validation
pub async fn validate_order_pricing(
    Json(payload): Json<IncomingOrder>,
) -> ApiResponse<crate::services::PricingResult> {
    PricingService::validate_order_pricing(&payload).await
}

/// Endpoint for checking inventory availability for an order
/// Useful for cart validation before checkout
pub async fn check_order_inventory(
    Json(payload): Json<IncomingOrder>,
) -> ApiResponse<Vec<InventoryAvailability>> {
    let mut availability_results = Vec::new();

    for content in &payload.items {
        for entry in &content.product {
            let quantity = Decimal::from(entry.quantity);

            match InventoryService::get_inventory(entry.product_id).await {
                Ok(Some(inventory)) => {
                    let available = inventory.available_quantity();
                    availability_results.push(InventoryAvailability {
                        product_id: entry.product_id,
                        requested_quantity: quantity,
                        available_quantity: available,
                        is_available: available >= quantity,
                    });
                }
                Ok(_) => {
                    availability_results.push(InventoryAvailability {
                        product_id: entry.product_id,
                        requested_quantity: quantity,
                        available_quantity: Decimal::from(0),
                        is_available: false,
                    });
                }
                Err(err) => {
                    return AppResponse::Error(AppError::DatabaseError(format!(
                        "Failed to check inventory for product {}: {}",
                        entry.product_id, err
                    )));
                }
            }
        }
    }

    AppResponse::Success(availability_results)
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct InventoryAvailability {
    pub product_id: Uuid,
    pub requested_quantity: Decimal,
    pub available_quantity: Decimal,
    pub is_available: bool,
}
