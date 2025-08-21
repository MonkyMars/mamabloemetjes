use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Inventory {
    pub product_id: Uuid,
    pub quantity_on_hand: Decimal,
    pub quantity_reserved: Decimal,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InventoryUpdate {
    pub product_id: Uuid,
    pub quantity_change: Decimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InventoryReservation {
    pub product_id: Uuid,
    pub quantity_to_reserve: Decimal,
}

/// Never used; this is for demonstration purposes only. SQL table.
pub struct DiscountPromotion {
    pub product_ids: Vec<Uuid>, // List of product IDs eligible for the promotion
    pub discount_percentage: Decimal, // Percentage discount applied to eligible products (0-100)
    pub start_date: DateTime<Utc>, // Start date of the promotion
    pub end_date: DateTime<Utc>, // End date of the promotion
    pub created_at: DateTime<Utc>, // When the promotion was created
    pub updated_at: DateTime<Utc>, // When the promotion was last updated
}

impl Inventory {
    /// Calculate available quantity (on_hand - reserved)
    pub fn available_quantity(&self) -> Decimal {
        self.quantity_on_hand - self.quantity_reserved
    }

    /// Check if we have enough available inventory for a given quantity
    pub fn has_sufficient_stock(&self, requested_quantity: Decimal) -> bool {
        self.available_quantity() >= requested_quantity
    }

    /// Reserve inventory for an order
    pub fn reserve_quantity(&mut self, quantity: Decimal) -> Result<(), String> {
        if !self.has_sufficient_stock(quantity) {
            return Err(format!(
                "Insufficient stock. Available: {}, Requested: {}",
                self.available_quantity(),
                quantity
            ));
        }
        self.quantity_reserved += quantity;
        self.updated_at = Utc::now();
        Ok(())
    }

    /// Release reserved inventory (when order is cancelled)
    pub fn release_reservation(&mut self, quantity: Decimal) -> Result<(), String> {
        if self.quantity_reserved < quantity {
            return Err(format!(
                "Cannot release more than reserved. Reserved: {}, Requested: {}",
                self.quantity_reserved, quantity
            ));
        }
        self.quantity_reserved -= quantity;
        self.updated_at = Utc::now();
        Ok(())
    }

    /// Fulfill order (decrease on_hand and reserved quantities)
    pub fn fulfill_order(&mut self, quantity: Decimal) -> Result<(), String> {
        if self.quantity_on_hand < quantity {
            return Err(format!(
                "Insufficient on-hand quantity. On hand: {}, Requested: {}",
                self.quantity_on_hand, quantity
            ));
        }
        if self.quantity_reserved < quantity {
            return Err(format!(
                "Insufficient reserved quantity. Reserved: {}, Requested: {}",
                self.quantity_reserved, quantity
            ));
        }
        self.quantity_on_hand -= quantity;
        self.quantity_reserved -= quantity;
        self.updated_at = Utc::now();
        Ok(())
    }

    /// Add stock to inventory
    pub fn add_stock(&mut self, quantity: Decimal) {
        self.quantity_on_hand += quantity;
        self.updated_at = Utc::now();
    }
}
