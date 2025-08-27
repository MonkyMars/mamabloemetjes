use crate::pool::connect::pool;
use crate::structs::product::{Product, ProductImage};
use rust_decimal::Decimal;
use sqlx::{Error as SqlxError, Row};
use std::collections::HashMap;
use uuid::Uuid;

pub async fn get_all_featured_products() -> Result<Vec<Product>, SqlxError> {
    let pool = pool();

    // Fetch products with images, inventory, and highest active discount
    let rows = sqlx::query(
        r#"
        SELECT
            p.id AS product_id,
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
            i.quantity_reserved,
            -- Calculate highest active discount
            COALESCE((
                SELECT
                    CASE
                        WHEN dp.discount_type = 'percentage' THEN ROUND(p.price - (p.price * dp.discount_value / 100), 2)
                        ELSE p.price - dp.discount_value
                    END
                FROM discount_promotions_products dpp
                JOIN discount_promotions dp ON dp.id = dpp.discount_id
                WHERE dpp.product_id = p.id
                  AND now() BETWEEN dp.start_date AND dp.end_date
                ORDER BY
                    CASE
                        WHEN dp.discount_type = 'percentage' THEN p.price * dp.discount_value / 100
                        ELSE dp.discount_value
                    END DESC
                LIMIT 1
            ), p.price) AS discounted_price
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        JOIN featured_products fp ON p.id = fp.product_id
        JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = true
        ORDER BY p.created_at DESC, pi.is_primary DESC
        LIMIT 8
        "#
    )
    .fetch_all(pool)
    .await?;

    let mut products_map: HashMap<Uuid, Product> = HashMap::new();
    let mut product_order: Vec<Uuid> = Vec::new();

    for row in rows {
        let product_id = row.get::<Uuid, _>("product_id");

        if !products_map.contains_key(&product_id) {
            product_order.push(product_id);
        }

        let available_stock: Decimal = (row.get::<Decimal, _>("quantity_on_hand")
            - row.get::<Decimal, _>("quantity_reserved"))
        .max(Decimal::ZERO);

        // Get or create the product
        let product = products_map.entry(product_id).or_insert_with(|| Product {
            id: product_id,
            name: row.get("name"),
            sku: row.get("sku"),
            price: row.get("price"),
            discounted_price: row.get("discounted_price"),
            tax: row.get("tax"),
            subtotal: row.get("subtotal"),
            is_active: row.get("is_active"),
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            stock: available_stock,
            colors: row.get("colors"),
            size: row.get("size"),
            product_type: row.get("product_type"),
            images: Some(Vec::new()),
        });

        // Add images
        if let Ok(image_product_id) = row.try_get::<Uuid, _>("image_product_id") {
            if let Some(ref mut images) = product.images {
                if !images
                    .iter()
                    .any(|img| img.url == row.get::<String, _>("url"))
                {
                    images.push(ProductImage {
                        product_id: image_product_id,
                        url: row.get("url"),
                        alt_text: row.get("alt_text"),
                        is_primary: row.get("is_primary"),
                    });
                }
            }
        }
    }

    // Convert HashMap to Vec maintaining SQL order
    let products: Vec<Product> = product_order
        .into_iter()
        .filter_map(|id| products_map.remove(&id))
        .collect();

    Ok(products)
}
