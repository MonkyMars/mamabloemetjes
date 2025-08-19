mod pool;
mod response;
mod routes;
mod structs;
mod validate;

use axum::Router;
use tokio::net::TcpListener;

use dotenv::dotenv;

#[tokio::main]
async fn main() {
    dotenv().ok().expect("No .env file found");

    tracing_subscriber::fmt().init();
    let app = create_router();

    let listener = TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("Server is listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}

fn create_router() -> Router {
    routes::setup_routes(Router::new())
}
