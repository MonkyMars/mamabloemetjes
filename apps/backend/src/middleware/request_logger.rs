use axum::{
    extract::Request,
    http::{Method, StatusCode},
    middleware::Next,
    response::Response,
};
use chrono::{DateTime, Local};
use std::time::Instant;

pub async fn request_logger_middleware(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let path = request.uri().path().to_string();
    let start_time = Instant::now();

    let response = next.run(request).await;

    let elapsed = start_time.elapsed();
    let timing_ms = elapsed.as_millis();
    let status = response.status();

    // Log the request without body inspection for performance
    log_request(&method, &path, status, timing_ms, None);

    response
}

fn log_request(
    method: &Method,
    path: &str,
    status: StatusCode,
    timing_ms: u128,
    _error_info: Option<(String, String)>,
) {
    let now: DateTime<Local> = Local::now();
    let timestamp = now.format("%H:%M:%S").to_string();

    let log_parts = vec![
        format!("[{}]", timestamp),
        format!("{}", method),
        format!("{}", status.as_u16()),
        format!("{}", path),
        format!("{}ms", timing_ms),
    ];

    let log_message = log_parts.join(" - ");

    // Use stdout directly and flush to ensure immediate console output
    use std::io::{self, Write};
    println!("{}", log_message.trim());
    io::stdout().flush().unwrap_or(());
}
