use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Cart {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
}

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct CartItem {
    pub id: Uuid,
    pub cart_id: Uuid,
    pub product_id: Uuid,
    pub quantity: i32,
    pub unit_price_cents: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CartWithItems {
    pub cart: Cart,
    pub items: Vec<CartItem>,
}

impl CartWithItems {
    pub fn new(cart: Cart, items: Vec<CartItem>) -> Self {
        Self { cart, items }
    }

    pub fn total_cents(&self) -> i32 {
        self.items
            .iter()
            .map(|item| item.quantity * item.unit_price_cents)
            .sum()
    }

    pub fn total_quantity(&self) -> i32 {
        self.items.iter().map(|item| item.quantity).sum()
    }
}

#[derive(Deserialize, Debug)]
pub struct AddCartItemRequest {
    pub product_id: Uuid,
    pub quantity: i32,
}

#[derive(Deserialize, Debug)]
pub struct UpdateCartItemRequest {
    pub quantity: i32,
}

#[derive(Deserialize, Debug)]
pub struct GuestCartItem {
    pub product_id: Uuid,
    pub quantity: i32,
}

#[derive(Deserialize, Debug)]
pub struct MergeCartRequest {
    pub items: Vec<GuestCartItem>,
}

#[derive(Serialize, Debug)]
pub struct CartResponse {
    pub cart: Cart,
    pub items: Vec<CartItemWithProduct>,
}

#[derive(FromRow, Serialize, Debug)]
pub struct CartItemWithProduct {
    pub id: Uuid,
    pub cart_id: Uuid,
    pub product_id: Uuid,
    pub quantity: i32,
    pub unit_price_cents: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
    pub product_name: String,
    pub product_sku: String,
}

impl CartResponse {
    pub fn new(cart: Cart, items: Vec<CartItemWithProduct>) -> Self {
        Self { cart, items }
    }

    pub fn total_cents(&self) -> i32 {
        self.items
            .iter()
            .map(|item| item.quantity * item.unit_price_cents)
            .sum()
    }

    pub fn total_quantity(&self) -> i32 {
        self.items.iter().map(|item| item.quantity).sum()
    }
}
