use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone, Type)]
pub struct Product {
    pub product_id: Option<Uuid>,
    pub name: String,
    pub created_at: Option<DateTime<Utc>>,
    pub price: Decimal,
    pub description: Option<String>,
    pub image_urls: Vec<String>,
}
