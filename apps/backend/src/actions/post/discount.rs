use crate::pool::connect::pool;
use crate::structs::promotion::{
    CreateDiscountPromotion, DiscountPromotion, DiscountPromotionProduct,
};
use chrono::Utc;
use sqlx::Error as SqlxError;
use uuid::Uuid;

/// Create a new discount promotion
pub async fn create_discount_promotion(
    discount_data: CreateDiscountPromotion,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;

    // Validate the discount data
    if let Err(validation_error) = discount_data.validate() {
        return Err(SqlxError::Protocol(validation_error));
    }

    // Create the discount promotion
    let discount_id = Uuid::new_v4();
    let now = Utc::now();

    let discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        INSERT INTO discount_promotions (
            id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(discount_id)
    .bind(now)
    .bind(now)
    .bind(&discount_data.discount_type)
    .bind(discount_data.discount_value)
    .bind(discount_data.start_date)
    .bind(discount_data.end_date)
    .fetch_one(&mut *tx)
    .await?;

    // Add product associations
    for product_id in &discount_data.product_ids {
        sqlx::query(
            r#"
            INSERT INTO discount_promotions_products (discount_id, product_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(discount_id)
        .bind(product_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(discount)
}

/// Add products to an existing discount promotion
pub async fn add_products_to_discount(
    discount_id: Uuid,
    product_ids: Vec<Uuid>,
) -> Result<Vec<DiscountPromotionProduct>, SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;

    let mut added_products = Vec::new();

    for product_id in product_ids {
        // Check if the association already exists
        let exists = sqlx::query_scalar::<_, bool>(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM discount_promotions_products
                WHERE discount_id = $1 AND product_id = $2
            )
            "#,
        )
        .bind(discount_id)
        .bind(product_id)
        .fetch_one(&mut *tx)
        .await?;

        if !exists {
            sqlx::query(
                r#"
                INSERT INTO discount_promotions_products (discount_id, product_id)
                VALUES ($1, $2)
                "#,
            )
            .bind(discount_id)
            .bind(product_id)
            .execute(&mut *tx)
            .await?;

            added_products.push(DiscountPromotionProduct {
                discount_id,
                product_id,
            });
        }
    }

    // Update the discount promotion's updated_at timestamp
    sqlx::query(
        r#"
        UPDATE discount_promotions
        SET updated_at = $1
        WHERE id = $2
        "#,
    )
    .bind(Utc::now())
    .bind(discount_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(added_products)
}

/// Remove products from an existing discount promotion
pub async fn remove_products_from_discount(
    discount_id: Uuid,
    product_ids: Vec<Uuid>,
) -> Result<usize, SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;

    let result = sqlx::query(
        r#"
        DELETE FROM discount_promotions_products
        WHERE discount_id = $1 AND product_id = ANY($2)
        "#,
    )
    .bind(discount_id)
    .bind(&product_ids)
    .execute(&mut *tx)
    .await?;

    // Update the discount promotion's updated_at timestamp
    sqlx::query(
        r#"
        UPDATE discount_promotions
        SET updated_at = $1
        WHERE id = $2
        "#,
    )
    .bind(Utc::now())
    .bind(discount_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(result.rows_affected() as usize)
}

/// Update an existing discount promotion
pub async fn update_discount_promotion(
    discount_id: Uuid,
    discount_type: Option<String>,
    discount_value: Option<rust_decimal::Decimal>,
    start_date: Option<chrono::DateTime<Utc>>,
    end_date: Option<chrono::DateTime<Utc>>,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    // Build dynamic query based on provided fields
    let mut query_parts = Vec::new();
    let mut bind_index = 2; // Start from 2 since $1 is the ID

    if discount_type.is_some() {
        query_parts.push(format!("discount_type = ${}", bind_index));
        bind_index += 1;
    }
    if discount_value.is_some() {
        query_parts.push(format!("discount_value = ${}", bind_index));
        bind_index += 1;
    }
    if start_date.is_some() {
        query_parts.push(format!("start_date = ${}", bind_index));
        bind_index += 1;
    }
    if end_date.is_some() {
        query_parts.push(format!("end_date = ${}", bind_index));
        bind_index += 1;
    }

    query_parts.push(format!("updated_at = ${}", bind_index));

    let query_str = format!(
        r#"
        UPDATE discount_promotions
        SET {}
        WHERE id = $1
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
        query_parts.join(", ")
    );

    let mut query = sqlx::query_as::<_, DiscountPromotion>(&query_str).bind(discount_id);

    if let Some(dt) = discount_type {
        query = query.bind(dt);
    }
    if let Some(dv) = discount_value {
        query = query.bind(dv);
    }
    if let Some(sd) = start_date {
        query = query.bind(sd);
    }
    if let Some(ed) = end_date {
        query = query.bind(ed);
    }

    query = query.bind(Utc::now());

    let updated_discount = query.fetch_one(pool).await?;
    Ok(updated_discount)
}

/// Delete a discount promotion and all its product associations
pub async fn delete_discount_promotion(discount_id: Uuid) -> Result<bool, SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;

    // Delete product associations first (due to foreign key constraint)
    sqlx::query(
        r#"
        DELETE FROM discount_promotions_products
        WHERE discount_id = $1
        "#,
    )
    .bind(discount_id)
    .execute(&mut *tx)
    .await?;

    // Delete the discount promotion
    let result = sqlx::query(
        r#"
        DELETE FROM discount_promotions
        WHERE id = $1
        "#,
    )
    .bind(discount_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(result.rows_affected() > 0)
}

/// Deactivate expired discount promotions
pub async fn deactivate_expired_discounts() -> Result<usize, SqlxError> {
    let pool = pool();

    // This is a cleanup function - in practice, expired discounts are filtered out by date queries
    // But we could add an 'is_active' field if needed for soft deletion
    let result = sqlx::query(
        r#"
        DELETE FROM discount_promotions
        WHERE end_date < NOW()
        "#,
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() as usize)
}

/// Bulk create discount promotions for multiple products
pub async fn bulk_create_discount_for_products(
    product_ids: Vec<Uuid>,
    discount_type: String,
    discount_value: rust_decimal::Decimal,
    start_date: chrono::DateTime<Utc>,
    end_date: chrono::DateTime<Utc>,
) -> Result<DiscountPromotion, SqlxError> {
    let create_data = CreateDiscountPromotion {
        product_ids,
        discount_type,
        discount_value,
        start_date,
        end_date,
    };

    create_discount_promotion(create_data).await
}
