pub mod actions;
pub mod middleware;
pub mod pool;
pub mod response;
pub mod routes;
pub mod secrets;
pub mod services;
pub mod structs;
pub mod utils;
pub mod validate;

use axum::Router;
use shuttle_runtime::SecretStore;
use tracing::info;

#[shuttle_runtime::main]
async fn main(#[shuttle_runtime::Secrets] secrets: SecretStore) -> shuttle_axum::ShuttleAxum {
    info!("Starting mamabloemetjes backend server...");

    // Initialize secrets for global access
    crate::secrets::initialize_secrets(secrets.clone());

    // Initialize database pool with secrets
    crate::pool::connect::initialize_pool_with_secrets(secrets);

    // Warm up the database connection pool
    warmup_database().await;

    // Enable CORS middleware
    let cors = middleware::cors::cors_middleware();

    // Create the application router
    let app = create_router().layer(cors);

    info!("🚀 Server is ready to accept connections!");

    // Return the Axum service for Shuttle to handle
    Ok(app.into())
}

fn create_router() -> Router {
    routes::setup_routes(Router::new()).layer(axum::middleware::from_fn(
        crate::middleware::request_logger_middleware,
    ))
}

async fn warmup_database() {
    // Only attempt warmup if pool is properly initialized
    if let Ok(_) = crate::actions::get::get_all_products().await {
        tracing::info!("Database warmed up successfully");
    } else {
        tracing::warn!("Database warmup failed, but continuing startup");
    }
}
