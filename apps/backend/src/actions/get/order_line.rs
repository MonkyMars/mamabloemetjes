use crate::pool::connect::pool;
use crate::structs::order::OrderLine;
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

/// Get order lines for a specific order
pub async fn get_order_lines(order_id: Uuid) -> Result<Vec<OrderLine>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT id, created_at, order_id, product_id, quantity, unit_price, discount_amount
        FROM order_line
        WHERE order_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(order_id)
    .fetch_all(pool)
    .await?;

    let order_lines = rows
        .into_iter()
        .map(|row| OrderLine {
            id: row.get("id"),
            created_at: row.get("created_at"),
            order_id: row.get("order_id"),
            product_id: row.get("product_id"),
            quantity: row.get("quantity"),
            unit_price: row.get("unit_price"),
            discount_amount: row.get("discount_amount"),
        })
        .collect();

    Ok(order_lines)
}
