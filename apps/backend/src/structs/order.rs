use crate::structs::{Address, OrderStatus};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// All orders come from authenticated users, so we don't need to store user_id.
#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct IncomingOrder {
    pub customer_id: Uuid,
    pub price: Decimal,
    pub items: Vec<OrderContent>,
    pub shipping_address: Address,
    pub billing_address: Address,
    pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProductEntry {
    pub product_id: Uuid,

    pub quantity: i32,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct OrderContent {
    pub product: Vec<ProductEntry>,
}

// ==== ORDER ==== //
#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Order {
    pub id: Option<Uuid>,
    pub customer_id: Uuid,
    pub order_number: String, // Human-readable order number
    pub status: OrderStatus,
    pub subtotal: Decimal,   // Sum of all line items
    pub tax_amount: Decimal, // BTW (21%)
    pub shipping_cost: Decimal,
    pub discount_amount: Decimal,
    pub total_amount: Decimal, // Final amount after tax, shipping, discounts
    pub notes: Option<String>,
    pub shipping_address: Address,
    pub billing_address: Address,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct OrderLine {
    pub id: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub order_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal, // Price per unit at time of order
    pub discount_amount: Decimal,
}

impl OrderLine {
    /// Calculate line total (quantity * unit_price - discount_amount)
    pub fn calculate_line_total(&self) -> Decimal {
        (self.quantity * self.unit_price) - self.discount_amount
    }

    /// Create a new OrderLine
    pub fn new(
        order_id: Uuid,
        product_id: Uuid,
        quantity: Decimal,
        unit_price: Decimal,
        discount_amount: Decimal,
    ) -> Self {
        Self {
            id: None,
            created_at: chrono::Utc::now(),
            order_id,
            product_id,
            quantity,
            unit_price,
            discount_amount,
        }
    }
}

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct OrderWithLines {
    pub order: Order,
    pub order_lines: Vec<OrderLine>,
}

impl OrderWithLines {
    pub fn new(order: Order, order_lines: Vec<OrderLine>) -> Self {
        Self { order, order_lines }
    }

    /// Calculate total from order lines and verify it matches the order total
    pub fn validate_totals(&self) -> bool {
        let calculated_total: Decimal = self
            .order_lines
            .iter()
            .map(|line| line.calculate_line_total())
            .sum();

        // Add tax and shipping, subtract overall discounts
        let expected_total = calculated_total + self.order.tax_amount + self.order.shipping_cost;

        expected_total == self.order.total_amount
    }

    /// Get the total quantity of items in this order
    pub fn total_quantity(&self) -> Decimal {
        self.order_lines.iter().map(|line| line.quantity).sum()
    }

    /// Get the subtotal from order lines (before tax and shipping)
    pub fn calculated_subtotal(&self) -> Decimal {
        self.order_lines
            .iter()
            .map(|line| line.calculate_line_total())
            .sum()
    }
}
