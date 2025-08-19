use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Order {
    pub id: Option<Uuid>,
    pub name: String,
    pub email: String,
    pub address: Address,
    pub price: Decimal,
    pub content: Vec<OrderContent>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub order_status: OrderStatus,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProductEntry {
    pub product_id: Uuid,

    pub count: i32,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct OrderContent {
    pub product_ids: Vec<ProductEntry>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Address {
    pub street: String,

    pub city: String,

    pub province: String,

    pub zip: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
}

impl std::fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let status = match self {
            OrderStatus::Pending => "pending",
            OrderStatus::Processing => "processing",
            OrderStatus::Shipped => "shipped",
            OrderStatus::Delivered => "delivered",
            OrderStatus::Cancelled => "cancelled",
        };
        write!(f, "{}", status)
    }
}

impl From<String> for OrderStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "pending" => OrderStatus::Pending,
            "processing" => OrderStatus::Processing,
            "shipped" => OrderStatus::Shipped,
            "delivered" => OrderStatus::Delivered,
            "cancelled" => OrderStatus::Cancelled,
            _ => OrderStatus::Pending,
        }
    }
}

impl Order {
    pub fn new(
        id: Option<Uuid>,
        name: String,
        email: String,
        address: Address,
        price: Decimal,
        content: Vec<OrderContent>,
        created_at: Option<DateTime<Utc>>,
        updated_at: Option<DateTime<Utc>>,
        order_status: OrderStatus,
    ) -> Self {
        Self {
            id,
            name,
            email,
            address,
            price,
            content,
            created_at,
            updated_at,
            order_status,
        }
    }
}
