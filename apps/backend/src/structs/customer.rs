use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Customer {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub address: Address,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Address {
    pub street: String,
    pub house_number: String,
    pub postal_code: String, // Dutch format: 1234AB
    pub city: String,
    pub province: String, // Dutch provinces
}
