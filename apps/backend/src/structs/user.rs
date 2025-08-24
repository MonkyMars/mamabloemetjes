use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use super::jwt::UserRole;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub first_name: String,
    pub preposition: Option<String>,
    pub last_name: String,
    pub email: String,
    pub password_hash: String,
    pub role: UserRole,
    pub refresh_token: Option<String>,
    pub refresh_token_expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub email_verified: bool,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub first_name: String,
    pub preposition: String,
    pub last_name: String,
    pub password: String,
    pub role: Option<UserRole>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUser {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub preposition: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<UserRole>,
    pub email_verified: Option<bool>,
}

impl User {
    pub fn new(
        email: String,
        first_name: String,
        preposition: Option<String>,
        last_name: String,
        password_hash: String,
        role: Option<UserRole>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            email,
            first_name,
            preposition,
            last_name,
            password_hash,
            role: role.unwrap_or(UserRole::User),
            refresh_token: None,
            refresh_token_expires_at: None,
            created_at: now,
            updated_at: now,
            email_verified: false,
            last_login: None,
        }
    }

    pub fn is_admin(&self) -> bool {
        matches!(self.role, UserRole::Admin)
    }

    pub fn update_refresh_token(&mut self, token: String, expires_at: DateTime<Utc>) {
        self.refresh_token = Some(token);
        self.refresh_token_expires_at = Some(expires_at);
        self.updated_at = Utc::now();
    }

    pub fn clear_refresh_token(&mut self) {
        self.refresh_token = None;
        self.refresh_token_expires_at = None;
        self.updated_at = Utc::now();
    }

    pub fn update_last_login(&mut self) {
        self.last_login = Some(Utc::now());
        self.updated_at = Utc::now();
    }
}
