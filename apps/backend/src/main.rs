mod middleware;
mod pool;
mod response;
mod routes;
mod structs;
mod validate;

use axum::Router;
use tokio::net::TcpListener;
use tracing::{error, info, warn};

use dotenv::dotenv;

#[tokio::main]
async fn main() {
    // Initialize environment variables
    if dotenv().is_err() {
        warn!("No .env file found, using environment variables from system");
    }

    // Initialize tracing with minimal formatting for console output
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .with_line_number(false)
        .init();

    info!("Starting mamabloemetjes backend server...");

    // Create the application router
    let app = create_router();

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
