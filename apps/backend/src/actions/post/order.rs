use crate::pool::connect::pool;
use crate::structs::order::{Order, OrderLine};
use sqlx::{Error as SqlxError, Row};
use std::error::Error;
use uuid::Uuid;

pub async fn post_order(order: &Order) -> Result<Order, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        INSERT INTO orders (
            id, user_id, order_number, status,
            subtotal, tax_amount, shipping_cost, discount_amount,
            total_amount, notes, shipping_address, billing_address,
            created_at, updated_at
        )
        VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14
        )
        RETURNING
            id, user_id, order_number, status,
            subtotal, tax_amount, shipping_cost, discount_amount,
            total_amount, notes, shipping_address, billing_address,
            created_at, updated_at
        "#,
    )
    .bind(order.id)
    .bind(order.user_id)
    .bind(&order.order_number)
    .bind(order.status.to_string())
    .bind(&order.subtotal)
    .bind(&order.tax_amount)
    .bind(&order.shipping_cost)
    .bind(&order.discount_amount)
    .bind(&order.total_amount)
    .bind(&order.notes)
    .bind(
        serde_json::to_value(&order.shipping_address)
            .map_err(|e| SqlxError::Encode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
    )
    .bind(
        serde_json::to_value(&order.billing_address)
            .map_err(|e| SqlxError::Encode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
    )
    .bind(order.created_at)
    .bind(order.updated_at)
    .fetch_one(pool)
    .await?;

    let order = Order {
        id: row.get("id"),
        user_id: row.get("user_id"),
        order_number: row.get("order_number"),
        status: row.get("status"),
        subtotal: row.get("subtotal"),
        tax_amount: row.get("tax_amount"),
        shipping_cost: row.get("shipping_cost"),
        discount_amount: row.get("discount_amount"),
        total_amount: row.get("total_amount"),
        notes: row.get("notes"),
        shipping_address: serde_json::from_value(row.get("shipping_address"))
            .map_err(|e| SqlxError::Decode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
        billing_address: serde_json::from_value(row.get("billing_address"))
            .map_err(|e| SqlxError::Decode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    };

    Ok(order)
}

pub async fn post_order_line(order_line: &OrderLine) -> Result<OrderLine, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        INSERT INTO order_line (
            order_id, product_id, quantity, unit_price, discount_amount, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at, order_id, product_id, quantity, unit_price, discount_amount
        "#,
    )
    .bind(order_line.order_id)
    .bind(order_line.product_id)
    .bind(order_line.quantity)
    .bind(order_line.unit_price)
    .bind(order_line.discount_amount)
    .bind(order_line.created_at)
    .fetch_one(pool)
    .await?;

    Ok(OrderLine {
        id: row.get("id"),
        created_at: row.get("created_at"),
        order_id: row.get("order_id"),
        product_id: row.get("product_id"),
        quantity: row.get("quantity"),
        unit_price: row.get("unit_price"),
        discount_amount: row.get("discount_amount"),
    })
}

pub async fn post_order_lines(order_lines: &[OrderLine]) -> Result<Vec<OrderLine>, SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;
    let mut created_lines = Vec::new();

    for order_line in order_lines {
        let row = sqlx::query(
            r#"
            INSERT INTO order_line (
                order_id, product_id, quantity, unit_price, discount_amount, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, created_at, order_id, product_id, quantity, unit_price, discount_amount
            "#,
        )
        .bind(order_line.order_id)
        .bind(order_line.product_id)
        .bind(order_line.quantity)
        .bind(order_line.unit_price)
        .bind(order_line.discount_amount)
        .bind(order_line.created_at)
        .fetch_one(&mut *tx)
        .await?;

        created_lines.push(OrderLine {
            id: row.get("id"),
            created_at: row.get("created_at"),
            order_id: row.get("order_id"),
            product_id: row.get("product_id"),
            quantity: row.get("quantity"),
            unit_price: row.get("unit_price"),
            discount_amount: row.get("discount_amount"),
        });
    }

    tx.commit().await?;
    Ok(created_lines)
}

/// Create complete order with order lines in a single transaction
pub async fn create_order_with_lines(
    order: &Order,
    order_lines: &[OrderLine],
) -> Result<(Order, Vec<OrderLine>), SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;

    // Insert the order
    let order_row = sqlx::query(
        r#"
        INSERT INTO orders (
            id, user_id, order_number, status,
            subtotal, tax_amount, shipping_cost, discount_amount,
            total_amount, notes, shipping_address, billing_address,
            created_at, updated_at
        )
        VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14
        )
        RETURNING
            id, user_id, order_number, status,
            subtotal, tax_amount, shipping_cost, discount_amount,
            total_amount, notes, shipping_address, billing_address,
            created_at, updated_at
        "#,
    )
    .bind(order.id)
    .bind(order.user_id)
    .bind(&order.order_number)
    .bind(order.status.to_string())
    .bind(&order.subtotal)
    .bind(&order.tax_amount)
    .bind(&order.shipping_cost)
    .bind(&order.discount_amount)
    .bind(&order.total_amount)
    .bind(&order.notes)
    .bind(
        serde_json::to_value(&order.shipping_address)
            .map_err(|e| SqlxError::Encode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
    )
    .bind(
        serde_json::to_value(&order.billing_address)
            .map_err(|e| SqlxError::Encode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
    )
    .bind(order.created_at)
    .bind(order.updated_at)
    .fetch_one(&mut *tx)
    .await?;

    let created_order = Order {
        id: order_row.get("id"),
        user_id: order_row.get("user_id"),
        order_number: order_row.get("order_number"),
        status: order_row.get("status"),
        subtotal: order_row.get("subtotal"),
        tax_amount: order_row.get("tax_amount"),
        shipping_cost: order_row.get("shipping_cost"),
        discount_amount: order_row.get("discount_amount"),
        total_amount: order_row.get("total_amount"),
        notes: order_row.get("notes"),
        shipping_address: serde_json::from_value(order_row.get("shipping_address"))
            .map_err(|e| SqlxError::Decode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
        billing_address: serde_json::from_value(order_row.get("billing_address"))
            .map_err(|e| SqlxError::Decode(Box::new(e) as Box<dyn Error + Send + Sync>))?,
        created_at: order_row.get("created_at"),
        updated_at: order_row.get("updated_at"),
    };

    // Insert order lines
    let mut created_lines = Vec::new();
    for order_line in order_lines {
        let line_row = sqlx::query(
            r#"
            INSERT INTO order_line (
                order_id, product_id, quantity, unit_price, discount_amount, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, created_at, order_id, product_id, quantity, unit_price, discount_amount
            "#,
        )
        .bind(order_line.order_id)
        .bind(order_line.product_id)
        .bind(order_line.quantity)
        .bind(order_line.unit_price)
        .bind(order_line.discount_amount)
        .bind(order_line.created_at)
        .fetch_one(&mut *tx)
        .await?;

        created_lines.push(OrderLine {
            id: line_row.get("id"),
            created_at: line_row.get("created_at"),
            order_id: line_row.get("order_id"),
            product_id: line_row.get("product_id"),
            quantity: line_row.get("quantity"),
            unit_price: line_row.get("unit_price"),
            discount_amount: line_row.get("discount_amount"),
        });
    }

    tx.commit().await?;
    Ok((created_order, created_lines))
}

/// Get order with all its order lines
pub async fn get_order_with_lines(
    order_id: Uuid,
) -> Result<Option<crate::structs::order::OrderWithLines>, SqlxError> {
    use crate::actions::get::get_order_by_id;
    use crate::actions::get::order_line::get_order_lines;

    // Get the order first
    let order = match get_order_by_id(order_id).await? {
        Some(order) => order,
        _ => return Ok(None),
    };

    // Get the order lines
    let order_lines = get_order_lines(order_id).await?;

    Ok(Some(crate::structs::order::OrderWithLines::new(
        order,
        order_lines,
    )))
}

pub async fn get_order_with_lines_by_user(
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Option<crate::structs::order::OrderWithLines>, SqlxError> {
    use crate::actions::get::get_order_by_id_and_user;
    use crate::actions::get::order_line::get_order_lines;

    // Get the order first (only if owned by user)
    let order = match get_order_by_id_and_user(order_id, user_id).await? {
        Some(order) => order,
        _ => return Ok(None),
    };

    // Get the order lines
    let order_lines = get_order_lines(order_id).await?;

    Ok(Some(crate::structs::order::OrderWithLines::new(
        order,
        order_lines,
    )))
}
