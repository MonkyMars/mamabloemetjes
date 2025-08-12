//! Backend library for the mamabloemetjes application
//!
//! This library provides order management, validation, and API response functionality.

pub mod pool;
pub mod response;
pub mod routes;
pub mod structs;
pub mod validate;

// Re-export commonly used items for convenience
pub use response::{ApiResponse, AppError, AppResponse};
pub use structs::order::{Address, Order, OrderContent, OrderStatus, ProductEntry};
pub use validate::order::validate_order;
