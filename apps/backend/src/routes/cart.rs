use crate::middleware::auth::AuthUser;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::services::CartService;
use crate::structs::cart::{AddCartItemRequest, MergeCartRequest, UpdateCartItemRequest};
use axum::{
    Json,
    extract::{Extension, Path},
};
use uuid::Uuid;

/// GET /api/cart - Get current user's cart (creates one if missing)
pub async fn get_cart(
    Extension(auth_user): Extension<AuthUser>,
) -> ApiResponse<crate::structs::cart::CartResponse> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    CartService::get_cart_with_items(user_id).await
}

/// POST /api/cart/items - Add item(s) to cart
pub async fn add_cart_item(
    Extension(auth_user): Extension<AuthUser>,
    Json(request): Json<AddCartItemRequest>,
) -> ApiResponse<crate::structs::cart::CartItemWithProduct> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Validate quantity is positive
    if request.quantity <= 0 {
        return AppResponse::Error(AppError::ValidationError(
            "Quantity must be greater than 0".to_string(),
        ));
    }

    CartService::add_item_to_cart(user_id, request).await
}

/// PATCH /api/cart/items/:item_id - Update item quantity
pub async fn update_cart_item(
    Extension(auth_user): Extension<AuthUser>,
    Path(item_id): Path<Uuid>,
    Json(request): Json<UpdateCartItemRequest>,
) -> ApiResponse<crate::structs::cart::CartItemWithProduct> {
    let _user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Validate quantity is positive
    if request.quantity <= 0 {
        return AppResponse::Error(AppError::ValidationError(
            "Quantity must be greater than 0".to_string(),
        ));
    }

    CartService::update_cart_item_quantity(item_id, request.quantity).await
}

/// DELETE /api/cart/items/:item_id - Remove item from cart
pub async fn remove_cart_item(
    Extension(auth_user): Extension<AuthUser>,
    Path(item_id): Path<Uuid>,
) -> ApiResponse<()> {
    let _user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    CartService::remove_cart_item(item_id).await
}

/// DELETE /api/cart - Clear cart
pub async fn clear_cart(Extension(auth_user): Extension<AuthUser>) -> ApiResponse<()> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    CartService::clear_cart(user_id).await
}

/// POST /api/cart/merge - Merge guest cart into user's cart
pub async fn merge_cart(
    Extension(auth_user): Extension<AuthUser>,
    Json(request): Json<MergeCartRequest>,
) -> ApiResponse<crate::structs::cart::CartResponse> {
    let user_id = match auth_user.user_uuid() {
        Ok(id) => id,
        Err(e) => return AppResponse::Error(e),
    };

    // Validate guest cart items
    for item in &request.items {
        if item.quantity <= 0 {
            return AppResponse::Error(AppError::ValidationError(
                "All item quantities must be greater than 0".to_string(),
            ));
        }
    }

    CartService::merge_guest_cart(user_id, request.items).await
}
