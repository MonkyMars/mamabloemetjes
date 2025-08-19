pub mod order;
use axum::{
    Router,
    routing::{get, post},
};

pub fn setup_routes(router: Router) -> Router {
    router
        .route("/order", post(order::order))
        .route("/orders", get(order::get_orders::get_orders))
        .route("/orders/{id}", get(order::get_orders::get_order))
}
