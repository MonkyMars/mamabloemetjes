pub mod connect;

use crate::structs::order::Order;
pub use connect::pool;
use sqlx::Error as SqlxError;
use uuid::Uuid;

pub async fn insert_order(order: &Order) -> Result<Order, SqlxError> {
    let pool = pool();

    let query = r#"
        INSERT INTO orders (name, email, address, price, content, order_status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, address, price, content, created_at, updated_at, order_status
    "#;

    let row = sqlx::query_as::<_, Order>(query)
        .bind(&order.name)
        .bind(&order.email)
        .bind(sqlx::types::Json(&order.address))
        .bind(order.price)
        .bind(sqlx::types::Json(&order.content))
        .bind(&order.order_status)
        .fetch_one(&pool)
        .await?;

    Ok(row)
}

pub async fn get_order_by_id(id: Uuid) -> Result<Option<Order>, SqlxError> {
    let pool = pool();

    let query = "SELECT id, name, email, address, price, content, created_at, updated_at, order_status FROM orders WHERE id = $1";

    let row = sqlx::query_as::<_, Order>(query)
        .bind(id)
        .fetch_optional(&pool)
        .await?;

    Ok(row)
}

pub async fn get_all_orders() -> Result<Vec<Order>, SqlxError> {
    let pool = pool();

    let query = "SELECT id, name, email, address, price, content, created_at, updated_at, order_status FROM orders ORDER BY created_at DESC";

    let rows = sqlx::query_as::<_, Order>(query).fetch_all(&pool).await?;

    Ok(rows)
}
