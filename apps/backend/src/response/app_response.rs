use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;

use super::error::{AppError, AppResult};
use super::success::{PaginatedResponse, SuccessResponse};

/// Main application response type that can handle both success and error cases
#[derive(Debug)]
pub enum AppResponse<T, E = AppError> {
    Success(T),
    Error(E),
}

/// Result type alias for AppResponse
pub type AppResponseResult<T, E = AppError> = Result<T, E>;

impl<T> AppResponse<T, AppError>
where
    T: Serialize,
{
    /// Create a successful response
    pub fn ok(data: T) -> Self {
        AppResponse::Success(data)
    }

    /// Create an error response
    pub fn error(error: AppError) -> Self {
        AppResponse::Error(error)
    }

    /// Create a successful response with custom status code
    pub fn success_with_status(data: T, status: StatusCode) -> AppResponseWithStatus<T> {
        AppResponseWithStatus {
            response: AppResponse::Success(data),
            status,
        }
    }

    /// Create a created response (201)
    pub fn created(data: T) -> AppResponseWithStatus<T> {
        Self::success_with_status(data, StatusCode::CREATED)
    }

    /// Create an accepted response (202)
    pub fn accepted(data: T) -> AppResponseWithStatus<T> {
        Self::success_with_status(data, StatusCode::ACCEPTED)
    }

    /// Create a no content response (204)
    pub fn no_content() -> AppResponseWithStatus<()> {
        AppResponseWithStatus {
            response: AppResponse::Success(()),
            status: StatusCode::NO_CONTENT,
        }
    }

    /// Convert from Result
    pub fn from_result(result: AppResult<T>) -> Self {
        match result {
            Ok(data) => AppResponse::Success(data),
            Err(error) => AppResponse::Error(error),
        }
    }

    /// Convert to Result
    pub fn into_result(self) -> AppResult<T> {
        match self {
            AppResponse::Success(data) => Ok(data),
            AppResponse::Error(error) => Err(error),
        }
    }

    /// Map the success value
    pub fn map<U, F>(self, f: F) -> AppResponse<U, AppError>
    where
        F: FnOnce(T) -> U,
        U: Serialize,
    {
        match self {
            AppResponse::Success(data) => AppResponse::Success(f(data)),
            AppResponse::Error(error) => AppResponse::Error(error),
        }
    }

    /// Map the error value
    pub fn map_err<F, E2>(self, f: F) -> AppResponse<T, E2>
    where
        F: FnOnce(AppError) -> E2,
    {
        match self {
            AppResponse::Success(data) => AppResponse::Success(data),
            AppResponse::Error(error) => AppResponse::Error(f(error)),
        }
    }

    /// Check if response is successful
    pub fn is_success(&self) -> bool {
        matches!(self, AppResponse::Success(_))
    }

    /// Check if response is an error
    pub fn is_error(&self) -> bool {
        matches!(self, AppResponse::Error(_))
    }

    /// Get the success value if present
    pub fn success(self) -> Option<T> {
        match self {
            AppResponse::Success(data) => Some(data),
            AppResponse::Error(_) => None,
        }
    }

    /// Get the error value if present
    pub fn get_error(self) -> Option<AppError> {
        match self {
            AppResponse::Success(_) => None,
            AppResponse::Error(error) => Some(error),
        }
    }
}

/// AppResponse with custom status code
pub struct AppResponseWithStatus<T> {
    pub response: AppResponse<T, AppError>,
    pub status: StatusCode,
}

impl<T> IntoResponse for AppResponse<T, AppError>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        match self {
            AppResponse::Success(data) => {
                let success_response = SuccessResponse::new(data);
                (StatusCode::OK, Json(success_response)).into_response()
            }
            AppResponse::Error(error) => error.into_response(),
        }
    }
}

impl<T> IntoResponse for AppResponseWithStatus<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        match self.response {
            AppResponse::Success(data) => {
                let success_response = SuccessResponse::new(data);
                (self.status, Json(success_response)).into_response()
            }
            AppResponse::Error(error) => error.into_response(),
        }
    }
}

// Convenient constructors
impl<T> AppResponse<T, AppError>
where
    T: Serialize,
{
    /// Create a paginated success response
    pub fn paginated(
        data: Vec<T>,
        page: u32,
        per_page: u32,
        total: u64,
    ) -> AppResponse<PaginatedResponse<T>, AppError> {
        AppResponse::Success(PaginatedResponse::new(data, page, per_page, total))
    }
}

// From implementations for easy conversion

impl<T> From<T> for AppResponse<T, AppError> {
    fn from(data: T) -> Self {
        AppResponse::Success(data)
    }
}

impl From<AppError> for AppResponse<(), AppError> {
    fn from(error: AppError) -> Self {
        AppResponse::Error(error)
    }
}

// Macros for convenient response creation
#[macro_export]
macro_rules! ok_response {
    ($data:expr) => {
        $crate::response::app_response::AppResponse::ok($data)
    };
}

#[macro_export]
macro_rules! error_response {
    ($error:expr) => {
        $crate::response::app_response::AppResponse::error($error)
    };
}

#[macro_export]
macro_rules! created_response {
    ($data:expr) => {
        $crate::response::app_response::AppResponse::created($data)
    };
}

#[macro_export]
macro_rules! not_found_response {
    ($resource:expr) => {
        $crate::response::app_response::AppResponse::error(
            $crate::response::error::AppError::not_found($resource),
        )
    };
}

#[macro_export]
macro_rules! validation_error_response {
    ($field:expr, $message:expr) => {
        $crate::response::app_response::AppResponse::error(
            $crate::response::error::AppError::validation_error($field, $message),
        )
    };
}

#[macro_export]
macro_rules! internal_error_response {
    ($message:expr) => {
        $crate::response::app_response::AppResponse::error(
            $crate::response::error::AppError::internal_error($message),
        )
    };
}

// Type aliases for common use cases
pub type JsonResponse<T> = AppResponse<T, AppError>;
pub type ApiResponse<T> = AppResponse<T, AppError>;
pub type ServiceResponse<T> = AppResponseResult<T, AppError>;

// Helper functions for common responses
pub fn success<T>(data: T) -> AppResponse<T, AppError>
where
    T: Serialize,
{
    AppResponse::ok(data)
}

pub fn created<T>(data: T) -> AppResponseWithStatus<T>
where
    T: Serialize,
{
    AppResponse::created(data)
}

pub fn error(error: AppError) -> AppResponse<(), AppError> {
    AppResponse::error(error)
}

pub fn not_found(resource: &str) -> AppResponse<(), AppError> {
    AppResponse::error(AppError::not_found(resource))
}

pub fn validation_error(field: &str, message: &str) -> AppResponse<(), AppError> {
    AppResponse::error(AppError::validation_error(field, message))
}

pub fn internal_error(message: &str) -> AppResponse<(), AppError> {
    AppResponse::error(AppError::internal_error(message))
}

pub fn bad_request(message: &str) -> AppResponse<(), AppError> {
    AppResponse::error(AppError::bad_request(message))
}

pub fn unauthorized() -> AppResponse<(), AppError> {
    AppResponse::error(AppError::Unauthorized)
}

pub fn forbidden(message: &str) -> AppResponse<(), AppError> {
    AppResponse::error(AppError::forbidden(message))
}

pub fn conflict(resource: &str) -> AppResponse<(), AppError> {
    AppResponse::error(AppError::conflict(resource))
}
