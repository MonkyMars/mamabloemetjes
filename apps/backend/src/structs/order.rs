use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;


#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Order {
    pub id: Option<Uuid>,

    pub name: String,

    pub email: String,

    pub address: Address,

    pub price: f64,

    pub content: Vec<OrderContent>,

    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,

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

    pub state: String,

    pub zip: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum OrderStatus {
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
}
