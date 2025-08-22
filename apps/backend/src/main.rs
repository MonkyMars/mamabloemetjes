pub mod actions;
pub mod middleware;
pub mod pool;
pub mod response;
pub mod routes;
pub mod services;
pub mod structs;
pub mod utils;
pub mod validate;

use axum::Router;
use tokio::net::TcpListener;
use tracing::{error, info};

use dotenv::dotenv;

#[tokio::main]
async fn main() {
    // Initialize tracing with minimal formatting for console output
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .with_line_number(false)
        .init();

    // Initialize environment variables
    match dotenv() {
        Ok(_) => info!(".env file loaded successfully"),
        Err(e) => {
            error!("Failed to load .env file: {}", e);
        }
    }

    info!("Starting mamabloemetjes backend server...");

    warmup_database().await;

    // Enable CORS middleware
    let cors = middleware::cors::cors_middleware();

    // Create the application router
    let app = create_router().layer(cors);

    // Setup the TCP listener with better error handling
    let listener = match TcpListener::bind("0.0.0.0:3001").await {
        Ok(listener) => {
            info!(
                "Server successfully bound to {}",
                listener.local_addr().unwrap()
            );
            listener
        }
        Err(e) => {
            error!("Failed to bind server to 0.0.0.0:3001: {}", e);
            std::process::exit(1);
        }
    };

    info!("🚀 Server is running and ready to accept connections!");

    // Start the server with graceful error handling
    if let Err(e) = axum::serve(listener, app).await {
        error!("Server error: {}", e);
        std::process::exit(1);
    }
}

fn create_router() -> Router {
    routes::setup_routes(Router::new()).layer(axum::middleware::from_fn(
        crate::middleware::request_logger_middleware,
    ))
}

async fn warmup_database() {
    let _ = actions::get::get_all_products().await;
    tracing::info!("Database warmed up");
}
