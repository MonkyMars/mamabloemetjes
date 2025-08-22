//! Comprehensive validation module for the mamabloemetjes backend
//!
//! This module provides thorough validation for:
//! - Dutch addresses (postal codes, provinces, house numbers)
//! - Order business logic (totals, quantities, constraints)
//! - General order validation
//!
//! All validation is designed to be plug-and-play and can be easily
//! integrated into existing application logic.

pub mod address;
pub mod business;
pub mod order;
pub mod structs;

// Re-export main validation traits and functions for convenience
pub use address::{
    AddressValidationError, AddressValidator, validate_dutch_city_name,
    validate_dutch_house_number, validate_dutch_postal_code, validate_dutch_province,
};

pub use business::{
    BusinessRules, BusinessValidationError, BusinessValidator, validate_complete_business_rules,
    validate_order_notes, validate_order_total, validate_product_quantity,
};

pub use order::{
    AddressValidator as OrderAddressValidator, OrderValidationError, OrderValidator,
    get_valid_provinces, is_valid_postal_code, is_valid_province, normalize_postal_code,
    validate_complete_order, validate_email, validate_phone_number, validate_postal_code,
    validate_province,
};

use crate::structs::{Address, IncomingOrder};
use thiserror::Error;

// Re-export validated structs for convenience
pub use structs::{
    AddressValidationRequest, EnhancedValidatedOrder, PostalCodeProvinceValidation,
    ValidatedAddress, ValidatedCustomer, ValidatedIncomingOrder, ValidatedOrderContent,
    ValidatedProductEntry,
};

/// Comprehensive validation error that encompasses all validation types
#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("Address validation failed: {0}")]
    Address(#[from] AddressValidationError),

    #[error("Business validation failed: {0}")]
    Business(#[from] BusinessValidationError),

    #[error("Order validation failed: {0}")]
    Order(#[from] OrderValidationError),
}

/// Complete validation result
pub type ValidationResult<T = ()> = Result<T, ValidationError>;

/// Main validation interface for complete order validation
pub struct MamabloemetjesValidator;

impl MamabloemetjesValidator {
    pub fn validate_complete_order(order: &IncomingOrder) -> ValidationResult {
        // Validate business rules first
        order.validate_business_rules()?;

        // Validate order structure and content
        order.validate_order()?;

        // Validate addresses specifically with Dutch rules
        AddressValidator::validate_dutch_address(
            &order.shipping_address.street,
            &order.shipping_address.house_number,
            &order.shipping_address.postal_code,
            &order.shipping_address.city,
            &order.shipping_address.province,
        )?;

        AddressValidator::validate_dutch_address(
            &order.billing_address.street,
            &order.billing_address.house_number,
            &order.billing_address.postal_code,
            &order.billing_address.city,
            &order.billing_address.province,
        )?;

        Ok(())
    }

    /// Validate only the address component
    pub fn validate_address(address: &Address) -> ValidationResult {
        AddressValidator::validate_dutch_address(
            &address.street,
            &address.house_number,
            &address.postal_code,
            &address.city,
            &address.province,
        )?;
        Ok(())
    }

    /// Validate only business rules
    pub fn validate_business_rules(order: &IncomingOrder) -> ValidationResult {
        order.validate_business_rules()?;
        Ok(())
    }

    /// Quick validation functions for individual components

    /// Validate Dutch postal code format and content
    pub fn is_valid_dutch_postal_code(postal_code: &str) -> bool {
        AddressValidator::is_valid_postal_code_format(postal_code)
    }

    /// Validate Dutch province name
    pub fn is_valid_dutch_province(province: &str) -> bool {
        AddressValidator::is_valid_province(province)
    }

    /// Get list of all valid Dutch provinces
    pub fn get_dutch_provinces() -> Vec<&'static str> {
        AddressValidator::get_valid_provinces()
    }

    /// Normalize postal code to standard format
    pub fn normalize_dutch_postal_code(postal_code: &str) -> String {
        AddressValidator::normalize_postal_code(postal_code)
    }

    /// Get province from postal code
    pub fn get_province_from_postal_code(postal_code: &str) -> Option<&'static str> {
        AddressValidator::get_province_from_postal_code(postal_code)
    }

    /// Validate that postal code matches province
    pub fn validate_postal_code_province_match(
        postal_code: &str,
        province: &str,
    ) -> ValidationResult {
        AddressValidator::validate_postal_code_province_match(postal_code, province)?;
        Ok(())
    }
}

/// Utility functions for common validation tasks

/// Check if an order meets all validation requirements
pub fn is_valid_order(order: &IncomingOrder) -> bool {
    MamabloemetjesValidator::validate_complete_order(order).is_ok()
}

/// Simple address validation function that takes an Address struct
pub fn validate_address(address: &Address) -> Result<(), ValidationError> {
    AddressValidator::validate_dutch_address(
        &address.street,
        &address.house_number,
        &address.postal_code,
        &address.city,
        &address.province,
    )?;
    Ok(())
}

/// Get detailed validation errors for an order
pub fn get_validation_errors(order: &IncomingOrder) -> Vec<String> {
    let mut errors = Vec::new();

    // Check business rules
    if let Err(e) = order.validate_business_rules() {
        errors.push(format!("Business rule violation: {}", e));
    }

    // Check order structure
    if let Err(e) = order.validate_order() {
        errors.push(format!("Order structure issue: {}", e));
    }

    // Check shipping address
    if let Err(e) = AddressValidator::validate_dutch_address(
        &order.shipping_address.street,
        &order.shipping_address.house_number,
        &order.shipping_address.postal_code,
        &order.shipping_address.city,
        &order.shipping_address.province,
    ) {
        errors.push(format!("Shipping address issue: {}", e));
    }

    // Check billing address
    if let Err(e) = AddressValidator::validate_dutch_address(
        &order.billing_address.street,
        &order.billing_address.house_number,
        &order.billing_address.postal_code,
        &order.billing_address.city,
        &order.billing_address.province,
    ) {
        errors.push(format!("Billing address issue: {}", e));
    }

    errors
}

/// Validation constants for easy access
pub mod constants {
    use rust_decimal::Decimal;

    pub const DUTCH_PROVINCES: &[&str] = &[
        "Noord-Holland",
        "Zuid-Holland",
        "Noord-Brabant",
        "Gelderland",
        "Utrecht",
        "Overijssel",
        "Limburg",
        "Friesland",
        "Groningen",
        "Drenthe",
        "Flevoland",
        "Zeeland",
    ];

    pub const MAX_ORDER_TOTAL: Decimal = Decimal::from_parts(5000000, 0, 0, false, 2); // €50,000.00
    pub const MIN_ORDER_TOTAL: Decimal = Decimal::from_parts(1, 0, 0, false, 2); // €0.01
    pub const MAX_ITEMS_PER_ORDER: usize = 100;
    pub const MAX_QUANTITY_PER_ITEM: i32 = 999;
    pub const MAX_NOTES_LENGTH: usize = 1000;
    pub const MAX_STREET_LENGTH: usize = 200;
    pub const MAX_CITY_LENGTH: usize = 100;
    pub const MAX_HOUSE_NUMBER_LENGTH: usize = 20;
}
