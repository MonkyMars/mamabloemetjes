use crate::pool::connect::pool;
use crate::structs::product::{Product, ProductImage};
use rust_decimal::Decimal;
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

pub async fn get_all_products() -> Result<Vec<Product>, SqlxError> {
    let pool = pool();

    // Single JOIN query to get all products with their images
    let rows = sqlx::query(
        r#"
        SELECT
            p.id,
            p.name,
            p.sku,
            p.price,
            p.tax,
            p.subtotal,
            p.is_active,
            p.description,
            p.created_at,
            p.updated_at,
            p.colors,
            p.size,
            p.product_type,
            pi.product_id AS image_product_id,
            pi.url,
            pi.alt_text,
            pi.is_primary,
            i.quantity_on_hand,
            i.quantity_reserved
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = true
        ORDER BY p.created_at DESC, pi.is_primary DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    // Group results by product
    let mut products_map: std::collections::HashMap<Uuid, Product> =
        std::collections::HashMap::new();
    let mut product_order: Vec<Uuid> = Vec::new();

    for row in rows {
        let product_id = row.get::<Uuid, _>("id");

        // Track order of first appearance to maintain SQL ordering
        if !products_map.contains_key(&product_id) {
            product_order.push(product_id);
        }

        let available_stock: Decimal =
            row.get::<Decimal, _>("quantity_on_hand") - row.get::<Decimal, _>("quantity_reserved");

        // Get or create the product
        let product = products_map.entry(product_id).or_insert_with(|| Product {
            id: product_id,
            name: row.get("name"),
            sku: row.get("sku"),
            price: row.get("price"),
            tax: row.get("tax"),
            subtotal: row.get("subtotal"),
            is_active: row.get("is_active"),
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            colors: row.get("colors"),
            stock: available_stock,
            size: row.get("size"),
            product_type: row.get("product_type"),
            images: Some(Vec::new()),
        });

        // Add image if it exists (LEFT JOIN might return NULL for products without images)
        if let Ok(image_product_id) = row.try_get::<Uuid, _>("image_product_id") {
            if let Some(ref mut images) = product.images {
                images.push(ProductImage {
                    product_id: image_product_id,
                    url: row.get("url"),
                    alt_text: row.get("alt_text"),
                    is_primary: row.get("is_primary"),
                });
            }
        }
    }

    // Convert HashMap to Vec, maintaining the original order from SQL
    let products: Vec<Product> = product_order
        .into_iter()
        .filter_map(|id| products_map.remove(&id))
        .collect();

    Ok(products)
}
