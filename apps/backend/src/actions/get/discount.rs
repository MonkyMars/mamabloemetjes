use crate::pool::connect::pool;
use crate::structs::promotion::{DiscountPromotion, DiscountPromotionWithProducts};
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

/// Get all active discount promotions
pub async fn get_all_active_discounts() -> Result<Vec<DiscountPromotionWithProducts>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT
            dp.id,
            dp.created_at,
            dp.updated_at,
            dp.discount_type,
            dp.discount_value,
            dp.start_date,
            dp.end_date,
            ARRAY_AGG(dpp.product_id) as product_ids
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE NOW() BETWEEN dp.start_date AND dp.end_date
        GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
        ORDER BY dp.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mut promotions = Vec::new();
    for row in rows {
        let promotion = DiscountPromotionWithProducts {
            id: row.get("id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            discount_type: row.get("discount_type"),
            discount_value: row.get("discount_value"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
            product_ids: row.get("product_ids"),
        };
        promotions.push(promotion);
    }

    Ok(promotions)
}

/// Get all discount promotions (active and inactive)
pub async fn get_all_discounts() -> Result<Vec<DiscountPromotionWithProducts>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT
            dp.id,
            dp.created_at,
            dp.updated_at,
            dp.discount_type,
            dp.discount_value,
            dp.start_date,
            dp.end_date,
            ARRAY_AGG(dpp.product_id) as product_ids
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
        ORDER BY dp.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mut promotions = Vec::new();
    for row in rows {
        let promotion = DiscountPromotionWithProducts {
            id: row.get("id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            discount_type: row.get("discount_type"),
            discount_value: row.get("discount_value"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
            product_ids: row.get("product_ids"),
        };
        promotions.push(promotion);
    }

    Ok(promotions)
}

/// Get discount promotion by ID
pub async fn get_discount_by_id(
    discount_id: Uuid,
) -> Result<Option<DiscountPromotionWithProducts>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        SELECT
            dp.id,
            dp.created_at,
            dp.updated_at,
            dp.discount_type,
            dp.discount_value,
            dp.start_date,
            dp.end_date,
            ARRAY_AGG(dpp.product_id) as product_ids
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE dp.id = $1
        GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
        "#,
    )
    .bind(discount_id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let promotion = DiscountPromotionWithProducts {
            id: row.get("id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            discount_type: row.get("discount_type"),
            discount_value: row.get("discount_value"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
            product_ids: row.get("product_ids"),
        };
        Ok(Some(promotion))
    } else {
        Ok(None)
    }
}

/// Get active discounts for specific products
pub async fn get_active_discounts_for_products(
    product_ids: &[Uuid],
) -> Result<Vec<DiscountPromotionWithProducts>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT
            dp.id,
            dp.created_at,
            dp.updated_at,
            dp.discount_type,
            dp.discount_value,
            dp.start_date,
            dp.end_date,
            ARRAY_AGG(dpp.product_id) as product_ids
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE NOW() BETWEEN dp.start_date AND dp.end_date
          AND dpp.product_id = ANY($1)
        GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
        ORDER BY
            CASE
                WHEN dp.discount_type = 'percentage' THEN dp.discount_value
                ELSE 0
            END DESC,
            CASE
                WHEN dp.discount_type = 'fixed_amount' THEN dp.discount_value
                ELSE 0
            END DESC
        "#,
    )
    .bind(product_ids)
    .fetch_all(pool)
    .await?;

    let mut promotions = Vec::new();
    for row in rows {
        let promotion = DiscountPromotionWithProducts {
            id: row.get("id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            discount_type: row.get("discount_type"),
            discount_value: row.get("discount_value"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
            product_ids: row.get("product_ids"),
        };
        promotions.push(promotion);
    }

    Ok(promotions)
}

/// Get the best active discount for a specific product
pub async fn get_best_discount_for_product(
    product_id: Uuid,
) -> Result<Option<DiscountPromotion>, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        SELECT
            dp.id,
            dp.created_at,
            dp.updated_at,
            dp.discount_type,
            dp.discount_value,
            dp.start_date,
            dp.end_date
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE NOW() BETWEEN dp.start_date AND dp.end_date
          AND dpp.product_id = $1
        ORDER BY
            CASE
                WHEN dp.discount_type = 'percentage' THEN dp.discount_value
                ELSE 0
            END DESC,
            CASE
                WHEN dp.discount_type = 'fixed_amount' THEN dp.discount_value
                ELSE 0
            END DESC
        LIMIT 1
        "#,
    )
    .bind(product_id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let promotion = DiscountPromotion {
            id: row.get("id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            discount_type: row.get("discount_type"),
            discount_value: row.get("discount_value"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
        };
        Ok(Some(promotion))
    } else {
        Ok(None)
    }
}

/// Get discounts that will start soon (within next 7 days)
pub async fn get_upcoming_discounts() -> Result<Vec<DiscountPromotionWithProducts>, SqlxError> {
    let pool = pool();

    let rows = sqlx::query(
        r#"
        SELECT
            dp.id,
            dp.created_at,
            dp.updated_at,
            dp.discount_type,
            dp.discount_value,
            dp.start_date,
            dp.end_date,
            ARRAY_AGG(dpp.product_id) as product_ids
        FROM discount_promotions dp
        JOIN discount_promotions_products dpp ON dp.id = dpp.discount_id
        WHERE dp.start_date > NOW()
          AND dp.start_date <= NOW() + INTERVAL '7 days'
        GROUP BY dp.id, dp.created_at, dp.updated_at, dp.discount_type, dp.discount_value, dp.start_date, dp.end_date
        ORDER BY dp.start_date ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mut promotions = Vec::new();
    for row in rows {
        let promotion = DiscountPromotionWithProducts {
            id: row.get("id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            discount_type: row.get("discount_type"),
            discount_value: row.get("discount_value"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
            product_ids: row.get("product_ids"),
        };
        promotions.push(promotion);
    }

    Ok(promotions)
}
