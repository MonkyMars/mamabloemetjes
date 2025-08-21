use crate::response::HealthCheckResponse;
use axum::Json;
use std::time::Instant;

static SERVER_START: once_cell::sync::Lazy<Instant> = once_cell::sync::Lazy::new(|| Instant::now());

pub async fn health_check() -> Json<HealthCheckResponse> {
    let uptime = SERVER_START.elapsed();
    let health = HealthCheckResponse::new("1.0.0", uptime);
    Json(health)
}
