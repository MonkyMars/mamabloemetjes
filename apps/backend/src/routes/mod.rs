pub mod get;
pub mod health_check;
pub mod post;

use crate::response::{ApiResponse, AppResponse, error::AppError};
use axum::{
    Router,
    routing::{get, post},
};

async fn handle_404() -> ApiResponse<()> {
    AppResponse::Error(AppError::NotFound(
        "The requested endpoint does not exist. Please check the URL and try again. Available endpoints: /health, /order, /order/pricing, /order/validate-pricing, /order/check-inventory, /order/ship, /order/cancel, /orders, /orders/{id}, /orders/{id}/lines, /orders/{id}/details, /products, /inventory, /inventory/{id}".to_string(),
    ))
}

pub fn setup_routes(router: Router) -> Router {
    router
        // Health check endpoint
        .route("/health", get(health_check::health_check))
        // Product routes
        .nest("/", product_routes(Router::new()))
        // Inventory routes
        .nest("/", inventory_routes(Router::new()))
        // Order routes
        .nest("/", order_routes(Router::new()))
        // Admin routes
        .nest("/admin", admin_routes(Router::new()))
        // Fallback handler for 404 errors
        .fallback(handle_404)
}

pub fn inventory_routes(router: Router) -> Router {
    router
        // Inventory debug routes
        .route("/inventory", get(get::inventory::get_all_inventory))
        .route(
            "/inventory/{id}",
            get(get::inventory::get_inventory_by_product),
        )
}

pub fn product_routes(router: Router) -> Router {
    router
        // The GET routes for products; these are used to retrieve products. Either all or by id.
        .route(
            "/products/featured",
            get(get::featured::get_featured_products),
        )
        .route("/products", get(get::product::get_products))
        .route("/products/{id}", get(get::product::get_product))
}

pub fn order_routes(router: Router) -> Router {
    router
        // The POST route; New orders come in here
        .route("/order", post(post::order::order))
        // Pricing calculation endpoints
        .route("/order/pricing", post(post::order::calculate_order_pricing))
        .route(
            "/order/validate-pricing",
            post(post::order::validate_order_pricing),
        )
        // Cancel order endpoint
        .route("/order/cancel", post(post::order::cancel_order))
        // The GET routes for orders; these are used to retrieve orders. Either all or by id.
        .route("/orders", get(get::order::get_orders))
        .route("/orders/{id}", get(get::order::get_order))
        // Get order lines for a specific order
        .route(
            "/orders/{id}/lines",
            get(get::order_lines::get_order_lines_by_order_id),
        )
        // Get order with all order lines (complete details)
        .route(
            "/orders/{id}/details",
            get(get::order::get_order_with_order_lines),
        )
}

pub fn admin_routes(router: Router) -> Router {
    router
        // Inventory check endpoint
        .route(
            "/order/check-inventory",
            post(post::order::check_order_inventory),
        )
        // Ship order endpoint
        .route("/order/ship", post(post::order::ship_order))
}
