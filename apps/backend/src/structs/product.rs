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

impl Product {
    pub fn new(
        name: String,
        price: Decimal,
        description: Option<String>,
        image_urls: Vec<String>,
    ) -> Self {
        Self {
            product_id: None,
            name,
            created_at: None,
            price,
            description,
            image_urls,
        }
    }
}
