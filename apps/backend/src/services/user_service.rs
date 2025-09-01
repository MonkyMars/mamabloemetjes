use crate::actions::update::account::update_account_info_by_id;
use crate::pool::connect::pool;
use crate::response::{AppError, AppResult};
use crate::services::auth::AuthService;
use crate::structs::jwt::UserRole;
use crate::structs::user::UpdateUser;
use crate::validate::auth::{validate_email, validate_password};
use chrono::Utc;
use uuid::Uuid;

pub struct UserService;

impl UserService {
    /// Update user account information
    pub async fn update_account(updated_user: UpdateUser) -> AppResult<UpdateUser> {
        // Validate email format if provided
        if let Some(ref email) = updated_user.email {
            if let Err(e) = validate_email(email) {
                return Err(AppError::ValidationError(e));
            }
        }

        // Validate name fields if provided
        if let Some(ref first_name) = updated_user.first_name {
            if first_name.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "First name cannot be empty".to_string(),
                ));
            }
        }

        if let Some(ref last_name) = updated_user.last_name {
            if last_name.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "Last name cannot be empty".to_string(),
                ));
            }
        }

        update_account_info_by_id(updated_user).await
    }

    /// Get user by ID
    pub async fn get_user_by_id(user_id: Uuid) -> AppResult<UpdateUser> {
        let pool = pool();

        let user = sqlx::query_as::<_, UpdateUser>(
            r#"
            SELECT id, email, first_name, preposition, last_name, role, email_verified
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("User not found".to_string()),
            _ => AppError::DatabaseError(format!("Failed to fetch user: {}", e)),
        })?;

        Ok(user)
    }

    /// Get user by email
    pub async fn get_user_by_email(email: &str) -> AppResult<UpdateUser> {
        let pool = pool();

        let user = sqlx::query_as::<_, UpdateUser>(
            r#"
            SELECT id, email, first_name, preposition, last_name, role, email_verified
            FROM users
            WHERE email = $1
            "#,
        )
        .bind(email)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("User not found".to_string()),
            _ => AppError::DatabaseError(format!("Failed to fetch user: {}", e)),
        })?;

        Ok(user)
    }

    /// Update user role (admin only operation)
    pub async fn update_user_role(user_id: Uuid, new_role: UserRole) -> AppResult<()> {
        let pool = pool();

        // Check if user exists
        let user_exists =
            sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(|e| {
                    AppError::DatabaseError(format!("Failed to check user existence: {}", e))
                })?;

        if !user_exists {
            return Err(AppError::NotFound("User not found".to_string()));
        }

        sqlx::query(
            r#"
            UPDATE users
            SET role = $1, updated_at = $2
            WHERE id = $3
            "#,
        )
        .bind(&new_role)
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to update user role: {}", e)))?;

        Ok(())
    }

    /// Change user password
    pub async fn change_password(
        user_id: Uuid,
        current_password: &str,
        new_password: &str,
    ) -> AppResult<()> {
        let pool = pool();

        // Validate new password
        if let Err(e) = validate_password(new_password) {
            return Err(AppError::ValidationError(e));
        }

        // Get current password hash
        let current_hash: String =
            sqlx::query_scalar("SELECT password_hash FROM users WHERE id = $1")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(|e| match e {
                    sqlx::Error::RowNotFound => AppError::NotFound("User not found".to_string()),
                    _ => AppError::DatabaseError(format!("Failed to fetch user password: {}", e)),
                })?;

        // Verify current password
        let is_valid = AuthService::verify_password(current_password, &current_hash)?;

        if !is_valid {
            return Err(AppError::BadRequest(
                "Current password is incorrect".to_string(),
            ));
        }

        // Hash new password
        let new_hash = AuthService::hash_password(new_password)?;

        // Update password
        sqlx::query(
            r#"
            UPDATE users
            SET password_hash = $1, updated_at = $2
            WHERE id = $3
            "#,
        )
        .bind(&new_hash)
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to update password: {}", e)))?;

        Ok(())
    }

    /// Delete user account (soft delete)
    pub async fn delete_account(user_id: Uuid) -> AppResult<()> {
        let pool = pool();

        // Check if user exists
        let user_exists =
            sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(|e| {
                    AppError::DatabaseError(format!("Failed to check user existence: {}", e))
                })?;

        if !user_exists {
            return Err(AppError::NotFound("User not found".to_string()));
        }

        // Soft delete by updating deleted_at timestamp
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = $1, updated_at = $1
            WHERE id = $2
            "#,
        )
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to delete user: {}", e)))?;

        Ok(())
    }

    /// Verify user email
    pub async fn verify_email(user_id: Uuid) -> AppResult<()> {
        let pool = pool();

        sqlx::query(
            r#"
            UPDATE users
            SET email_verified = true, updated_at = $1
            WHERE id = $2
            "#,
        )
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("User not found".to_string()),
            _ => AppError::DatabaseError(format!("Failed to verify email: {}", e)),
        })?;

        Ok(())
    }

    /// List users with pagination (admin only)
    pub async fn list_users(
        page: Option<u32>,
        limit: Option<u32>,
        role_filter: Option<UserRole>,
    ) -> AppResult<(Vec<UpdateUser>, u64)> {
        let pool = pool();
        let page = page.unwrap_or(1);
        let limit = limit.unwrap_or(20).min(100); // Cap at 100 per page
        let offset = (page - 1) * limit;

        let mut query = "SELECT id, email, first_name, preposition, last_name, role, email_verified FROM users WHERE deleted_at IS NULL".to_string();
        let mut count_query = "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL".to_string();

        if let Some(role) = &role_filter {
            query.push_str(&format!(" AND role = '{}'", role.as_str()));
            count_query.push_str(&format!(" AND role = '{}'", role.as_str()));
        }

        query.push_str(&format!(
            " ORDER BY created_at DESC LIMIT {} OFFSET {}",
            limit, offset
        ));

        let users: Vec<UpdateUser> = sqlx::query_as(&query)
            .fetch_all(pool)
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to fetch users: {}", e)))?;

        let total_count: i64 = sqlx::query_scalar(&count_query)
            .fetch_one(pool)
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to count users: {}", e)))?;

        Ok((users, total_count as u64))
    }
}

#[derive(serde::Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(serde::Deserialize)]
pub struct UpdateAccountRequest {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub preposition: Option<String>,
    pub last_name: Option<String>,
}

impl From<UpdateAccountRequest> for UpdateUser {
    fn from(req: UpdateAccountRequest) -> Self {
        UpdateUser {
            id: Uuid::nil(), // This will be set by the calling function
            email: req.email,
            first_name: req.first_name,
            preposition: req.preposition,
            last_name: req.last_name,
            role: None,           // Role updates are handled separately
            email_verified: None, // Email verification is handled separately
        }
    }
}
