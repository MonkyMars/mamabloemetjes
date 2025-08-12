pub mod order;
use axum::{Router, routing::post};

pub fn setup_routes(router: Router) -> Router {
    router.route("/order", post(order::order))
}
