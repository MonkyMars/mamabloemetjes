pub mod order;
pub mod product;

use axum::{
    Router,
    routing::{get, post},
};

pub fn setup_routes(router: Router) -> Router {
    router
        // The POST route; New orders come in here
        .route("/order", post(order::order))
        // The GET routes for orders; these are used to retrieve orders. Either all or by id.
        .route("/orders", get(order::get_orders))
        .route("/orders/{id}", get(order::get_order))
        // The GET routes for products; these are used to retrieve products. Either all or by id.
        .route("/products", get(product::get_products))
        .route("/products/{id}", get(product::get_product))
}
