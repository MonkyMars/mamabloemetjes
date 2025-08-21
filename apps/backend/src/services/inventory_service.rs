use crate::pool::connect::pool;
use crate::response::error::AppError;
use crate::structs::inventory::{Inventory, InventoryReservation, InventoryUpdate};
use rust_decimal::Decimal;
use sqlx::Row;
use uuid::Uuid;

/// Service for handling inventory operations
pub struct InventoryService;

impl InventoryService {
    /// Check if we have sufficient inventory for a product
    pub async fn check_availability(
        product_id: Uuid,
        requested_quantity: Decimal,
    ) -> Result<bool, AppError> {
        let pool = pool();

        let row = sqlx::query(
            "SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE product_id = $1",
        )
        .bind(product_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!(
                "Failed to check inventory for product {}: {}",
                product_id, e
            ))
        })?;

        match row {
            Some(row) => {
                let quantity_on_hand: Decimal = row.get("quantity_on_hand");
                let quantity_reserved: Decimal = row.get("quantity_reserved");
                let available = quantity_on_hand - quantity_reserved;
                Ok(available >= requested_quantity)
            }
            _ => Ok(false), // Product not found in inventory
        }
    }

    /// Reserve inventory for an order (increase quantity_reserved)
    pub async fn reserve_inventory(reservations: &[InventoryReservation]) -> Result<(), AppError> {
        let pool = pool();
        let mut tx = pool
            .begin()
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to start transaction: {}", e)))?;

        for reservation in reservations {
            // First, check if we have enough available inventory
            let row = sqlx::query(
                "SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE product_id = $1 FOR UPDATE",
            )
            .bind(reservation.product_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| {
                AppError::DatabaseError(format!(
                    "Failed to check inventory for product {}: {}",
                    reservation.product_id, e
                ))
            })?;

            match row {
                Some(row) => {
                    let quantity_on_hand: Decimal = row.get("quantity_on_hand");
                    let quantity_reserved: Decimal = row.get("quantity_reserved");
                    let available = quantity_on_hand - quantity_reserved;

                    if available < reservation.quantity_to_reserve {
                        tx.rollback().await.ok();
                        return Err(AppError::ValidationError(format!(
                            "Insufficient inventory for product {}. Available: {}, Requested: {}",
                            reservation.product_id, available, reservation.quantity_to_reserve
                        )));
                    }

                    // Reserve the inventory
                    sqlx::query(
                        "UPDATE inventory SET quantity_reserved = quantity_reserved + $1, updated_at = NOW() WHERE product_id = $2",
                    )
                    .bind(reservation.quantity_to_reserve)
                    .bind(reservation.product_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        AppError::DatabaseError(format!(
                            "Failed to reserve inventory for product {}: {}",
                            reservation.product_id, e
                        ))
                    })?;
                }
                _ => {
                    tx.rollback().await.ok();
                    return Err(AppError::NotFound(format!(
                        "Product {} not found in inventory",
                        reservation.product_id
                    )));
                }
            }
        }

        tx.commit().await.map_err(|e| {
            AppError::DatabaseError(format!("Failed to commit inventory reservations: {}", e))
        })?;

        Ok(())
    }

    /// Fulfill order (decrease both quantity_on_hand and quantity_reserved)
    pub async fn fulfill_order(updates: &[InventoryUpdate]) -> Result<(), AppError> {
        let pool = pool();
        let mut tx = pool
            .begin()
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to start transaction: {}", e)))?;

        for update in updates {
            // Update inventory: decrease both on_hand and reserved quantities
            let result = sqlx::query(
                r#"
                UPDATE inventory
                SET
                    quantity_on_hand = quantity_on_hand - $1,
                    quantity_reserved = quantity_reserved - $1,
                    updated_at = NOW()
                WHERE product_id = $2
                AND quantity_on_hand >= $1
                AND quantity_reserved >= $1
                "#,
            )
            .bind(update.quantity_change)
            .bind(update.product_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                AppError::DatabaseError(format!(
                    "Failed to fulfill order for product {}: {}",
                    update.product_id, e
                ))
            })?;

            if result.rows_affected() == 0 {
                tx.rollback().await.ok();
                return Err(AppError::ValidationError(format!(
                    "Cannot fulfill order for product {}. Insufficient inventory or reservation.",
                    update.product_id
                )));
            }
        }

        tx.commit().await.map_err(|e| {
            AppError::DatabaseError(format!("Failed to commit inventory fulfillment: {}", e))
        })?;

        Ok(())
    }

    /// Release reserved inventory (when order is cancelled)
    pub async fn release_reservations(updates: &[InventoryUpdate]) -> Result<(), AppError> {
        let pool = pool();
        let mut tx = pool
            .begin()
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to start transaction: {}", e)))?;

        for update in updates {
            sqlx::query(
                "UPDATE inventory SET quantity_reserved = quantity_reserved - $1, updated_at = NOW() WHERE product_id = $2",
            )
            .bind(update.quantity_change)
            .bind(update.product_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                AppError::DatabaseError(format!(
                    "Failed to release reservation for product {}: {}",
                    update.product_id, e
                ))
            })?;
        }

        tx.commit().await.map_err(|e| {
            AppError::DatabaseError(format!("Failed to commit reservation release: {}", e))
        })?;

        Ok(())
    }

    /// Get current inventory for a product
    pub async fn get_inventory(product_id: Uuid) -> Result<Option<Inventory>, AppError> {
        let pool = pool();

        let row = sqlx::query(
            "SELECT product_id, quantity_on_hand, quantity_reserved, updated_at FROM inventory WHERE product_id = $1",
        )
        .bind(product_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!(
                "Failed to get inventory for product {}: {}",
                product_id, e
            ))
        })?;

        match row {
            Some(row) => Ok(Some(Inventory {
                product_id: row.get("product_id"),
                quantity_on_hand: row.get("quantity_on_hand"),
                quantity_reserved: row.get("quantity_reserved"),
                updated_at: row.get("updated_at"),
            })),
            _ => Ok(None),
        }
    }

    /// Add inventory for a product (used for restocking)
    pub async fn add_inventory(
        product_id: Uuid,
        quantity_to_add: Decimal,
    ) -> Result<Inventory, AppError> {
        let pool = pool();
        let mut tx = pool
            .begin()
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to start transaction: {}", e)))?;

        // Try to update existing inventory first
        let result = sqlx::query(
            "UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, updated_at = NOW() WHERE product_id = $2",
        )
        .bind(quantity_to_add)
        .bind(product_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!("Failed to update inventory: {}", e))
        })?;

        if result.rows_affected() == 0 {
            // Product doesn't exist in inventory table, insert new record
            sqlx::query(
                "INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, updated_at) VALUES ($1, $2, 0, NOW())",
            )
            .bind(product_id)
            .bind(quantity_to_add)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                AppError::DatabaseError(format!("Failed to insert inventory record: {}", e))
            })?;
        }

        // Get the updated inventory
        let row = sqlx::query(
            "SELECT product_id, quantity_on_hand, quantity_reserved, updated_at FROM inventory WHERE product_id = $1",
        )
        .bind(product_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!("Failed to fetch updated inventory: {}", e))
        })?;

        let inventory = Inventory {
            product_id: row.get("product_id"),
            quantity_on_hand: row.get("quantity_on_hand"),
            quantity_reserved: row.get("quantity_reserved"),
            updated_at: row.get("updated_at"),
        };

        tx.commit().await.map_err(|e| {
            AppError::DatabaseError(format!("Failed to commit inventory addition: {}", e))
        })?;

        Ok(inventory)
    }

    /// Initialize inventory for a new product
    pub async fn initialize_inventory(
        product_id: Uuid,
        initial_quantity: Decimal,
    ) -> Result<(), AppError> {
        let pool = pool();

        sqlx::query(
            "INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, updated_at) VALUES ($1, $2, 0, NOW()) ON CONFLICT (product_id) DO NOTHING",
        )
        .bind(product_id)
        .bind(initial_quantity)
        .execute(pool)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!("Failed to initialize inventory: {}", e))
        })?;

        Ok(())
    }

    /// Get low stock products (below threshold)
    pub async fn get_low_stock_products(
        threshold: Decimal,
    ) -> Result<Vec<LowStockProduct>, AppError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT
                i.product_id,
                p.name,
                p.sku,
                i.quantity_on_hand,
                i.quantity_reserved,
                (i.quantity_on_hand - i.quantity_reserved) as available_quantity
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE (i.quantity_on_hand - i.quantity_reserved) <= $1 AND p.is_active = true
            ORDER BY (i.quantity_on_hand - i.quantity_reserved) ASC
            "#,
        )
        .bind(threshold)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!("Failed to fetch low stock products: {}", e))
        })?;

        let products = rows
            .into_iter()
            .map(|row| LowStockProduct {
                product_id: row.get("product_id"),
                name: row.get("name"),
                sku: row.get("sku"),
                quantity_on_hand: row.get("quantity_on_hand"),
                quantity_reserved: row.get("quantity_reserved"),
                available_quantity: row.get("available_quantity"),
            })
            .collect();

        Ok(products)
    }

    /// Get all inventory with low stock alert
    pub async fn get_inventory_status() -> Result<Vec<InventoryStatus>, AppError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT
                i.product_id,
                p.name,
                p.sku,
                i.quantity_on_hand,
                i.quantity_reserved,
                (i.quantity_on_hand - i.quantity_reserved) as available_quantity,
                i.updated_at
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE p.is_active = true
            ORDER BY p.name ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch inventory status: {}", e)))?;

        let inventory_status = rows
            .into_iter()
            .map(|row| InventoryStatus {
                product_id: row.get("product_id"),
                name: row.get("name"),
                sku: row.get("sku"),
                quantity_on_hand: row.get("quantity_on_hand"),
                quantity_reserved: row.get("quantity_reserved"),
                available_quantity: row.get("available_quantity"),
                updated_at: row.get("updated_at"),
            })
            .collect();

        Ok(inventory_status)
    }
}

/// Information about a product with low stock
#[derive(Debug, Clone)]
pub struct LowStockProduct {
    pub product_id: Uuid,
    pub name: String,
    pub sku: String,
    pub quantity_on_hand: Decimal,
    pub quantity_reserved: Decimal,
    pub available_quantity: Decimal,
}

/// Complete inventory status for a product
#[derive(Debug, Clone)]
pub struct InventoryStatus {
    pub product_id: Uuid,
    pub name: String,
    pub sku: String,
    pub quantity_on_hand: Decimal,
    pub quantity_reserved: Decimal,
    pub available_quantity: Decimal,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}
