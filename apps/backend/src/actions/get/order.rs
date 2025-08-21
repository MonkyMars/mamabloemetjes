use crate::pool::connect::pool;
use crate::structs::order::Order;
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

pub async fn get_all_orders() -> Result<Vec<Order>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT
            id,
            customer_id,
            order_number,
            status,
            subtotal,
            tax_amount,
            shipping_cost,
            discount_amount,
            total_amount,
            notes,
            shipping_address,
            billing_address,
            created_at,
            updated_at
        FROM orders
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mut orders = Vec::new();
    for row in rows {
        let order = Order {
            id: row.try_get("id")?,
            customer_id: row.get("customer_id"),
            order_number: row.get("order_number"),
            status: row.get("status"),
            subtotal: row.get("subtotal"),
            tax_amount: row.get("tax_amount"),
            shipping_cost: row.get("shipping_cost"),
            discount_amount: row.get("discount_amount"),
            total_amount: row.get("total_amount"),
            notes: row.get("notes"),
            shipping_address: serde_json::from_value(row.try_get("shipping_address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            billing_address: serde_json::from_value(row.try_get("billing_address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };
        orders.push(order);
    }

    Ok(orders)
}

pub async fn get_order_by_id(id: Uuid) -> Result<Option<Order>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        SELECT
            id,
            customer_id,
            order_number,
            status,
            subtotal,
            tax_amount,
            shipping_cost,
            discount_amount,
            total_amount,
            notes,
            shipping_address,
            billing_address,
            created_at,
            updated_at
        FROM orders
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let order = Order {
            id: row.try_get("id")?,
            customer_id: row.get("customer_id"),
            order_number: row.get("order_number"),
            status: row.get("status"),
            subtotal: row.get("subtotal"),
            tax_amount: row.get("tax_amount"),
            shipping_cost: row.get("shipping_cost"),
            discount_amount: row.get("discount_amount"),
            total_amount: row.get("total_amount"),
            notes: row.get("notes"),
            shipping_address: serde_json::from_value(row.try_get("shipping_address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            billing_address: serde_json::from_value(row.try_get("billing_address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };
        Ok(Some(order))
    } else {
        Ok(None)
    }
}
