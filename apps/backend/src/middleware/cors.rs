use axum::http::{HeaderValue, Method};
use tower_http::cors::CorsLayer;

pub fn cors_middleware() -> CorsLayer {
    let allowed_origin = HeaderValue::from_static("http://localhost:3000");

    CorsLayer::new()
        .allow_origin(allowed_origin) // must be specific when allow_credentials=true
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::PATCH,
        ])
        .allow_headers([
            axum::http::HeaderName::from_static("content-type"),
            axum::http::HeaderName::from_static("authorization"),
        ])
        .allow_credentials(true)
}
