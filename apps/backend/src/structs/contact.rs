use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::structs::enums::ContactMethod;

#[derive(FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct ContactForm {
    pub id: Option<Uuid>,
    pub name: String,
    pub email: String,
    pub message: String,
    pub phone: Option<String>,
    pub product_id: Option<Uuid>,
    pub occasion: Option<String>,
    pub preferred_contact_method: ContactMethod,
    pub created_at: Option<DateTime<Utc>>,
}
