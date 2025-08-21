use crate::pool::connect::pool;
use crate::structs::product::{Product, ProductImage};
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

pub async fn get_all_products() -> Result<Vec<Product>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        "SELECT id, name, sku, price, description, created_at, updated_at, description FROM products WHERE is_active = true ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?;

    let mut products = Vec::new();
    for row in rows {
        let id = row.get::<Uuid, _>("product_id");
        let images = sqlx::query(
            "SELECT product_id, url, alt_text, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC",
        )
        .bind(id)
        .fetch_all(pool)
        .await?;

        let product = Product {
            id: id,
            name: row.get("name"),
            sku: row.get("sku"),
            price: row.get("price"),
            is_active: true, // Assuming all products fetched are active
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            images: Some(
                images
                    .into_iter()
                    .map(|img| ProductImage {
                        product_id: img.get("product_id"),
                        url: img.get("url"),
                        alt_text: img.get("alt_text"),
                        is_primary: img.get("is_primary"),
                    })
                    .collect(),
            ),
        };
        products.push(product);
    }

    Ok(products)
}

pub async fn get_product_by_id(id: Uuid) -> Result<Option<Product>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        "SELECT id, name, sku, price, description, created_at, updated_at FROM products WHERE id = $1 AND is_active = true",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let images = sqlx::query(
            "SELECT product_id, url, alt_text, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC",
        )
        .bind(id)
        .fetch_all(pool)
        .await?;

        let product = Product {
            id: row.get("id"),
            name: row.get("name"),
            sku: row.get("sku"),
            price: row.get("price"),
            is_active: true, // Assuming the product is active
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            images: Some(
                images
                    .into_iter()
                    .map(|img| ProductImage {
                        product_id: img.get("product_id"),
                        url: img.get("url"),
                        alt_text: img.get("alt_text"),
                        is_primary: img.get("is_primary"),
                    })
                    .collect(),
            ),
        };
        Ok(Some(product))
    } else {
        Ok(None)
    }
}
