use crate::actions::get::product::get_product_by_id;
use crate::response::{ApiResponse, AppResponse, error::AppError};
use crate::services::PromotionService;
use crate::structs::promotion::{DiscountPromotionWithProducts, PriceValidationRequest};
use axum::Json;

/// POST /promotions/validate-price - Validate prices with current promotions
/// This endpoint is available for both authenticated and guest users
pub async fn validate_price(
    Json(request): Json<PriceValidationRequest>,
) -> ApiResponse<crate::structs::promotion::PriceValidationResponse> {
    // Validate request
    if request.items.is_empty() {
        return AppResponse::Error(AppError::ValidationError(
            "At least one item is required for price validation".to_string(),
        ));
    }

    // Validate each item
    for item in &request.items {
        if item.quantity <= 0 {
            return AppResponse::Error(AppError::ValidationError(
                "All item quantities must be greater than 0".to_string(),
            ));
        }
        if item.expected_unit_price_cents < 0 {
            return AppResponse::Error(AppError::ValidationError(
                "Expected unit price cannot be negative".to_string(),
            ));
        }
    }

    // Validate prices using the promotion service and send the result back to the client
    PromotionService::validate_prices(request).await
}

/// GET /api/promotions/product/{product_id} - Get active promotions for a specific product
/// This endpoint is public to allow frontend to show promotional information
pub async fn get_product_promotions(
    axum::extract::Path(product_id): axum::extract::Path<uuid::Uuid>,
) -> ApiResponse<Option<DiscountPromotionWithProducts>> {
    // First get the product to get its price
    let product = match get_product_by_id(product_id).await {
        Ok(Some(product)) => product,
        Ok(None) => {
            return AppResponse::Error(AppError::NotFound("Product not found".to_string()));
        }
        Err(e) => {
            return AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to fetch product: {}",
                e
            )));
        }
    };

    PromotionService::get_best_promotion_for_product(&product_id, product.price).await
}

/// GET /promotions/active - Get all active promotions
/// This endpoint is public to allow frontend to show promotional information
pub async fn get_all_active_promotions() -> ApiResponse<Vec<DiscountPromotionWithProducts>> {
    PromotionService::get_all_active_promotions().await
}

/// POST /promotions/products - Get active promotions for specific products
/// This endpoint is public to allow frontend to show promotional information
pub async fn get_active_promotions_for_products(
    Json(request): Json<serde_json::Value>,
) -> ApiResponse<Vec<DiscountPromotionWithProducts>> {
    // Extract product_ids from request
    let product_ids = match request.get("product_ids") {
        Some(ids) => match ids.as_array() {
            Some(array) => {
                let mut uuids = Vec::new();
                for id in array {
                    if let Some(id_str) = id.as_str() {
                        match uuid::Uuid::parse_str(id_str) {
                            Ok(uuid) => uuids.push(uuid),
                            Err(_) => {
                                return AppResponse::Error(AppError::ValidationError(
                                    "Invalid product ID format".to_string(),
                                ));
                            }
                        }
                    } else {
                        return AppResponse::Error(AppError::ValidationError(
                            "Product IDs must be strings".to_string(),
                        ));
                    }
                }
                uuids
            }
            None => {
                return AppResponse::Error(AppError::ValidationError(
                    "product_ids must be an array".to_string(),
                ));
            }
        },
        None => {
            return AppResponse::Error(AppError::ValidationError(
                "product_ids field is required".to_string(),
            ));
        }
    };

    if product_ids.is_empty() {
        return AppResponse::Error(AppError::ValidationError(
            "At least one product ID is required".to_string(),
        ));
    }

    PromotionService::get_active_promotions_for_products(&product_ids).await
}
