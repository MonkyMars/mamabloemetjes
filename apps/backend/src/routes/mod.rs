pub mod auth;
pub mod get;
pub mod health_check;
pub mod post;

use crate::middleware::{admin_middleware, auth_middleware, optional_auth_middleware};
use crate::response::{ApiResponse, AppResponse, error::AppError};
use axum::{
    Router, middleware,
    routing::{get, post},
};

async fn handle_404() -> ApiResponse<()> {
    AppResponse::Error(AppError::NotFound(
        "The requested endpoint does not exist. Please check the URL and try again.".to_string(),
    ))
}

pub fn setup_routes(router: Router) -> Router {
    router
        // Health check endpoint (public)
        .route("/health", get(health_check::health_check))
        // Merge public routes instead of nesting at root
        .merge(public_routes())
        // Authenticated routes (requires valid JWT)
        .nest("/api", authenticated_routes())
        // Admin routes (requires admin role)
        .nest("/admin", admin_routes())
        // Auth routes (mixed - some public, some authenticated)
        .nest("/auth", auth_routes())
        // Fallback handler for 404 errors
        .fallback(handle_404)
}

/// Public routes - no authentication required
/// These routes are merged at the root level
fn public_routes() -> Router {
    Router::new()
        // Product routes (public)
        .route(
            "/products/featured",
            get(get::featured::get_featured_products),
        )
        .route("/products", get(get::product::get_products))
        .route("/products/{id}", get(get::product::get_product))
        // Public inventory routes (limited access)
        .route("/inventory", get(get::inventory::get_all_inventory))
        .route(
            "/inventory/{id}",
            get(get::inventory::get_inventory_by_product),
        )
        // Add optional auth middleware to capture user context if available
        .layer(middleware::from_fn(optional_auth_middleware))
}

/// Authenticated routes - requires valid JWT token
/// Prefix: /api
fn authenticated_routes() -> Router {
    Router::new()
        // Protected order routes - users can only see their own orders
        .route("/orders", get(get::order::get_orders))
        .route("/orders/{id}", get(get::order::get_order))
        .route(
            "/orders/{id}/lines",
            get(get::order_lines::get_order_lines_by_order_id),
        )
        .route(
            "/orders/{id}/details",
            get(get::order::get_order_with_order_lines),
        )
        // Authenticated order operations
        .route("/order", post(post::order::order))
        .route("/order/pricing", post(post::order::calculate_order_pricing))
        .route(
            "/order/validate-pricing",
            post(post::order::validate_order_pricing),
        )
        .route("/order/cancel", post(post::order::cancel_order))
        // User profile and account management
        .route("/profile", get(auth::profile))
        .route("/logout", post(auth::logout))
        // Add auth middleware to all routes in this group
        .layer(middleware::from_fn(auth_middleware))
}

/// Admin routes - requires admin role
/// Prefix: /admin
fn admin_routes() -> Router {
    Router::new()
        // Admin order management
        .route(
            "/order/check-inventory",
            post(post::order::check_order_inventory),
        )
        .route("/order/ship", post(post::order::ship_order))
        // Admin order viewing (can see all orders)
        .route("/orders", get(get::order::get_all_orders_admin))
        .route("/orders/{id}", get(get::order::get_order_admin))
        .route(
            "/users/{user_id}/orders",
            get(get::order::get_orders_by_user_admin),
        )
        // User management
        .route("/users/{id}", get(auth::get_user))
        .route("/users/role", post(auth::update_user_role))
        .route("/users/create-admin", post(auth::create_admin))
        // Advanced inventory management
        .route("/inventory/manage", get(get::inventory::get_all_inventory))
        // Admin analytics and reporting (placeholder routes)
        .route("/analytics/orders", get(get::order::get_all_orders_admin))
        .route("/analytics/users", get(auth::get_user))
        // Add admin middleware to all routes in this group
        .layer(middleware::from_fn(admin_middleware))
}

/// Authentication routes - mixed access levels
/// Prefix: /auth
fn auth_routes() -> Router {
    Router::new()
        // Public auth endpoints (no middleware)
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
        .route("/refresh", post(auth::refresh_token))
        // Protected auth endpoints
        .route("/verify", get(auth::verify))
        .route("/profile", get(auth::profile))
        .route("/logout", post(auth::logout))
        // Apply auth middleware only to protected routes
        .layer(middleware::from_fn_with_state(
            (),
            |request: axum::extract::Request, next: axum::middleware::Next| async move {
                let path = request.uri().path();

                // Skip auth middleware for public endpoints
                if matches!(path, "/register" | "/login" | "/refresh") {
                    return Ok(next.run(request).await);
                }

                // Apply auth middleware for protected endpoints
                auth_middleware(request, next).await
            },
        ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_health_check_route() {
        let app = setup_routes(Router::new());

        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/health")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_404_fallback() {
        let app = setup_routes(Router::new());

        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/nonexistent")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
