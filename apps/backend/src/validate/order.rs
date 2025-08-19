use crate::response::AppError;
use crate::structs::order::Order;
use rust_decimal::Decimal;
use std::str::FromStr;

/// Validates an order and returns detailed validation errors if any
pub fn validate_order(order: &Order) -> Result<(), AppError> {
    // Perform all custom validations
    validate_basic_fields(order)?;
    validate_order_content(order)?;
    validate_business_rules(order)?;

    Ok(())
}

/// Validates basic field requirements
fn validate_basic_fields(order: &Order) -> Result<(), AppError> {
    // Validate name
    if order.name.len() > 100 {
        return Err(AppError::validation_error(
            "name",
            "Name cannot exceed 100 characters",
        ));
    }

    // Validate name doesn't contain only whitespace
    if order.name.trim().is_empty() {
        return Err(AppError::validation_error(
            "name",
            "Name cannot be empty or contain only whitespace",
        ));
    }

    // Validate email format
    if !is_valid_email(&order.email) {
        return Err(AppError::validation_error(
            "email",
            "Must be a valid email address",
        ));
    }

    // Validate address fields
    validate_address_fields(&order.address)?;

    Ok(())
}

/// Validates address field requirements
fn validate_address_fields(address: &crate::structs::order::Address) -> Result<(), AppError> {
    // Validate street
    if address.street.len() > 100 {
        return Err(AppError::validation_error(
            "street",
            "Street cannot exceed 100 characters",
        ));
    }

    if address.street.trim().is_empty() {
        return Err(AppError::validation_error(
            "street",
            "Street address cannot be empty",
        ));
    }

    // Validate city
    if address.city.len() > 50 {
        return Err(AppError::validation_error(
            "city",
            "City cannot exceed 50 characters",
        ));
    }

    if address.city.trim().is_empty() {
        return Err(AppError::validation_error("city", "City cannot be empty"));
    }

    // Validate province
    if address.province.len() < 2 || address.province.len() > 20 {
        return Err(AppError::validation_error(
            "province",
            "Province must be between 2 and 20 characters",
        ));
    }

    if address.province.trim().is_empty() {
        return Err(AppError::validation_error(
            "province",
            "Province cannot be empty",
        ));
    }

    if !is_valid_dutch_province(&address.province) {
        return Err(AppError::validation_error(
            "province",
            "Province must be one of the valid Dutch provinces",
        ));
    }

    // Validate ZIP
    if address.zip.replace(" ", "").len() != 6 {
        return Err(AppError::validation_error(
            "zip",
            "ZIP code must be 6 characters excluding spaces",
        ));
    }

    if !is_valid_dutch_zip(&address.zip) {
        return Err(AppError::validation_error(
            "zip",
            "ZIP code must be in format 1234 AB or 1234AB",
        ));
    }

    Ok(())
}

/// Validates Dutch province names (case-insensitive with common variations)
fn is_valid_dutch_province(province: &str) -> bool {
    let normalized = province
        .to_lowercase()
        .replace("-", " ")
        .replace("  ", " ")
        .trim()
        .to_string();

    let valid_provinces = [
        "noord brabant",
        "zuid holland",
        "noord holland",
        "gelderland",
        "utrecht",
        "overijssel",
        "limburg",
        "drenthe",
        "flevoland",
        "friesland",
        "groningen",
        "zeeland",
    ];

    valid_provinces.contains(&normalized.as_str())
}

/// Comprehensive email validation
fn is_valid_email(email: &str) -> bool {
    if email.len() < 5 || email.len() > 254 {
        return false;
    }

    let at_count = email.matches('@').count();
    if at_count != 1 {
        return false;
    }

    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return false;
    }

    let local = parts[0];
    let domain = parts[1];

    // Local part validation
    if local.is_empty()
        || local.len() > 64
        || local.starts_with('.')
        || local.ends_with('.')
        || local.contains("..")
    {
        return false;
    }

    // Domain part validation
    if domain.is_empty()
        || domain.len() > 253
        || !domain.contains('.')
        || domain.starts_with('.')
        || domain.ends_with('.')
        || domain.contains("..")
        || domain.starts_with('-')
        || domain.ends_with('-')
    {
        return false;
    }

    // Additional domain checks
    is_valid_email_domain(domain)
}

/// Additional email domain validation
fn is_valid_email_domain(domain: &str) -> bool {
    // Split domain into parts
    let parts: Vec<&str> = domain.split('.').collect();

    // Must have at least 2 parts (e.g., example.com)
    if parts.len() < 2 {
        return false;
    }

    // Each part must be valid
    for part in &parts {
        if part.is_empty() || part.len() > 63 || part.starts_with('-') || part.ends_with('-') {
            return false;
        }

        // Must contain only valid characters
        if !part.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
            return false;
        }
    }

    // TLD (last part) must be at least 2 characters and not all digits
    let tld = parts.last().unwrap();
    tld.len() >= 2 && !tld.chars().all(|c| c.is_ascii_digit())
}

/// Validates order content and product entries
fn validate_order_content(order: &Order) -> Result<(), AppError> {
    if order.content.is_empty() {
        return Err(AppError::validation_error(
            "content",
            "Order must contain at least one item",
        ));
    }

    for (index, content_item) in order.content.iter().enumerate() {
        if content_item.product.is_empty() {
            return Err(AppError::validation_error(
                "content",
                &format!(
                    "Order content item {} must contain at least one product",
                    index + 1
                ),
            ));
        }

        // Validate each product entry
        for (product_index, product_entry) in content_item.product.iter().enumerate() {
            if product_entry.quantity <= 0 {
                return Err(AppError::validation_error(
                    "product_count",
                    &format!(
                        "Product {} in content item {} must have a positive count",
                        product_index + 1,
                        index + 1
                    ),
                ));
            }

            if product_entry.quantity > 50 {
                return Err(AppError::validation_error(
                    "product_count",
                    &format!(
                        "Product {} in content item {} cannot have more than 50 items",
                        product_index + 1,
                        index + 1
                    ),
                ));
            }
        }
    }

    Ok(())
}

/// Validates business rules for orders
fn validate_business_rules(order: &Order) -> Result<(), AppError> {
    // Validate price consistency and business rules
    let min_price = Decimal::from_str("0.01").unwrap();
    let max_price = Decimal::from_str("1000000.00").unwrap();

    if order.price < min_price {
        return Err(AppError::validation_error(
            "price",
            "Order price must be at least $0.01",
        ));
    }

    if order.price > max_price {
        return Err(AppError::validation_error(
            "price",
            "Order price cannot exceed $1,000,000",
        ));
    }

    Ok(())
}

/// Validates Dutch ZIP code format
fn is_valid_dutch_zip(zip: &str) -> bool {
    // Remove spaces and convert to uppercase for consistent checking
    let zip_cleaned = zip.replace(" ", "").to_uppercase();

    if zip_cleaned.len() != 6 {
        return false;
    }

    let (digits, letters) = zip_cleaned.split_at(4);

    // Dutch postal codes: 4 digits (1000-9999) + 2 letters (AA-ZZ, excluding SA, SD, SS)
    if !digits.chars().all(|c| c.is_ascii_digit()) {
        return false;
    }

    if !letters.chars().all(|c| c.is_ascii_uppercase()) {
        return false;
    }

    // Valid digit range check
    if let Ok(num) = digits.parse::<u16>() {
        if num < 1000 || num > 9999 {
            return false;
        }
    } else {
        return false;
    }

    // Excluded letter combinations
    !matches!(letters, "SA" | "SD" | "SS")
}
