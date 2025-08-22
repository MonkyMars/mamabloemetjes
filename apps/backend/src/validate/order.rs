use crate::structs::{Address, IncomingOrder};
use once_cell::sync::Lazy;
use regex::Regex;
use rust_decimal::Decimal;
use std::collections::HashSet;
use thiserror::Error;
use validator::ValidationError;

#[derive(Error, Debug)]
pub enum OrderValidationError {
    #[error("Validation failed: {0}")]
    ValidationFailed(String),
    #[error("Invalid province: {0}. Must be one of the 12 Dutch provinces")]
    InvalidProvince(String),
    #[error("Invalid postal code: {0}. Must be in format 1234AB")]
    InvalidPostalCode(String),
    #[error("Invalid email format: {0}")]
    InvalidEmail(String),
    #[error("Invalid phone number: {0}")]
    InvalidPhoneNumber(String),
    #[error("Order total must be greater than 0")]
    InvalidOrderTotal,
    #[error("Order items cannot be empty")]
    EmptyOrderItems,
    #[error("Invalid product quantity: {0}. Must be greater than 0")]
    InvalidProductQuantity(i32),
    #[error("Order notes exceed maximum length of 1000 characters")]
    NotesTooLong,
    #[error("Street name cannot be empty")]
    EmptyStreet,
    #[error("House number cannot be empty")]
    EmptyHouseNumber,
    #[error("City name cannot be empty")]
    EmptyCity,
    #[error("City name is too long (max 100 characters)")]
    CityTooLong,
    #[error("Street name is too long (max 200 characters)")]
    StreetTooLong,
    #[error("House number is too long (max 20 characters)")]
    HouseNumberTooLong,
}

// Dutch provinces
static DUTCH_PROVINCES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    [
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
    ]
    .iter()
    .cloned()
    .collect()
});

// Dutch postal code regex: 4 digits followed by 2 letters
static POSTAL_CODE_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[1-9][0-9]{3}[A-Za-z]{2}$").unwrap());

// Dutch phone number regex (basic validation for common formats)
static PHONE_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^(\+31|0031|0)[1-9][0-9]{8}$|^(\+31|0031|0)[6][0-9]{8}$").unwrap());

// Email validation regex
static EMAIL_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap());

pub trait OrderValidator {
    fn validate_order(&self) -> Result<(), OrderValidationError>;
}

pub trait AddressValidator {
    fn validate_address(&self) -> Result<(), OrderValidationError>;
}

impl AddressValidator for Address {
    fn validate_address(&self) -> Result<(), OrderValidationError> {
        // Validate street
        if self.street.trim().is_empty() {
            return Err(OrderValidationError::EmptyStreet);
        }
        if self.street.len() > 200 {
            return Err(OrderValidationError::StreetTooLong);
        }

        // Validate house number
        if self.house_number.trim().is_empty() {
            return Err(OrderValidationError::EmptyHouseNumber);
        }
        if self.house_number.len() > 20 {
            return Err(OrderValidationError::HouseNumberTooLong);
        }

        // Validate postal code
        if !POSTAL_CODE_REGEX.is_match(&self.postal_code) {
            return Err(OrderValidationError::InvalidPostalCode(
                self.postal_code.clone(),
            ));
        }

        // Validate city
        if self.city.trim().is_empty() {
            return Err(OrderValidationError::EmptyCity);
        }
        if self.city.len() > 100 {
            return Err(OrderValidationError::CityTooLong);
        }

        // Validate province
        if !DUTCH_PROVINCES.contains(self.province.as_str()) {
            return Err(OrderValidationError::InvalidProvince(self.province.clone()));
        }

        Ok(())
    }
}

impl OrderValidator for IncomingOrder {
    fn validate_order(&self) -> Result<(), OrderValidationError> {
        // Validate price
        if self.price <= Decimal::ZERO {
            return Err(OrderValidationError::InvalidOrderTotal);
        }

        // Validate items are not empty
        if self.items.is_empty() {
            return Err(OrderValidationError::EmptyOrderItems);
        }

        // Validate each item
        for item in &self.items {
            for product in &item.product {
                if product.quantity <= 0 {
                    return Err(OrderValidationError::InvalidProductQuantity(
                        product.quantity,
                    ));
                }
            }
        }

        // Validate notes length
        if let Some(notes) = &self.notes {
            if notes.len() > 1000 {
                return Err(OrderValidationError::NotesTooLong);
            }
        }

        // Validate addresses
        self.shipping_address.validate_address()?;
        self.billing_address.validate_address()?;

        Ok(())
    }
}

/// Comprehensive order validation function
pub fn validate_complete_order(order: &IncomingOrder) -> Result<(), OrderValidationError> {
    order.validate_order()
}

/// Validate Dutch postal code
pub fn validate_postal_code(postal_code: &str) -> Result<(), OrderValidationError> {
    if !POSTAL_CODE_REGEX.is_match(postal_code) {
        return Err(OrderValidationError::InvalidPostalCode(
            postal_code.to_string(),
        ));
    }
    Ok(())
}

/// Validate Dutch province
pub fn validate_province(province: &str) -> Result<(), OrderValidationError> {
    if !DUTCH_PROVINCES.contains(province) {
        return Err(OrderValidationError::InvalidProvince(province.to_string()));
    }
    Ok(())
}

/// Validate Dutch phone number
pub fn validate_phone_number(phone: &str) -> Result<(), OrderValidationError> {
    if !PHONE_REGEX.is_match(phone) {
        return Err(OrderValidationError::InvalidPhoneNumber(phone.to_string()));
    }
    Ok(())
}

/// Validate email address
pub fn validate_email(email: &str) -> Result<(), OrderValidationError> {
    if !EMAIL_REGEX.is_match(email) {
        return Err(OrderValidationError::InvalidEmail(email.to_string()));
    }
    Ok(())
}

/// Get all valid Dutch provinces
pub fn get_valid_provinces() -> Vec<&'static str> {
    DUTCH_PROVINCES.iter().cloned().collect()
}

/// Check if a string is a valid Dutch postal code format
pub fn is_valid_postal_code(postal_code: &str) -> bool {
    POSTAL_CODE_REGEX.is_match(postal_code)
}

/// Check if a string is a valid Dutch province
pub fn is_valid_province(province: &str) -> bool {
    DUTCH_PROVINCES.contains(province)
}

/// Normalize postal code to standard format (uppercase letters)
pub fn normalize_postal_code(postal_code: &str) -> String {
    if postal_code.len() >= 6 {
        let (digits, letters) = postal_code.split_at(4);
        format!("{}{}", digits, letters.to_uppercase())
    } else {
        postal_code.to_uppercase()
    }
}

/// Validator for custom validation using the validator crate
pub fn validate_dutch_province(province: &str) -> Result<(), ValidationError> {
    if !DUTCH_PROVINCES.contains(province) {
        return Err(ValidationError::new("invalid_dutch_province"));
    }
    Ok(())
}

/// Validator for custom validation using the validator crate
pub fn validate_dutch_postal_code(postal_code: &str) -> Result<(), ValidationError> {
    if !POSTAL_CODE_REGEX.is_match(postal_code) {
        return Err(ValidationError::new("invalid_dutch_postal_code"));
    }
    Ok(())
}

/// Validator for custom validation using the validator crate
pub fn validate_dutch_phone(phone: &str) -> Result<(), ValidationError> {
    if !PHONE_REGEX.is_match(phone) {
        return Err(ValidationError::new("invalid_dutch_phone"));
    }
    Ok(())
}
