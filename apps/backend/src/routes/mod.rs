pub mod order;
pub mod product;

use crate::response::{ApiResponse, AppResponse, HealthCheckResponse, error::AppError};
use axum::{
    Json, Router,
    routing::{get, post},
};
use std::time::{SystemTime, UNIX_EPOCH};

async fn health_check() -> Json<HealthCheckResponse> {
    let uptime = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    let health = HealthCheckResponse::new("1.0.0", uptime);
    Json(health)
}

async fn handle_404() -> ApiResponse<()> {
    AppResponse::Error(AppError::NotFound(
        "The requested endpoint does not exist. Please check the URL and try again. Available endpoints: /health, /order, /orders, /products".to_string(),
    ))
}

pub fn setup_routes(router: Router) -> Router {
    router
        // Health check endpoint
        .route("/health", get(health_check))
        // The POST route; New orders come in here
        .route("/order", post(order::order))
        // The GET routes for orders; these are used to retrieve orders. Either all or by id.
        .route("/orders", get(order::get_orders))
        .route("/orders/{id}", get(order::get_order))
        // The GET routes for products; these are used to retrieve products. Either all or by id.
        .route("/products", get(product::get_products))
        .route("/products/{id}", get(product::get_product))
        // Fallback handler for 404 errors
        .fallback(handle_404)
}
