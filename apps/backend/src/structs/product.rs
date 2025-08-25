use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::structs::enums::{Colors, ProductType, Size};

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub sku: String, // Stock Keeping Unit for better inventory tracking
    pub price: Decimal,
    pub tax: Decimal,
    pub subtotal: Decimal,
    pub description: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub size: Size,
    pub colors: Vec<Colors>,
    pub product_type: ProductType,
    pub stock: Decimal,
    pub images: Option<Vec<ProductImage>>,
}

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct ProductImage {
    pub product_id: Uuid,
    pub url: String,
    pub alt_text: Option<String>,
    pub is_primary: bool,
}
