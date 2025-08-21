use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct SuccessResponse<T> {
    pub success: bool,
    pub data: T,
    pub message: Option<String>,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub success: bool,
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
    pub message: Option<String>,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationMeta {
    pub page: u32,
    pub per_page: u32,
    pub total: u64,
    pub total_pages: u32,
    pub has_next: bool,
    pub has_prev: bool,
}

impl<T> SuccessResponse<T>
where
    T: Serialize,
{
    pub fn new(data: T) -> Self {
        Self {
            success: true,
            data,
            message: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
            meta: None,
        }
    }

    pub fn with_message(mut self, message: &str) -> Self {
        self.message = Some(message.to_string());
        self
    }

    pub fn with_meta(mut self, meta: serde_json::Value) -> Self {
        self.meta = Some(meta);
        self
    }

    pub fn created(data: T) -> SuccessResponseWithStatus<T> {
        SuccessResponseWithStatus {
            response: Self::new(data).with_message("Resource created successfully"),
            status: StatusCode::CREATED,
        }
    }

    pub fn ok(data: T) -> SuccessResponseWithStatus<T> {
        SuccessResponseWithStatus {
            response: Self::new(data),
            status: StatusCode::OK,
        }
    }

    pub fn accepted(data: T) -> SuccessResponseWithStatus<T> {
        SuccessResponseWithStatus {
            response: Self::new(data).with_message("Request accepted for processing"),
            status: StatusCode::ACCEPTED,
        }
    }
}

impl<T> PaginatedResponse<T>
where
    T: Serialize,
{
    pub fn new(data: Vec<T>, page: u32, per_page: u32, total: u64) -> Self {
        let total_pages = ((total as f64) / (per_page as f64)).ceil() as u32;
        let has_next = page < total_pages;
        let has_prev = page > 1;

        Self {
            success: true,
            data,
            pagination: PaginationMeta {
                page,
                per_page,
                total,
                total_pages,
                has_next,
                has_prev,
            },
            message: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn with_message(mut self, message: &str) -> Self {
        self.message = Some(message.to_string());
        self
    }
}

pub struct SuccessResponseWithStatus<T> {
    pub response: SuccessResponse<T>,
    pub status: StatusCode,
}

impl<T> IntoResponse for SuccessResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        (StatusCode::OK, Json(self)).into_response()
    }
}

impl<T> IntoResponse for SuccessResponseWithStatus<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        (self.status, Json(self.response)).into_response()
    }
}

impl<T> IntoResponse for PaginatedResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        (StatusCode::OK, Json(self)).into_response()
    }
}

// Convenient type aliases
pub type ApiSuccess<T> = SuccessResponse<T>;
pub type ApiPaginated<T> = PaginatedResponse<T>;

// Unit response for operations that don't return data
#[derive(Debug, Serialize, Deserialize)]
pub struct EmptyResponse;

impl SuccessResponse<EmptyResponse> {
    pub fn no_content() -> SuccessResponseWithStatus<EmptyResponse> {
        SuccessResponseWithStatus {
            response: Self::new(EmptyResponse),
            status: StatusCode::NO_CONTENT,
        }
    }

    pub fn deleted() -> SuccessResponseWithStatus<EmptyResponse> {
        SuccessResponseWithStatus {
            response: Self::new(EmptyResponse).with_message("Resource deleted successfully"),
            status: StatusCode::NO_CONTENT,
        }
    }
}

// Health check response
#[derive(Debug, Serialize, Deserialize)]
pub struct HealthCheckResponse {
    pub status: String,
    pub version: String,
    pub uptime: String,
    pub timestamp: String,
}

impl HealthCheckResponse {
    pub fn new(version: &str, uptime: Duration) -> Self {
        Self {
            version: version.to_string(),
            uptime: uptime.as_secs_f64().to_string() + " seconds",
            status: "ok".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

impl IntoResponse for HealthCheckResponse {
    fn into_response(self) -> Response {
        (StatusCode::OK, Json(self)).into_response()
    }
}
