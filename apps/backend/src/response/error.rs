use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum AppError {
    #[error("Unauthorized access")]
    Unauthorized,

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Validation failed: {0}")]
    ValidationError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),

    #[error("Timeout: {0}")]
    Timeout(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Too many requests")]
    TooManyRequests,

    #[error("Unprocessable entity: {0}")]
    UnprocessableEntity(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
    pub timestamp: String,
}

impl AppError {
    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::ValidationError(_) => StatusCode::BAD_REQUEST,
            AppError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            AppError::Timeout(_) => StatusCode::REQUEST_TIMEOUT,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::TooManyRequests => StatusCode::TOO_MANY_REQUESTS,
            AppError::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
        }
    }

    pub fn error_code(&self) -> &'static str {
        match self {
            AppError::Unauthorized => "UNAUTHORIZED",
            AppError::Forbidden(_) => "FORBIDDEN",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::BadRequest(_) => "BAD_REQUEST",
            AppError::ValidationError(_) => "VALIDATION_ERROR",
            AppError::DatabaseError(_) => "DATABASE_ERROR",
            AppError::InternalServerError(_) => "INTERNAL_SERVER_ERROR",
            AppError::ServiceUnavailable(_) => "SERVICE_UNAVAILABLE",
            AppError::Timeout(_) => "TIMEOUT",
            AppError::Conflict(_) => "CONFLICT",
            AppError::TooManyRequests => "TOO_MANY_REQUESTS",
            AppError::UnprocessableEntity(_) => "UNPROCESSABLE_ENTITY",
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status_code = self.status_code();
        let error_response = ErrorResponse {
            error: self.error_code().to_string(),
            message: self.to_string(),
            code: self.error_code().to_string(),
            details: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        (status_code, Json(error_response)).into_response()
    }
}

// Convenient constructors
impl AppError {
    pub fn not_found(resource: &str) -> Self {
        AppError::NotFound(format!("{} not found", resource))
    }

    pub fn validation_error(field: &str, message: &str) -> Self {
        AppError::ValidationError(format!("{}: {}", field, message))
    }

    pub fn database_error(operation: &str) -> Self {
        AppError::DatabaseError(format!("Database operation failed: {}", operation))
    }

    pub fn internal_error(message: &str) -> Self {
        AppError::InternalServerError(message.to_string())
    }

    pub fn bad_request(message: &str) -> Self {
        AppError::BadRequest(message.to_string())
    }

    pub fn forbidden(message: &str) -> Self {
        AppError::Forbidden(message.to_string())
    }

    pub fn conflict(resource: &str) -> Self {
        AppError::Conflict(format!("{} already exists", resource))
    }

    pub fn timeout(operation: &str) -> Self {
        AppError::Timeout(format!("Operation timed out: {}", operation))
    }

    pub fn service_unavailable(service: &str) -> Self {
        AppError::ServiceUnavailable(format!("{} service is currently unavailable", service))
    }

    pub fn unprocessable_entity(message: &str) -> Self {
        AppError::UnprocessableEntity(message.to_string())
    }
}

// Convert common error types to AppError
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::BadRequest(format!("JSON parsing error: {}", err))
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::InternalServerError(format!("IO error: {}", err))
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(format!("Database error: {}", err))
    }
}

pub type AppResult<T> = Result<T, AppError>;
