use crate::pool::connect::pool;
use crate::response::error::AppError;
use crate::structs::jwt::{AuthResponse, Claims, RefreshResponse, UserInfo, UserRole};
use crate::structs::user::{CreateUser, User};
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use sqlx::{PgPool, Row};
use std::env;
use uuid::Uuid;

pub struct AuthService;

impl AuthService {
    /// Get access token expiry from environment or default to 30 minutes
    fn get_access_token_expiry() -> i64 {
        env::var("ACCESS_TOKEN_EXPIRY")
            .unwrap_or_else(|_| "3600".to_string()) // 30 minutes default
            .parse()
            .unwrap_or(3600)
    }

    /// Get refresh token expiry from environment or default to 7 days
    fn get_refresh_token_expiry() -> i64 {
        env::var("REFRESH_TOKEN_EXPIRY")
            .unwrap_or_else(|_| "86400".to_string()) // 24 hours default
            .parse()
            .unwrap_or(86400)
    }
    /// Hash a password using Argon2
    pub fn hash_password(password: &str) -> Result<String, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|_| AppError::InternalServerError("Failed to hash password".to_string()))
    }

    /// Verify a password against its hash
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|_| AppError::InternalServerError("Invalid password hash".to_string()))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Generate JWT access token
    pub fn generate_access_token(user: &User) -> Result<String, AppError> {
        let secret = env::var("JWT_SECRET")
            .map_err(|_| AppError::InternalServerError("JWT_SECRET not set".to_string()))?;

        let now = Utc::now().timestamp() as usize;
        let exp = now + Self::get_access_token_expiry() as usize;

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role.clone(),
            exp,
            iat: now,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_ref()),
        )
        .map_err(|_| AppError::InternalServerError("Failed to generate access token".to_string()))
    }

    /// Generate refresh token
    pub fn generate_refresh_token() -> String {
        use rand::Rng;
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                                abcdefghijklmnopqrstuvwxyz\
                                0123456789";
        let mut rng = rand::rng();

        (0..64)
            .map(|_| {
                let idx = rng.random_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }

    /// Verify JWT token and extract claims
    pub fn verify_token(token: &str) -> Result<Claims, AppError> {
        let secret = env::var("JWT_SECRET")
            .map_err(|_| AppError::InternalServerError("JWT_SECRET not set".to_string()))?;

        let mut validation = Validation::default();
        validation.validate_exp = true;

        decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_ref()),
            &validation,
        )
        .map(|data| data.claims)
        .map_err(|_| AppError::Unauthorized)
    }

    /// Register a new user
    pub async fn register(create_user: CreateUser) -> Result<AuthResponse, AppError> {
        let pool = pool();

        // Check if user already exists
        if Self::user_exists_by_email(pool, &create_user.email).await? {
            return Err(AppError::Conflict("User already exists".to_string()));
        }

        // Hash password
        let password_hash = Self::hash_password(&create_user.password)?;

        // Create user
        let mut user = User::new(
            create_user.email,
            create_user.first_name,
            Some(create_user.preposition).filter(|s| !s.is_empty()),
            create_user.last_name,
            password_hash,
            create_user.role,
        );

        // Generate tokens
        let access_token = Self::generate_access_token(&user)?;
        let refresh_token = Self::generate_refresh_token();
        let refresh_expires_at = Utc::now() + Duration::seconds(Self::get_refresh_token_expiry());

        user.update_refresh_token(refresh_token.clone(), refresh_expires_at);
        user.update_last_login();

        // Save user to database
        Self::create_user(pool, &user).await?;

        Ok(AuthResponse {
            access_token,
            refresh_token,
            user: UserInfo {
                id: user.id,
                first_name: user.first_name.clone(),
                preposition: user.preposition.clone(),
                last_name: user.last_name.clone(),
                email: user.email.clone(),
                role: user.role.clone(),
                created_at: user.created_at,
            },
            expires_in: Self::get_access_token_expiry(),
        })
    }

    /// Login user
    pub async fn login(email: String, password: String) -> Result<AuthResponse, AppError> {
        let pool = pool();

        // Get user by email
        let mut user = Self::get_user_by_email(pool, &email).await?;

        // Verify password
        if !Self::verify_password(&password, &user.password_hash)? {
            return Err(AppError::Unauthorized);
        }

        // Generate tokens
        let access_token = Self::generate_access_token(&user)?;
        let refresh_token = Self::generate_refresh_token();
        let refresh_expires_at = Utc::now() + Duration::seconds(Self::get_refresh_token_expiry());

        user.update_refresh_token(refresh_token.clone(), refresh_expires_at);
        user.update_last_login();

        // Update user in database
        Self::update_user_tokens(pool, &user).await?;

        Ok(AuthResponse {
            access_token,
            refresh_token,
            user: UserInfo {
                id: user.id,
                first_name: user.first_name.clone(),
                preposition: user.preposition.clone(),
                last_name: user.last_name.clone(),
                email: user.email.clone(),
                role: user.role.clone(),
                created_at: user.created_at,
            },
            expires_in: Self::get_access_token_expiry(),
        })
    }

    /// Refresh access token
    pub async fn refresh_token(refresh_token: String) -> Result<RefreshResponse, AppError> {
        let pool = pool();

        // Find user by refresh token
        let user = Self::get_user_by_refresh_token(pool, &refresh_token).await?;

        // Check if refresh token is expired
        if let Some(expires_at) = user.refresh_token_expires_at {
            if expires_at < Utc::now() {
                return Err(AppError::Unauthorized);
            }
        } else {
            return Err(AppError::Unauthorized);
        }

        // Generate new access token
        let access_token = Self::generate_access_token(&user)?;

        Ok(RefreshResponse {
            access_token,
            expires_in: Self::get_access_token_expiry(),
        })
    }

    /// Logout user (invalidate refresh token)
    pub async fn logout(user_id: Uuid) -> Result<(), AppError> {
        let pool = pool();

        sqlx::query(
            r#"
            UPDATE users
            SET refresh_token = NULL,
                refresh_token_expires_at = NULL,
                updated_at = $1
            WHERE id = $2
            "#,
        )
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to logout user: {}", e)))?;

        Ok(())
    }

    /// Get user by ID
    pub async fn get_user_by_id(user_id: Uuid) -> Result<User, AppError> {
        let pool = pool();
        Self::get_user_by_id_from_pool(pool, user_id).await
    }

    /// Update user role (admin only)
    pub async fn update_user_role(user_id: Uuid, role: UserRole) -> Result<(), AppError> {
        let pool = pool();

        sqlx::query(
            r#"
            UPDATE users
            SET role = $1::user_role, updated_at = $2
            WHERE id = $3
            "#,
        )
        .bind(role.as_str())
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to update user role: {}", e)))?;

        Ok(())
    }

    // Private helper methods
    async fn user_exists_by_email(pool: &PgPool, email: &str) -> Result<bool, AppError> {
        let result = sqlx::query(
            r#"
            SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists
            "#,
        )
        .bind(email)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to check user existence: {}", e)))?;

        Ok(result.get::<bool, _>("exists"))
    }

    async fn create_user(pool: &PgPool, user: &User) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO users (
                id, email, first_name, preposition, last_name, password_hash, role, refresh_token, refresh_token_expires_at,
                created_at, updated_at, email_verified, last_login
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::user_role, $8, $9, $10, $11, $12, $13)
            "#,
        )
        .bind(user.id)
        .bind(&user.email)
        .bind(&user.first_name)
        .bind(&user.preposition)
        .bind(&user.last_name)
        .bind(&user.password_hash)
        .bind(user.role.as_str())
        .bind(&user.refresh_token)
        .bind(user.refresh_token_expires_at)
        .bind(user.created_at)
        .bind(user.updated_at)
        .bind(user.email_verified)
        .bind(user.last_login)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to create user: {}", e)))?;

        Ok(())
    }

    async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<User, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, email, first_name, preposition, last_name, password_hash, role::text, refresh_token, refresh_token_expires_at,
                   created_at, updated_at, email_verified, last_login
            FROM users
            WHERE email = $1
            "#,
        )
        .bind(email)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch user: {}", e)))?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let role_str: String = row.get("role");
        let role = match role_str.as_str() {
            "admin" => UserRole::Admin,
            "user" => UserRole::User,
            _ => UserRole::User,
        };

        Ok(User {
            id: row.get("id"),
            email: row.get("email"),
            first_name: row.get("first_name"),
            preposition: row.get("preposition"),
            last_name: row.get("last_name"),
            password_hash: row.get("password_hash"),
            role,
            refresh_token: row.get("refresh_token"),
            refresh_token_expires_at: row.get("refresh_token_expires_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            email_verified: row.get("email_verified"),
            last_login: row.get("last_login"),
        })
    }

    async fn get_user_by_id_from_pool(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, email, first_name, preposition, last_name, password_hash, role::text, refresh_token, refresh_token_expires_at,
                   created_at, updated_at, email_verified, last_login
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch user: {}", e)))?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let role_str: String = row.get("role");
        let role = match role_str.as_str() {
            "admin" => UserRole::Admin,
            "user" => UserRole::User,
            _ => UserRole::User,
        };

        Ok(User {
            id: row.get("id"),
            email: row.get("email"),
            first_name: row.get("first_name"),
            preposition: row.get("preposition"),
            last_name: row.get("last_name"),
            password_hash: row.get("password_hash"),
            role,
            refresh_token: row.get("refresh_token"),
            refresh_token_expires_at: row.get("refresh_token_expires_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            email_verified: row.get("email_verified"),
            last_login: row.get("last_login"),
        })
    }

    async fn get_user_by_refresh_token(
        pool: &PgPool,
        refresh_token: &str,
    ) -> Result<User, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, email, first_name, preposition, last_name, password_hash, role::text, refresh_token, refresh_token_expires_at,
                   created_at, updated_at, email_verified, last_login
            FROM users
            WHERE refresh_token = $1
            "#,
        )
        .bind(refresh_token)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            AppError::DatabaseError(format!("Failed to fetch user by refresh token: {}", e))
        })?
        .ok_or_else(|| AppError::Unauthorized)?;

        let role_str: String = row.get("role");
        let role = match role_str.as_str() {
            "admin" => UserRole::Admin,
            "user" => UserRole::User,
            _ => UserRole::User,
        };

        Ok(User {
            id: row.get("id"),
            email: row.get("email"),
            first_name: row.get("first_name"),
            preposition: row.get("preposition"),
            last_name: row.get("last_name"),
            password_hash: row.get("password_hash"),
            role,
            refresh_token: row.get("refresh_token"),
            refresh_token_expires_at: row.get("refresh_token_expires_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            email_verified: row.get("email_verified"),
            last_login: row.get("last_login"),
        })
    }

    async fn update_user_tokens(pool: &PgPool, user: &User) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE users
            SET refresh_token = $1,
                refresh_token_expires_at = $2,
                last_login = $3,
                updated_at = $4
            WHERE id = $5
            "#,
        )
        .bind(&user.refresh_token)
        .bind(user.refresh_token_expires_at)
        .bind(user.last_login)
        .bind(user.updated_at)
        .bind(user.id)
        .execute(pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to update user tokens: {}", e)))?;

        Ok(())
    }
}
