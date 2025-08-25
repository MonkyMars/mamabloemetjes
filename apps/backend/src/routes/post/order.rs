use crate::actions;
use crate::actions::post::order::{create_order_with_lines, get_order_with_lines};
use crate::middleware::auth::AuthUser;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::services::{InventoryService, PricingResult, PricingService};
use crate::structs::inventory::{InventoryReservation, InventoryUpdate};
use crate::structs::order::{IncomingOrder, Order, OrderLine};
use crate::structs::{Address, OrderContent, OrderStatus};
use crate::validate::structs::validate_user_id;
use crate::validate::{validate_address, validate_complete_order};
use axum::{Extension, Json};
use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(serde::Deserialize, Debug, Clone)]
pub struct AuthenticatedOrderRequest {
    pub price: Decimal,
    pub items: Vec<OrderContent>,
    pub shipping_address: Address,
    pub billing_address: Address,
    pub notes: Option<String>,
}

pub async fn order(
    Extension(auth_user): Extension<AuthUser>,
    Json(payload): Json<AuthenticatedOrderRequest>,
) -> ApiResponse<Order> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Build IncomingOrder with authenticated user_id
    let incoming_order = IncomingOrder {
        user_id,
        price: payload.price,
        items: payload.items,
        shipping_address: payload.shipping_address,
        billing_address: payload.billing_address,
        notes: payload.notes,
    };

    // Step 1: Validate and calculate pricing with discounts
    let pricing_result = match PricingService::calculate_and_validate_pricing(&incoming_order).await
    {
        AppResponse::Success(result) => result,
        AppResponse::Error(err) => return AppResponse::Error(err),
    };

    if let Err(err) = validate_complete_order(&incoming_order) {
        return AppResponse::Error(AppError::ValidationError(format!(
            "Order validation failed: {}",
            err
        )));
    }

    if let Err(err) = validate_address(&incoming_order.shipping_address) {
        return AppResponse::Error(AppError::ValidationError(format!(
            "Shipping address validation failed: {}",
            err
        )));
    }

    if let Err(err) = validate_address(&incoming_order.billing_address) {
        return AppResponse::Error(AppError::ValidationError(format!(
            "Billing address validation failed: {}",
            err
        )));
    }

    if let Err(err) = validate_user_id(&incoming_order.user_id) {
        return AppResponse::Error(AppError::ValidationError(format!(
            "Customer ID validation failed: {}",
            err
        )));
    }

    // Step 2: Check inventory availability for all products first
    for content in &incoming_order.items {
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

    // Step 3: Reserve inventory for all products (STAGE 1: Order Placement)
    // This marks items as "spoken for" but keeps them in warehouse until shipment
    let mut reservations = Vec::new();
    for content in &incoming_order.items {
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
    let mut built_order = Order::build_order_with_pricing(&incoming_order, &pricing_result);
    built_order.id = Some(Uuid::new_v4()); // Generate order ID

    // Step 5: Create order lines from the payload
    let mut order_lines = Vec::new();
    for content in &incoming_order.items {
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
    let (created_order, _created_order_lines) = match create_order_with_lines(
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
                    "Failed to create order AND failed to rollback inventory reservations: Order error: {}, Rollback error: {}",
                    db_error, rollback_err
                )));
            }

            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to create order: {}",
                db_error
            )));
        }
    };

    // Order placed successfully!
    // - Inventory is reserved (quantity_reserved increased)
    // - Items remain in warehouse (quantity_on_hand unchanged)
    // - Available inventory decreased (on_hand - reserved)
    // - Order ready for shipment via POST /order/ship
    AppResponse::Success(created_order)
}

/// Alternative endpoint for getting pricing information without creating an order
/// Useful for cart calculations and price previews
pub async fn calculate_order_pricing(
    Extension(auth_user): Extension<AuthUser>,
    Json(payload): Json<AuthenticatedOrderRequest>,
) -> ApiResponse<PricingResult> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Build IncomingOrder with authenticated user_id
    let incoming_order = IncomingOrder {
        user_id,
        price: payload.price,
        items: payload.items,
        shipping_address: payload.shipping_address,
        billing_address: payload.billing_address,
        notes: payload.notes,
    };

    PricingService::calculate_discounted_pricing(&incoming_order).await
}

/// Endpoint for validating order pricing without discounts
/// Useful for basic order validation
pub async fn validate_order_pricing(
    Extension(auth_user): Extension<AuthUser>,
    Json(payload): Json<AuthenticatedOrderRequest>,
) -> ApiResponse<PricingResult> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Build IncomingOrder with authenticated user_id
    let incoming_order = IncomingOrder {
        user_id,
        price: payload.price,
        items: payload.items,
        shipping_address: payload.shipping_address,
        billing_address: payload.billing_address,
        notes: payload.notes,
    };

    PricingService::validate_order_pricing(&incoming_order).await
}

/// Cancel an order (STAGE 2 ALT: Release reservations - when order is cancelled)
/// This releases reserved inventory back to available stock
/// Only the order owner can cancel their order
pub async fn cancel_order(
    Extension(auth_user): Extension<AuthUser>,
    Json(order_id): Json<Uuid>,
) -> ApiResponse<String> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Get order details and verify ownership
    let order_with_lines = match get_order_with_lines(order_id).await {
        Ok(Some(order_data)) => {
            // Check if the authenticated user owns this order
            if order_data.order.user_id != user_id {
                return AppResponse::Error(AppError::Forbidden(
                    "You can only cancel your own orders".to_string(),
                ));
            }
            order_data
        }
        Ok(_) => {
            return AppResponse::Error(AppError::NotFound(format!(
                "Order with ID {} not found",
                order_id
            )));
        }
        Err(err) => {
            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to retrieve order {}: {}",
                order_id, err
            )));
        }
    };

    // Check if order can be cancelled (only pending/processing orders)
    if !matches!(
        order_with_lines.order.status,
        OrderStatus::Pending | OrderStatus::Processing
    ) {
        return AppResponse::Error(AppError::BadRequest(format!(
            "Order {} cannot be cancelled. Current status: {:?}",
            order_id, order_with_lines.order.status
        )));
    }

    // Create inventory updates for releasing reservations
    let inventory_updates: Vec<InventoryUpdate> = order_with_lines
        .order_lines
        .iter()
        .map(|line| InventoryUpdate {
            product_id: line.product_id,
            quantity_change: line.quantity,
        })
        .collect();

    // Release the reserved inventory
    if let Err(err) = InventoryService::release_reservations(&inventory_updates).await {
        return AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to cancel order {}: {}",
            order_id, err
        )));
    }

    // Update order status to "Cancelled"
    if let Err(err) = actions::update::update_order_status(order_id, OrderStatus::Cancelled).await {
        return AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to update order status for {}: {}",
            order_id, err
        )));
    }

    AppResponse::Success(format!("Order {} cancelled successfully", order_id))
}

/// Endpoint for checking inventory availability for an order
/// Useful for cart validation before checkout
/// Admin only endpoint
pub async fn check_order_inventory(
    Extension(auth_user): Extension<AuthUser>,
    Json(payload): Json<AuthenticatedOrderRequest>,
) -> ApiResponse<Vec<InventoryAvailability>> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

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

/// Ship an order (STAGE 2: Order Fulfillment - when order physically leaves warehouse)
/// This decreases both on_hand and reserved quantities
/// Admin only endpoint
pub async fn ship_order(
    Extension(auth_user): Extension<AuthUser>,
    Json(order_id): Json<Uuid>,
) -> ApiResponse<String> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    // Get order details
    let order_with_lines = match get_order_with_lines(order_id).await {
        Ok(Some(order_data)) => order_data,
        Ok(_) => {
            return AppResponse::Error(AppError::NotFound(format!(
                "Order with ID {} not found",
                order_id
            )));
        }
        Err(err) => {
            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to retrieve order {}: {}",
                order_id, err
            )));
        }
    };

    // Check if order can be shipped (only processing orders)
    if !matches!(order_with_lines.order.status, OrderStatus::Processing) {
        return AppResponse::Error(AppError::BadRequest(format!(
            "Order {} cannot be shipped. Current status: {:?}",
            order_id, order_with_lines.order.status
        )));
    }

    // Create inventory updates for fulfillment
    let inventory_updates: Vec<InventoryUpdate> = order_with_lines
        .order_lines
        .iter()
        .map(|line| InventoryUpdate {
            product_id: line.product_id,
            quantity_change: line.quantity,
        })
        .collect();

    // Fulfill the order (decrease both on_hand and reserved)
    if let Err(err) = InventoryService::fulfill_order(&inventory_updates).await {
        return AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to ship order {}: {}",
            order_id, err
        )));
    }

    if let Err(err) = actions::update::update_order_status(order_id, OrderStatus::Shipped).await {
        return AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to update order status for {}: {}",
            order_id, err
        )));
    }

    AppResponse::Success(format!("Order {} shipped successfully", order_id))
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct InventoryAvailability {
    pub product_id: Uuid,
    pub requested_quantity: Decimal,
    pub available_quantity: Decimal,
    pub is_available: bool,
}
