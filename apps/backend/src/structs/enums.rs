use serde::{Deserialize, Serialize};
use sqlx::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Eq, PartialEq, Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
}

#[derive(Serialize, Deserialize, Debug, Clone, Eq, PartialEq, Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "lowercase")]
pub enum Colors {
    Red,
    Blue,
    Green,
    Yellow,
    Black,
    White,
    Purple,
    Orange,
    Pink,
}

#[derive(Serialize, Deserialize, Debug, Clone, Eq, PartialEq, Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "lowercase")]
pub enum Size {
    Small,
    Medium,
    Large,
    ExtraLarge,
}

#[derive(Serialize, Deserialize, Debug, Clone, Eq, PartialEq, Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "lowercase")]
pub enum ProductType {
    Bouquet,
    Flower,
}
