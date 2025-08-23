use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

use crate::{
    pool::connect::pool,
    structs::{Order, OrderStatus},
};

pub async fn delete_order(id: Uuid) -> Result<Order, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        UPDATE orders
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING
            id, customer_id, order_number, status,
            subtotal, tax_amount, shipping_cost, discount_amount,
            total_amount, notes, shipping_address, billing_address,
            created_at, updated_at
        "#,
    )
    .bind(OrderStatus::Deleted)
    .bind(id)
    .fetch_one(pool)
    .await?;

    let order = Order {
        id: row.get("id"),
        customer_id: row.get("customer_id"),
        order_number: row.get("order_number"),
        status: row.get("status"),
        subtotal: row.get("subtotal"),
        tax_amount: row.get("tax_amount"),
        shipping_cost: row.get("shipping_cost"),
        discount_amount: row.get("discount_amount"),
        total_amount: row.get("total_amount"),
        notes: row.get("notes"),
        shipping_address: serde_json::from_value(row.get("shipping_address")).map_err(|e| {
            SqlxError::Decode(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
        })?,
        billing_address: serde_json::from_value(row.get("billing_address")).map_err(|e| {
            SqlxError::Decode(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
        })?,
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    };

    Ok(order)
}
