use crate::pool::connect::pool;
use crate::structs::promotion::DiscountPromotion;
use chrono::Utc;
use rust_decimal::Decimal;
use sqlx::Error as SqlxError;
use uuid::Uuid;

/// Update discount promotion details
pub async fn update_discount_promotion(
    discount_id: Uuid,
    discount_type: Option<String>,
    discount_value: Option<Decimal>,
    start_date: Option<chrono::DateTime<Utc>>,
    end_date: Option<chrono::DateTime<Utc>>,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    // Get current values first
    let current = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        SELECT id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        FROM discount_promotions
        WHERE id = $1
        "#,
    )
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    // Use provided values or keep current ones
    let new_discount_type = discount_type.unwrap_or(current.discount_type);
    let new_discount_value = discount_value.unwrap_or(current.discount_value);
    let new_start_date = start_date.unwrap_or(current.start_date);
    let new_end_date = end_date.unwrap_or(current.end_date);

    // Validate discount type
    if new_discount_type != "percentage" && new_discount_type != "fixed_amount" {
        return Err(SqlxError::Protocol("Invalid discount type".to_string()));
    }

    // Validate discount value
    if new_discount_value <= Decimal::ZERO {
        return Err(SqlxError::Protocol(
            "Discount value must be greater than 0".to_string(),
        ));
    }

    if new_discount_type == "percentage" && new_discount_value > Decimal::from(100) {
        return Err(SqlxError::Protocol(
            "Percentage discount cannot exceed 100%".to_string(),
        ));
    }

    // Validate dates
    if new_start_date >= new_end_date {
        return Err(SqlxError::Protocol(
            "Start date must be before end date".to_string(),
        ));
    }

    // Update the discount promotion
    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET discount_type = $1, discount_value = $2, start_date = $3, end_date = $4, updated_at = $5
        WHERE id = $6
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(new_discount_type)
    .bind(new_discount_value)
    .bind(new_start_date)
    .bind(new_end_date)
    .bind(Utc::now())
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}

/// Update only the discount value
pub async fn update_discount_value(
    discount_id: Uuid,
    new_value: Decimal,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    if new_value <= Decimal::ZERO {
        return Err(SqlxError::Protocol(
            "Discount value must be greater than 0".to_string(),
        ));
    }

    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET discount_value = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(new_value)
    .bind(Utc::now())
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}

/// Update discount dates
pub async fn update_discount_dates(
    discount_id: Uuid,
    start_date: chrono::DateTime<Utc>,
    end_date: chrono::DateTime<Utc>,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    if start_date >= end_date {
        return Err(SqlxError::Protocol(
            "Start date must be before end date".to_string(),
        ));
    }

    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET start_date = $1, end_date = $2, updated_at = $3
        WHERE id = $4
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(start_date)
    .bind(end_date)
    .bind(Utc::now())
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}

/// Extend discount end date
pub async fn extend_discount_end_date(
    discount_id: Uuid,
    new_end_date: chrono::DateTime<Utc>,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET end_date = $1, updated_at = $2
        WHERE id = $3 AND start_date < $1
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(new_end_date)
    .bind(Utc::now())
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}

/// Update discount type (percentage <-> fixed_amount)
pub async fn update_discount_type(
    discount_id: Uuid,
    new_type: String,
    new_value: Decimal,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    if new_type != "percentage" && new_type != "fixed_amount" {
        return Err(SqlxError::Protocol("Invalid discount type".to_string()));
    }

    if new_value <= Decimal::ZERO {
        return Err(SqlxError::Protocol(
            "Discount value must be greater than 0".to_string(),
        ));
    }

    if new_type == "percentage" && new_value > Decimal::from(100) {
        return Err(SqlxError::Protocol(
            "Percentage discount cannot exceed 100%".to_string(),
        ));
    }

    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET discount_type = $1, discount_value = $2, updated_at = $3
        WHERE id = $4
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(new_type)
    .bind(new_value)
    .bind(Utc::now())
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}

/// Bulk update multiple discount promotions
pub async fn bulk_update_discount_values(
    discount_updates: Vec<(Uuid, Decimal)>,
) -> Result<Vec<DiscountPromotion>, SqlxError> {
    let pool = pool();
    let mut tx = pool.begin().await?;
    let mut updated_discounts = Vec::new();

    for (discount_id, new_value) in discount_updates {
        if new_value <= Decimal::ZERO {
            continue; // Skip invalid values
        }

        let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
            r#"
            UPDATE discount_promotions
            SET discount_value = $1, updated_at = $2
            WHERE id = $3
            RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
            "#,
        )
        .bind(new_value)
        .bind(Utc::now())
        .bind(discount_id)
        .fetch_one(&mut *tx)
        .await?;

        updated_discounts.push(updated_discount);
    }

    tx.commit().await?;
    Ok(updated_discounts)
}

/// Pause a discount (set end_date to now)
pub async fn pause_discount(discount_id: Uuid) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();
    let now = Utc::now();

    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET end_date = $1, updated_at = $1
        WHERE id = $2 AND end_date > $1
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(now)
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}

/// Reactivate a paused discount (extend end_date)
pub async fn reactivate_discount(
    discount_id: Uuid,
    new_end_date: chrono::DateTime<Utc>,
) -> Result<DiscountPromotion, SqlxError> {
    let pool = pool();

    let updated_discount = sqlx::query_as::<_, DiscountPromotion>(
        r#"
        UPDATE discount_promotions
        SET end_date = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, created_at, updated_at, discount_type, discount_value, start_date, end_date
        "#,
    )
    .bind(new_end_date)
    .bind(Utc::now())
    .bind(discount_id)
    .fetch_one(pool)
    .await?;

    Ok(updated_discount)
}
