use crate::pool::connect::pool;
use crate::response::{AppError, AppResult};
use crate::structs::UpdateUser;
use chrono::Utc;

pub async fn update_account_info_by_id(updated_user: UpdateUser) -> AppResult<UpdateUser> {
    let pool = pool();

    // First, check if the user exists
    let user_exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)")
            .bind(&updated_user.id)
            .fetch_one(pool)
            .await
            .map_err(|e| {
                AppError::DatabaseError(format!("Failed to check user existence: {}", e))
            })?;

    if !user_exists {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    // Validate email uniqueness if email is being updated
    if let Some(ref email) = updated_user.email {
        let email_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)",
        )
        .bind(email)
        .bind(&updated_user.id)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to check email uniqueness: {}", e)))?;

        if email_exists {
            return Err(AppError::Conflict(
                "Email address is already in use".to_string(),
            ));
        }
    }

    // Update the user
    let updated = sqlx::query_as::<_, UpdateUser>(
        r#"
        UPDATE users
        SET
            email = COALESCE($1, email),
            first_name = COALESCE($2, first_name),
            preposition = COALESCE($3, preposition),
            last_name = COALESCE($4, last_name),
            role = COALESCE($5, role),
            email_verified = COALESCE($6, email_verified),
            updated_at = $7
        WHERE id = $8
        RETURNING id, email, first_name, preposition, last_name, role, email_verified
        "#,
    )
    .bind(&updated_user.email)
    .bind(&updated_user.first_name)
    .bind(&updated_user.preposition)
    .bind(&updated_user.last_name)
    .bind(&updated_user.role)
    .bind(&updated_user.email_verified)
    .bind(Utc::now())
    .bind(&updated_user.id)
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => AppError::NotFound("User not found".to_string()),
        sqlx::Error::Database(db_err) => {
            if db_err.constraint().is_some() {
                AppError::Conflict("Data constraint violation".to_string())
            } else {
                AppError::DatabaseError(format!("Failed to update user: {}", db_err))
            }
        }
        _ => AppError::DatabaseError(format!("Database error during user update: {}", e)),
    })?;

    Ok(updated)
}
