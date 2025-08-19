pub mod connect;

use crate::structs::{
    order::{Order, OrderStatus},
    product::Product,
};
pub use connect::pool;
use serde_json;
use sqlx::Error as SqlxError;
use sqlx::Row;
use uuid::Uuid;

pub async fn insert_order(order: &Order) -> Result<Order, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        INSERT INTO orders (name, email, address, price, content, order_status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, address, price, content, created_at, updated_at, order_status
        "#,
    )
    .bind(&order.name)
    .bind(&order.email)
    .bind(serde_json::to_value(&order.address).map_err(|e| SqlxError::Encode(Box::new(e)))?)
    .bind(&order.price)
    .bind(serde_json::to_value(&order.content).map_err(|e| SqlxError::Encode(Box::new(e)))?)
    .bind(order.order_status.to_string())
    .fetch_one(pool)
    .await?;

    let order = Order {
        id: row.try_get("id")?,
        name: row.try_get("name")?,
        email: row.try_get("email")?,
        address: serde_json::from_value(row.try_get("address")?)
            .map_err(|e| SqlxError::Decode(Box::new(e)))?,
        price: row.try_get("price")?,
        content: serde_json::from_value(row.try_get("content")?)
            .map_err(|e| SqlxError::Decode(Box::new(e)))?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        order_status: OrderStatus::from(row.try_get::<String, _>("order_status")?),
    };

    Ok(order)
}

pub async fn get_order_by_id(id: Uuid) -> Result<Option<Order>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        SELECT id, name, email, address, price, content, created_at, updated_at, order_status
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
            name: row.try_get("name")?,
            email: row.try_get("email")?,
            address: serde_json::from_value(row.try_get("address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            price: row.try_get("price")?,
            content: serde_json::from_value(row.try_get("content")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            order_status: OrderStatus::from(row.try_get::<String, _>("order_status")?),
        };
        Ok(Some(order))
    } else {
        Err(SqlxError::RowNotFound)
    }
}

pub async fn get_all_orders() -> Result<Vec<Order>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT id, name, email, address, price, content, created_at, updated_at, order_status
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
            name: row.try_get("name")?,
            email: row.try_get("email")?,
            address: serde_json::from_value(row.try_get("address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            price: row.try_get("price")?,
            content: serde_json::from_value(row.try_get("content")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            order_status: OrderStatus::from(row.try_get::<String, _>("order_status")?),
        };
        orders.push(order);
    }

    Ok(orders)
}

pub async fn get_all_products() -> Result<Vec<Product>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        "SELECT product_id, name, price, created_at, image_urls, description FROM products ORDER BY created_at DESC"
    ).fetch_all(pool).await?;

    let mut products: Vec<Product> = Vec::new();
    for row in rows {
        // Handle image_urls flexibly - supports both TEXT[] and JSONB
        let image_urls: Vec<String> =
            if let Ok(urls_value) = row.try_get::<serde_json::Value, _>("image_urls") {
                match urls_value {
                    serde_json::Value::Array(arr) => arr
                        .into_iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect(),
                    serde_json::Value::String(s) => {
                        if s.starts_with('{') && s.ends_with('}') {
                            // Handle PostgreSQL array format: {url1,url2,url3}
                            s[1..s.len() - 1]
                                .split(',')
                                .map(|s| s.trim().trim_matches('"').to_string())
                                .filter(|s| !s.is_empty())
                                .collect()
                        } else if !s.is_empty() {
                            vec![s]
                        } else {
                            vec![]
                        }
                    }
                    _ => vec![],
                }
            } else {
                vec![]
            };

        let product = Product {
            product_id: row.try_get("product_id")?,
            name: row.try_get("name")?,
            price: row.try_get("price")?,
            created_at: row.try_get("created_at")?,
            image_urls,
            description: row.try_get("description")?,
        };
        products.push(product);
    }

    Ok(products)
}

pub async fn get_product_by_id(id: Uuid) -> Result<Option<Product>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        "SELECT product_id, name, price, created_at, image_urls, description FROM products WHERE product_id = $1"
    ).bind(id).fetch_optional(pool).await?;

    if let Some(row) = row {
        // Handle image_urls flexibly - supports both TEXT[] and JSONB
        let image_urls: Vec<String> =
            if let Ok(urls_value) = row.try_get::<serde_json::Value, _>("image_urls") {
                match urls_value {
                    serde_json::Value::Array(arr) => arr
                        .into_iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect(),
                    serde_json::Value::String(s) => {
                        if s.starts_with('{') && s.ends_with('}') {
                            // Handle PostgreSQL array format: {url1,url2,url3}
                            s[1..s.len() - 1]
                                .split(',')
                                .map(|s| s.trim().trim_matches('"').to_string())
                                .filter(|s| !s.is_empty())
                                .collect()
                        } else if !s.is_empty() {
                            vec![s]
                        } else {
                            vec![]
                        }
                    }
                    _ => vec![],
                }
            } else {
                vec![]
            };

        let product = Product {
            product_id: row.try_get("product_id")?,
            name: row.try_get("name")?,
            price: row.try_get("price")?,
            created_at: row.try_get("created_at")?,
            image_urls,
            description: row.try_get("description")?,
        };

        Ok(Some(product))
    } else {
        Err(SqlxError::RowNotFound)
    }
}

// Updates the status of an order by its ID
// Returns the updated order if successful, or None if the order was not found
pub async fn update_order_status(
    id: Uuid,
    new_status: OrderStatus,
) -> Result<Option<Order>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        UPDATE orders
        SET order_status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, address, price, content, created_at, updated_at, order_status
        "#,
    )
    .bind(new_status.to_string())
    .bind(id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let order = Order {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            email: row.try_get("email")?,
            address: serde_json::from_value(row.try_get("address")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            price: row.try_get("price")?,
            content: serde_json::from_value(row.try_get("content")?)
                .map_err(|e| SqlxError::Decode(Box::new(e)))?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            order_status: OrderStatus::from(row.try_get::<String, _>("order_status")?),
        };
        Ok(Some(order))
    } else {
        Ok(None)
    }
}

// Update inventory with product id and quantity
// Returns the updated quantity if successful, or None if the product was not found
pub async fn update_inventory(product_id: Uuid, quantity: i32) -> Result<Option<i32>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        UPDATE inventory
        SET quantity = quantity - $1, updated_at = NOW()
        WHERE product_id = $2
        RETURNING quantity
        "#,
    )
    .bind(quantity)
    .bind(product_id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let updated_quantity: i32 = row.try_get("quantity")?;
        Ok(Some(updated_quantity))
    } else {
        Ok(None)
    }
}
