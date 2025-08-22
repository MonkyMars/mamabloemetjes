use crate::pool::connect::pool;
use crate::structs::product::{Product, ProductImage};
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

pub async fn get_all_products() -> Result<Vec<Product>, SqlxError> {
    let pool = pool();

    // Single JOIN query to get all products with their images
    let rows = sqlx::query(
        r#"
        SELECT
            p.id, p.name, p.sku, p.price, p.description, p.created_at, p.updated_at, p.colors, p.size, p.product_type,
            pi.product_id as image_product_id, pi.url, pi.alt_text, pi.is_primary
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
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

        // Get or create the product
        let product = products_map.entry(product_id).or_insert_with(|| Product {
            id: product_id,
            name: row.get("name"),
            sku: row.get("sku"),
            price: row.get("price"),
            is_active: true,
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            colors: row.get("colors"),
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

pub async fn get_product_by_id(id: Uuid) -> Result<Option<Product>, SqlxError> {
    let pool = pool();

    // Use JOIN for single product too for consistency and performance
    let rows = sqlx::query(
        r#"
        SELECT
            p.id, p.name, p.sku, p.price, p.description, p.created_at, p.updated_at, p.colors, p.size, p.product_type,
            pi.product_id as image_product_id, pi.url, pi.alt_text, pi.is_primary
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.id = $1 AND p.is_active = true
        ORDER BY pi.is_primary DESC
        "#,
    )
    .bind(id)
    .fetch_all(pool)
    .await?;

    if rows.is_empty() {
        return Ok(None);
    }

    let first_row = &rows[0];
    let mut images = Vec::new();

    // Extract product data first
    let product_id = first_row.get("id");
    let name = first_row.get("name");
    let sku = first_row.get("sku");
    let colors = first_row.get("colors");
    let size = first_row.get("size");
    let product_type = first_row.get("product_type");
    let price = first_row.get("price");
    let description = first_row.get("description");
    let created_at = first_row.get("created_at");
    let updated_at = first_row.get("updated_at");

    for row in rows {
        // Add image if it exists
        if let Ok(image_product_id) = row.try_get::<Uuid, _>("image_product_id") {
            images.push(ProductImage {
                product_id: image_product_id,
                url: row.get("url"),
                alt_text: row.get("alt_text"),
                is_primary: row.get("is_primary"),
            });
        }
    }

    let product = Product {
        id: product_id,
        name,
        sku,
        price,
        is_active: true,
        description,
        product_type,
        created_at,
        updated_at,
        colors,
        size,
        images: if images.is_empty() {
            None
        } else {
            Some(images)
        },
    };

    Ok(Some(product))
}
