use crate::response::error::AppError;
use crate::services::auth::AuthService;
use crate::structs::jwt::{Claims, UserRole};
use axum::{
    extract::Request,
    http::{StatusCode, header::AUTHORIZATION},
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub claims: Claims,
}

impl AuthUser {
    pub fn new(claims: Claims) -> Self {
        Self { claims }
    }

    pub fn user_id(&self) -> String {
        self.claims.sub.clone()
    }

    pub fn user_uuid(&self) -> Result<Uuid, AppError> {
        Uuid::parse_str(&self.claims.sub)
            .map_err(|_| AppError::BadRequest("Invalid user ID format".to_string()))
    }

    pub fn email(&self) -> String {
        self.claims.email.clone()
    }

    pub fn role(&self) -> UserRole {
        self.claims.role.clone()
    }

    pub fn is_admin(&self) -> bool {
        matches!(self.claims.role, UserRole::Admin)
    }
}

/// Extract bearer token from Authorization header
fn extract_token_from_header(auth_header: &str) -> Option<&str> {
    if auth_header.starts_with("Bearer ") {
        Some(&auth_header[7..])
    } else {
        None
    }
}

/// Middleware to authenticate JWT tokens
pub async fn auth_middleware(mut request: Request, next: Next) -> Result<Response, StatusCode> {
    // Get Authorization header
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Extract token from header
    let token = extract_token_from_header(auth_header).ok_or(StatusCode::UNAUTHORIZED)?;

    // Verify token and extract claims
    let claims = AuthService::verify_token(token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add user claims to request extensions
    request.extensions_mut().insert(AuthUser::new(claims));

    Ok(next.run(request).await)
}

/// Middleware to check for admin role
pub async fn admin_middleware(mut request: Request, next: Next) -> Result<Response, StatusCode> {
    // First run auth middleware logic
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = extract_token_from_header(auth_header).ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = AuthService::verify_token(token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Check if user has admin role
    if !matches!(claims.role, UserRole::Admin) {
        return Err(StatusCode::FORBIDDEN);
    }

    // Add user claims to request extensions
    request.extensions_mut().insert(AuthUser::new(claims));

    Ok(next.run(request).await)
}

/// Middleware for optional authentication (doesn't fail if no token provided)
pub async fn optional_auth_middleware(
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Try to get Authorization header
    if let Some(auth_header) = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
    {
        // Try to extract and verify token
        if let Some(token) = extract_token_from_header(auth_header) {
            if let Ok(claims) = AuthService::verify_token(token) {
                request.extensions_mut().insert(AuthUser::new(claims));
            }
        }
    }

    Ok(next.run(request).await)
}

/// Extract authenticated user from request extensions
pub fn extract_auth_user(request: &Request) -> Option<&AuthUser> {
    request.extensions().get::<AuthUser>()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_token_from_header() {
        assert_eq!(extract_token_from_header("Bearer abc123"), Some("abc123"));
        assert_eq!(extract_token_from_header("bearer abc123"), None);
        assert_eq!(extract_token_from_header("Basic abc123"), None);
        assert_eq!(extract_token_from_header("abc123"), None);
    }
}
