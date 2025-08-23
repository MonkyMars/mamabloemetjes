use crate::middleware::auth::AuthUser;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::services::auth::AuthService;
use crate::structs::jwt::{Login, RefreshTokenRequest, RoleUpdateRequest, Signup, UserRole};
use crate::structs::user::CreateUser;
use crate::validate::auth::{validate_email, validate_password};
use axum::{Extension, Json, extract::Path};
use uuid::Uuid;

/// Register a new user
pub async fn register(
    Json(signup): Json<Signup>,
) -> ApiResponse<crate::structs::jwt::AuthResponse> {
    // Validate input
    if let Err(e) = validate_email(&signup.email) {
        return AppResponse::Error(AppError::BadRequest(e));
    }

    if let Err(e) = validate_password(&signup.password) {
        return AppResponse::Error(AppError::BadRequest(e));
    }

    let create_user = CreateUser {
        email: signup.email,
        password: signup.password,
        role: Some(UserRole::User), // Default to user role
    };

    match AuthService::register(create_user).await {
        Ok(auth_response) => AppResponse::Success(auth_response),
        Err(e) => AppResponse::Error(e),
    }
}

/// Login user
pub async fn login(Json(login): Json<Login>) -> ApiResponse<crate::structs::jwt::AuthResponse> {
    // Validate input
    if let Err(e) = validate_email(&login.email) {
        return AppResponse::Error(AppError::BadRequest(e));
    }

    if login.password.is_empty() {
        return AppResponse::Error(AppError::BadRequest("Password is required".to_string()));
    }

    match AuthService::login(login.email, login.password).await {
        Ok(auth_response) => AppResponse::Success(auth_response),
        Err(e) => AppResponse::Error(e),
    }
}

/// Logout user
pub async fn logout(Extension(auth_user): Extension<AuthUser>) -> ApiResponse<()> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match AuthService::logout(user_id).await {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

/// Refresh access token
pub async fn refresh_token(
    Json(refresh_request): Json<RefreshTokenRequest>,
) -> ApiResponse<crate::structs::jwt::RefreshResponse> {
    if refresh_request.refresh_token.is_empty() {
        return AppResponse::Error(AppError::BadRequest(
            "Refresh token is required".to_string(),
        ));
    }

    match AuthService::refresh_token(refresh_request.refresh_token).await {
        Ok(refresh_response) => AppResponse::Success(refresh_response),
        Err(e) => AppResponse::Error(e),
    }
}

/// Get current user profile
pub async fn profile(
    Extension(auth_user): Extension<AuthUser>,
) -> ApiResponse<crate::structs::jwt::UserInfo> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match AuthService::get_user_by_id(user_id).await {
        Ok(user) => AppResponse::Success(crate::structs::jwt::UserInfo {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        }),
        Err(e) => AppResponse::Error(e),
    }
}

/// Verify token endpoint (useful for frontend to check if token is still valid)
pub async fn verify(
    Extension(auth_user): Extension<AuthUser>,
) -> ApiResponse<crate::structs::jwt::UserInfo> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match AuthService::get_user_by_id(user_id).await {
        Ok(user) => AppResponse::Success(crate::structs::jwt::UserInfo {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        }),
        Err(e) => AppResponse::Error(e),
    }
}

// Admin-only routes

/// Create admin user (admin only)
pub async fn create_admin(
    Extension(auth_user): Extension<AuthUser>,
    Json(signup): Json<Signup>,
) -> ApiResponse<crate::structs::jwt::AuthResponse> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    // Validate input
    if let Err(e) = validate_email(&signup.email) {
        return AppResponse::Error(AppError::BadRequest(e));
    }

    if let Err(e) = validate_password(&signup.password) {
        return AppResponse::Error(AppError::BadRequest(e));
    }

    let create_user = CreateUser {
        email: signup.email,
        password: signup.password,
        role: Some(UserRole::Admin), // Create as admin
    };

    match AuthService::register(create_user).await {
        Ok(auth_response) => AppResponse::Success(auth_response),
        Err(e) => AppResponse::Error(e),
    }
}

/// Update user role (admin only)
pub async fn update_user_role(
    Extension(auth_user): Extension<AuthUser>,
    Json(role_update): Json<RoleUpdateRequest>,
) -> ApiResponse<()> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match AuthService::update_user_role(role_update.user_id, role_update.role).await {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

/// Get user by ID (admin only)
pub async fn get_user(
    Extension(auth_user): Extension<AuthUser>,
    Path(user_id): Path<Uuid>,
) -> ApiResponse<crate::structs::jwt::UserInfo> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match AuthService::get_user_by_id(user_id).await {
        Ok(user) => AppResponse::Success(crate::structs::jwt::UserInfo {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        }),
        Err(e) => AppResponse::Error(e),
    }
}
