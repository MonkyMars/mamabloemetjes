pub mod app_response;
pub mod error;
pub mod success;

// Re-export commonly used types
pub use app_response::{
    ApiResponse, AppResponse, AppResponseResult, AppResponseWithStatus, JsonResponse,
    ServiceResponse,
};
pub use error::{AppError, AppResult, ErrorResponse};
pub use success::{
    ApiPaginated, ApiSuccess, EmptyResponse, HealthCheckResponse, PaginatedResponse,
    PaginationMeta, SuccessResponse, SuccessResponseWithStatus,
};

// Re-export utility functions
pub use app_response::{
    bad_request, conflict, created, error, forbidden, internal_error, not_found, success,
    unauthorized, validation_error,
};

// Re-export macros
pub use crate::{
    created_response, error_response, internal_error_response, not_found_response, ok_response,
    validation_error_response,
};
