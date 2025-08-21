use axum::{
    body::Body,
    extract::Request,
    http::{Method, StatusCode},
    middleware::Next,
    response::Response,
};
use bytes::Bytes;
use chrono::{DateTime, Local};
use http_body_util::BodyExt;
use serde_json::Value;
use std::time::Instant;

pub async fn request_logger_middleware(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let path = request.uri().path().to_string();
    let start_time = Instant::now();

    let response = next.run(request).await;

    let elapsed = start_time.elapsed();
    let timing_ms = elapsed.as_millis();
    let status = response.status();

    // Extract the response body to check for error details
    let (parts, body) = response.into_parts();
    let body_bytes = match body.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(_) => Bytes::new(),
    };

    // Try to extract error information from the body
    let error_info = if status.is_client_error() || status.is_server_error() {
        extract_error_from_body(&body_bytes)
    } else {
        None
    };

    // Log the request
    log_request(&method, &path, status, timing_ms, error_info);

    // Reconstruct the response with the original body
    let new_body = Body::from(body_bytes);
    Response::from_parts(parts, new_body)
}

fn log_request(
    method: &Method,
    path: &str,
    status: StatusCode,
    timing_ms: u128,
    error_info: Option<(String, String)>,
) {
    let now: DateTime<Local> = Local::now();
    let timestamp = now.format("%H:%M:%S").to_string();

    let mut log_parts = vec![
        format!("[{}]", timestamp),
        format!("{}", method),
        format!("{}", status.as_u16()),
        format!("{}", path),
        format!("{}ms", timing_ms),
    ];

    // Add error information if available
    if let Some((error_code, error_message)) = error_info {
        log_parts.push(format!(": {}", error_code));
        if !error_message.is_empty() {
            log_parts.push(format!("- {}", error_message));
        }
    }

    let log_message = log_parts.join(" - ");

    // Use stdout directly and flush to ensure immediate console output
    use std::io::{self, Write};
    println!("{}", log_message.trim());
    io::stdout().flush().unwrap_or(());
}

fn extract_error_from_body(body: &Bytes) -> Option<(String, String)> {
    // Try to parse the body as JSON and extract error information
    if let Ok(body_str) = std::str::from_utf8(body) {
        if let Ok(json) = serde_json::from_str::<Value>(body_str) {
            // Extract error code and message from our ErrorResponse format
            let error_code = json
                .get("error")
                .or_else(|| json.get("code"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let error_message = json
                .get("message")
                .and_then(|v| v.as_str())
                .map(|s| {
                    // Truncate long error messages for console logging
                    if s.len() > 80 {
                        format!("{}...", &s[..77])
                    } else {
                        s.to_string()
                    }
                })
                .unwrap_or_default();

            if let Some(code) = error_code {
                return Some((code, error_message));
            }
        }
    }

    None
}
