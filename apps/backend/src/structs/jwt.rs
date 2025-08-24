use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Signup {
    pub first_name: String,
    pub preposition: String,
    pub last_name: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct Login {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Claims {
    pub sub: String,    // User ID
    pub email: String,  // User email
    pub role: UserRole, // User role
    pub exp: usize,     // Expiration time
    pub iat: usize,     // Issued at
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum UserRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "admin")]
    Admin,
}

impl UserRole {
    pub fn as_str(&self) -> &str {
        match self {
            UserRole::User => "user",
            UserRole::Admin => "admin",
        }
    }
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserInfo,
    pub expires_in: i64, // seconds until access token expires
}

#[derive(Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub preposition: Option<String>,
    pub last_name: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct RefreshResponse {
    pub access_token: String,
    pub expires_in: i64,
}

#[derive(Deserialize)]
pub struct RoleUpdateRequest {
    pub user_id: Uuid,
    pub role: UserRole,
}
