//! Validator derive structs for seamless integration with the validator crate
//!
//! This module provides structs with validator derive macros that can be used
//! directly in your application logic. These structs mirror the main structs
//! but include comprehensive validation annotations.

use crate::validate::{
    validate_dutch_city_name, validate_dutch_house_number, validate_dutch_postal_code,
    validate_dutch_province,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::{Validate, ValidationError};

/// Validated Dutch address struct with comprehensive validation
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct ValidatedAddress {
    #[validate(length(
        min = 1,
        max = 200,
        message = "Street name must be between 1 and 200 characters"
    ))]
    pub street: String,

    #[validate(length(
        min = 1,
        max = 20,
        message = "House number must be between 1 and 20 characters"
    ))]
    #[validate(custom(
        function = "validate_dutch_house_number",
        message = "Invalid Dutch house number format"
    ))]
    pub house_number: String,

    #[validate(custom(
        function = "validate_dutch_postal_code",
        message = "Invalid Dutch postal code format"
    ))]
    pub postal_code: String,

    #[validate(length(
        min = 1,
        max = 100,
        message = "City name must be between 1 and 100 characters"
    ))]
    #[validate(custom(
        function = "validate_dutch_city_name",
        message = "Invalid city name format"
    ))]
    pub city: String,

    #[validate(custom(
        function = "validate_dutch_province",
        message = "Invalid Dutch province"
    ))]
    pub province: String,
}

/// Validated product entry with quantity constraints
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct ValidatedProductEntry {
    pub product_id: Uuid,

    #[validate(range(min = 1, max = 999, message = "Quantity must be between 1 and 999"))]
    pub quantity: i32,
}

/// Validated order content with product validation
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct ValidatedOrderContent {
    #[validate(length(min = 1, message = "Product list cannot be empty"))]
    #[validate(nested)]
    pub product: Vec<ValidatedProductEntry>,
}

/// Validated incoming order with comprehensive validation
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct ValidatedIncomingOrder {
    #[validate(custom(function = "validate_user_id", message = "Invalid customer ID"))]
    pub user_id: Uuid,

    #[validate(custom(function = "validate_order_price", message = "Invalid order price"))]
    pub price: Decimal,

    #[validate(length(
        min = 1,
        max = 100,
        message = "Order must have between 1 and 100 items"
    ))]
    #[validate(nested)]
    pub items: Vec<ValidatedOrderContent>,

    #[validate(nested)]
    pub shipping_address: ValidatedAddress,

    #[validate(nested)]
    pub billing_address: ValidatedAddress,

    #[validate(length(max = 1000, message = "Notes cannot exceed 1000 characters"))]
    pub notes: Option<String>,
}

/// Validated customer information
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct ValidatedCustomer {
    pub id: Uuid,

    #[validate(length(
        min = 1,
        max = 200,
        message = "Name must be between 1 and 200 characters"
    ))]
    pub name: String,

    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    pub phone: Option<String>,

    #[validate(nested)]
    pub address: ValidatedAddress,
}

impl ValidatedCustomer {
    /// Additional validation for phone number if present
    pub fn validate_phone(&self) -> Result<(), ValidationError> {
        if let Some(phone_str) = &self.phone {
            validate_phone_field(phone_str)?;
        }
        Ok(())
    }

    /// Complete validation including phone
    pub fn validate_complete(&self) -> Result<(), validator::ValidationErrors> {
        self.validate()?;
        if let Err(_) = self.validate_phone() {
            let mut errors = validator::ValidationErrors::new();
            errors.add("phone", ValidationError::new("invalid_phone_number"));
            return Err(errors);
        }
        Ok(())
    }
}

/// Validation group for address-only validation
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct AddressValidationRequest {
    #[validate(nested)]
    pub address: ValidatedAddress,
}

/// Validation group for postal code and province matching
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct PostalCodeProvinceValidation {
    #[validate(custom(
        function = "validate_dutch_postal_code",
        message = "Invalid Dutch postal code format"
    ))]
    pub postal_code: String,

    #[validate(custom(
        function = "validate_dutch_province",
        message = "Invalid Dutch province"
    ))]
    pub province: String,
}

/// Custom validation functions for complex business rules

/// Validate that postal code matches province
pub fn validate_postal_code_province_match(
    postal_code: &str,
    province: &str,
) -> Result<(), ValidationError> {
    use crate::validate::AddressValidator;

    match AddressValidator::validate_postal_code_province_match(postal_code, province) {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new("postal_code_province_mismatch")),
    }
}

/// Validate order total with decimal precision
pub fn validate_order_total_precision(price: &Decimal) -> Result<(), ValidationError> {
    if price.scale() > 2 {
        return Err(ValidationError::new("invalid_price_precision"));
    }
    Ok(())
}

/// Validate phone number format
pub fn validate_phone_field(phone: &str) -> Result<(), ValidationError> {
    use crate::validate::validate_phone_number as validate_phone;
    match validate_phone(phone) {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new("invalid_phone_number")),
    }
}

/// Validate order price constraints
pub fn validate_order_price(price: &Decimal) -> Result<(), ValidationError> {
    use crate::validate::validate_order_total;
    match validate_order_total(*price) {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new("invalid_order_price")),
    }
}

/// Validate that customer ID is not nil
pub fn validate_user_id(user_id: &Uuid) -> Result<(), ValidationError> {
    if user_id.is_nil() {
        return Err(ValidationError::new("invalid_user_id"));
    }
    Ok(())
}

/// Enhanced validated incoming order with additional business rule validations
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct EnhancedValidatedOrder {
    #[validate(custom(function = "validate_user_id", message = "Invalid customer ID"))]
    pub user_id: Uuid,

    #[validate(custom(function = "validate_order_price", message = "Invalid order price"))]
    #[validate(custom(
        function = "validate_order_total_precision",
        message = "Price can have maximum 2 decimal places"
    ))]
    pub price: Decimal,

    #[validate(length(
        min = 1,
        max = 100,
        message = "Order must have between 1 and 100 items"
    ))]
    #[validate(nested)]
    pub items: Vec<ValidatedOrderContent>,

    #[validate(nested)]
    pub shipping_address: ValidatedAddress,

    #[validate(nested)]
    pub billing_address: ValidatedAddress,

    #[validate(length(max = 1000, message = "Notes cannot exceed 1000 characters"))]
    pub notes: Option<String>,
}

/// Implementation for converting between validated and non-validated structs
impl From<ValidatedAddress> for crate::structs::Address {
    fn from(validated: ValidatedAddress) -> Self {
        Self {
            street: validated.street,
            house_number: validated.house_number,
            postal_code: validated.postal_code,
            city: validated.city,
            province: validated.province,
        }
    }
}

impl From<crate::structs::Address> for ValidatedAddress {
    fn from(address: crate::structs::Address) -> Self {
        Self {
            street: address.street,
            house_number: address.house_number,
            postal_code: address.postal_code,
            city: address.city,
            province: address.province,
        }
    }
}

impl From<ValidatedProductEntry> for crate::structs::ProductEntry {
    fn from(validated: ValidatedProductEntry) -> Self {
        Self {
            product_id: validated.product_id,
            quantity: validated.quantity,
        }
    }
}

impl From<crate::structs::ProductEntry> for ValidatedProductEntry {
    fn from(entry: crate::structs::ProductEntry) -> Self {
        Self {
            product_id: entry.product_id,
            quantity: entry.quantity,
        }
    }
}

impl From<ValidatedOrderContent> for crate::structs::OrderContent {
    fn from(validated: ValidatedOrderContent) -> Self {
        Self {
            product: validated.product.into_iter().map(Into::into).collect(),
        }
    }
}

impl From<crate::structs::OrderContent> for ValidatedOrderContent {
    fn from(content: crate::structs::OrderContent) -> Self {
        Self {
            product: content.product.into_iter().map(Into::into).collect(),
        }
    }
}

impl From<ValidatedIncomingOrder> for crate::structs::IncomingOrder {
    fn from(validated: ValidatedIncomingOrder) -> Self {
        Self {
            user_id: validated.user_id,
            price: validated.price,
            items: validated.items.into_iter().map(Into::into).collect(),
            shipping_address: validated.shipping_address.into(),
            billing_address: validated.billing_address.into(),
            notes: validated.notes,
        }
    }
}

impl From<crate::structs::IncomingOrder> for ValidatedIncomingOrder {
    fn from(order: crate::structs::IncomingOrder) -> Self {
        Self {
            user_id: order.user_id,
            price: order.price,
            items: order.items.into_iter().map(Into::into).collect(),
            shipping_address: order.shipping_address.into(),
            billing_address: order.billing_address.into(),
            notes: order.notes,
        }
    }
}

/// Utility functions for validation
impl ValidatedIncomingOrder {
    /// Validate and convert from non-validated order
    pub fn from_order(
        order: crate::structs::IncomingOrder,
    ) -> Result<Self, validator::ValidationErrors> {
        let validated: Self = order.into();
        validated.validate()?;
        Ok(validated)
    }

    /// Convert to non-validated order after validation
    pub fn into_order(self) -> Result<crate::structs::IncomingOrder, validator::ValidationErrors> {
        self.validate()?;
        Ok(self.into())
    }
}

impl ValidatedAddress {
    /// Validate and convert from non-validated address
    pub fn from_address(
        address: crate::structs::Address,
    ) -> Result<Self, validator::ValidationErrors> {
        let validated: Self = address.into();
        validated.validate()?;
        Ok(validated)
    }

    /// Convert to non-validated address after validation
    pub fn into_address(self) -> Result<crate::structs::Address, validator::ValidationErrors> {
        self.validate()?;
        Ok(self.into())
    }

    /// Get normalized postal code
    pub fn normalized_postal_code(&self) -> String {
        use crate::validate::AddressValidator;
        AddressValidator::normalize_postal_code(&self.postal_code)
    }

    /// Check if postal code matches province
    pub fn is_postal_code_province_match(&self) -> bool {
        use crate::validate::AddressValidator;
        AddressValidator::validate_postal_code_province_match(&self.postal_code, &self.province)
            .is_ok()
    }
}
