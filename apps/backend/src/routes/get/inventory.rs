use crate::response::{ApiResponse, AppResponse};
use crate::services::InventoryService;
use axum::extract::Path;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Get inventory status for a specific product
pub async fn get_inventory_by_product(
    Path(product_id): Path<Uuid>,
) -> ApiResponse<Option<InventoryDebugInfo>> {
    match InventoryService::get_inventory(product_id).await {
        Ok(Some(inventory)) => {
            let debug_info = InventoryDebugInfo {
                product_id: inventory.product_id,
                quantity_on_hand: inventory.quantity_on_hand,
                quantity_reserved: inventory.quantity_reserved,
                available_quantity: inventory.available_quantity(),
                updated_at: inventory.updated_at,
            };
            AppResponse::Success(Some(debug_info))
        }
        Ok(None) => AppResponse::Success(None),
        Err(err) => AppResponse::Error(err),
    }
}

/// Get inventory status for all products
pub async fn get_all_inventory() -> ApiResponse<Vec<InventoryDebugInfo>> {
    match InventoryService::get_inventory_status().await {
        Ok(inventory_status) => {
            let debug_info: Vec<InventoryDebugInfo> = inventory_status
                .into_iter()
                .map(|status| InventoryDebugInfo {
                    product_id: status.product_id,
                    quantity_on_hand: status.quantity_on_hand,
                    quantity_reserved: status.quantity_reserved,
                    available_quantity: status.available_quantity,
                    updated_at: status.updated_at,
                })
                .collect();
            AppResponse::Success(debug_info)
        }
        Err(err) => AppResponse::Error(err),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryDebugInfo {
    pub product_id: Uuid,
    pub quantity_on_hand: rust_decimal::Decimal,
    pub quantity_reserved: rust_decimal::Decimal,
    pub available_quantity: rust_decimal::Decimal,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}
