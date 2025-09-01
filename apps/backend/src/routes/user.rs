use crate::middleware::auth::AuthUser;
use crate::response::{ApiResponse, AppError, AppResponse};
use crate::services::{ChangePasswordRequest, UpdateAccountRequest, UserService};
use crate::structs::UpdateUser;
use crate::structs::jwt::UserRole;
use axum::{
    Extension, Json,
    extract::{Path, Query},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Get current user's profile
pub async fn get_profile(Extension(auth_user): Extension<AuthUser>) -> ApiResponse<UpdateUser> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match UserService::get_user_by_id(user_id).await {
        Ok(user) => AppResponse::Success(user),
        Err(e) => AppResponse::Error(e),
    }
}

/// Update current user's account information
pub async fn update_account(
    Extension(auth_user): Extension<AuthUser>,
    Json(update_request): Json<UpdateAccountRequest>,
) -> ApiResponse<UpdateUser> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    let mut updated_user: UpdateUser = update_request.into();
    updated_user.id = user_id;

    match UserService::update_account(updated_user).await {
        Ok(user) => AppResponse::Success(user),
        Err(e) => AppResponse::Error(e),
    }
}

/// Change user password
pub async fn change_password(
    Extension(auth_user): Extension<AuthUser>,
    Json(password_request): Json<ChangePasswordRequest>,
) -> ApiResponse<()> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match UserService::change_password(
        user_id,
        &password_request.current_password,
        &password_request.new_password,
    )
    .await
    {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

/// Delete current user's account
pub async fn delete_account(Extension(auth_user): Extension<AuthUser>) -> ApiResponse<()> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match UserService::delete_account(user_id).await {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

/// Verify user email
pub async fn verify_email(Extension(auth_user): Extension<AuthUser>) -> ApiResponse<()> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    match UserService::verify_email(user_id).await {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

// Admin-only routes

/// Get user by ID (admin only)
pub async fn get_user_by_id(
    Extension(auth_user): Extension<AuthUser>,
    Path(user_id): Path<Uuid>,
) -> ApiResponse<UpdateUser> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match UserService::get_user_by_id(user_id).await {
        Ok(user) => AppResponse::Success(user),
        Err(e) => AppResponse::Error(e),
    }
}

/// Update user role (admin only)
pub async fn update_user_role(
    Extension(auth_user): Extension<AuthUser>,
    Path(user_id): Path<Uuid>,
    Json(role_request): Json<RoleUpdateRequest>,
) -> ApiResponse<()> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match UserService::update_user_role(user_id, role_request.role).await {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

/// List users with pagination (admin only)
pub async fn list_users(
    Extension(auth_user): Extension<AuthUser>,
    Query(params): Query<ListUsersQuery>,
) -> ApiResponse<PaginatedUsersResponse> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    match UserService::list_users(params.page, params.limit, params.role).await {
        Ok((users, total_count)) => {
            let response = PaginatedUsersResponse {
                users,
                pagination: PaginationInfo {
                    page: params.page.unwrap_or(1),
                    limit: params.limit.unwrap_or(20),
                    total_count,
                    total_pages: (total_count as f64 / params.limit.unwrap_or(20) as f64).ceil()
                        as u64,
                },
            };
            AppResponse::Success(response)
        }
        Err(e) => AppResponse::Error(e),
    }
}

/// Update any user's account information (admin only)
pub async fn admin_update_user(
    Extension(auth_user): Extension<AuthUser>,
    Path(user_id): Path<Uuid>,
    Json(update_request): Json<AdminUpdateUserRequest>,
) -> ApiResponse<UpdateUser> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    let mut updated_user: UpdateUser = update_request.into();
    updated_user.id = user_id;

    match UserService::update_account(updated_user).await {
        Ok(user) => AppResponse::Success(user),
        Err(e) => AppResponse::Error(e),
    }
}

/// Delete any user's account (admin only)
pub async fn admin_delete_user(
    Extension(auth_user): Extension<AuthUser>,
    Path(user_id): Path<Uuid>,
) -> ApiResponse<()> {
    // Check if user is admin
    if !auth_user.is_admin() {
        return AppResponse::Error(AppError::Forbidden("Admin access required".to_string()));
    }

    // Prevent admin from deleting themselves
    let admin_user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    if user_id == admin_user_id {
        return AppResponse::Error(AppError::BadRequest(
            "Cannot delete your own account".to_string(),
        ));
    }

    match UserService::delete_account(user_id).await {
        Ok(_) => AppResponse::Success(()),
        Err(e) => AppResponse::Error(e),
    }
}

// Request/Response structures

#[derive(Deserialize)]
pub struct RoleUpdateRequest {
    pub role: UserRole,
}

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub role: Option<UserRole>,
}

#[derive(Serialize)]
pub struct PaginatedUsersResponse {
    pub users: Vec<UpdateUser>,
    pub pagination: PaginationInfo,
}

#[derive(Serialize)]
pub struct PaginationInfo {
    pub page: u32,
    pub limit: u32,
    pub total_count: u64,
    pub total_pages: u64,
}

#[derive(Deserialize)]
pub struct AdminUpdateUserRequest {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub preposition: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<UserRole>,
    pub email_verified: Option<bool>,
}

impl From<AdminUpdateUserRequest> for UpdateUser {
    fn from(req: AdminUpdateUserRequest) -> Self {
        UpdateUser {
            id: Uuid::nil(), // This will be set by the calling function
            email: req.email,
            first_name: req.first_name,
            preposition: req.preposition,
            last_name: req.last_name,
            role: req.role,
            email_verified: req.email_verified,
        }
    }
}
