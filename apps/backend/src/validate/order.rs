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

    // Validate email format
    if !is_valid_email(&order.email) {
        return Err(AppError::validation_error(
            "email",
            "Must be a valid email address",
        ));
    }

    // Validate price range
    let min_price = Decimal::from_str("0.01").unwrap();
    let max_price = Decimal::from_str("1000000.00").unwrap();
    if order.price < min_price || order.price > max_price {
        return Err(AppError::validation_error(
            "price",
            "Price must be between $0.01 and $1,000,000",
        ));
    }

    // Validate address fields
    if order.address.street.len() > 100 {
        return Err(AppError::validation_error(
            "street",
            "Street cannot exceed 100 characters",
        ));
    }

    if order.address.city.len() > 50 {
        return Err(AppError::validation_error(
            "city",
            "City cannot exceed 50 characters",
        ));
    }

    let valid_provinces: Vec<String> = vec![
        "Noord Brabant".into(),
        "Zuid Holland".into(),
        "Noord Holland".into(),
        "Gelderland".into(),
        "Utrecht".into(),
        "Overijssel".into(),
        "Limburg".into(),
        "Drenthe".into(),
        "Flevoland".into(),
        "Friesland".into(),
        "Groningen".into(),
        "Zeeland".into(),
    ];

    if order.address.province.len() < 2 || order.address.province.len() > 20 {
        return Err(AppError::validation_error(
            "province",
            "Province must be between 2 and 20 characters",
        ));
    }

    if !valid_provinces.contains(&order.address.province) {
        return Err(AppError::validation_error(
            "province",
            "Province must be one of the valid Dutch provinces",
        ));
    }

    if order.address.zip.replace(" ", "").len() == 6 {
        return Err(AppError::validation_error(
            "zip",
            "ZIP code must be between 6 characters excluding spaces",
        ));
    }

    // Validate ZIP format (1234 AB or 1234AB)
    if !is_valid_zip(&order.address.zip) {
        return Err(AppError::validation_error(
            "zip",
            "ZIP code must be in format 1234 AB or 1234AB",
        ));
    }

    Ok(())
}

/// Basic email validation
fn is_valid_email(email: &str) -> bool {
    if email.len() < 5 {
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
    if local.is_empty() || local.starts_with('.') || local.ends_with('.') {
        return false;
    }

    // Domain part validation
    if domain.is_empty()
        || !domain.contains('.')
        || domain.starts_with('.')
        || domain.ends_with('.')
    {
        return false;
    }

    true
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
        if content_item.product_ids.is_empty() {
            return Err(AppError::validation_error(
                "content",
                &format!(
                    "Order content item {} must contain at least one product",
                    index + 1
                ),
            ));
        }

        // Validate each product entry
        for (product_index, product_entry) in content_item.product_ids.iter().enumerate() {
            if product_entry.count <= 0 {
                return Err(AppError::validation_error(
                    "product_count",
                    &format!(
                        "Product {} in content item {} must have a positive count",
                        product_index + 1,
                        index + 1
                    ),
                ));
            }

            if product_entry.count > 1000 {
                return Err(AppError::validation_error(
                    "product_count",
                    &format!(
                        "Product {} in content item {} cannot have more than 1000 items",
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
    // Validate price consistency
    let zero = Decimal::ZERO;
    let max_price = Decimal::from_str("1000000.00").unwrap();

    if order.price <= zero {
        return Err(AppError::validation_error(
            "price",
            "Order price must be greater than 0",
        ));
    }

    if order.price > max_price {
        return Err(AppError::validation_error(
            "price",
            "Order price cannot exceed $1,000,000",
        ));
    }

    // Validate email format (additional check beyond basic validation)
    if !is_valid_email_domain(&order.email) {
        return Err(AppError::validation_error(
            "email",
            "Email domain is not allowed",
        ));
    }

    // Validate name doesn't contain only whitespace
    if order.name.trim().is_empty() {
        return Err(AppError::validation_error(
            "name",
            "Name cannot be empty or contain only whitespace",
        ));
    }

    // Validate address completeness
    validate_address_completeness(&order.address)?;

    Ok(())
}

/// Validates Dutch ZIP code format
fn is_valid_zip(zip: &str) -> bool {
    // Remove spaces and convert to uppercase for consistent checking
    let zip_cleaned = zip.replace(" ", "").to_uppercase();

    if zip_cleaned.len() != 6 {
        return false;
    }

    let (digits, letters) = zip_cleaned.split_at(4);

    // Dutch postal codes: 4 digits (1000-9999) + 2 letters (AA-ZZ, excluding SA, SD, SS)
    digits.chars().all(|c| c.is_ascii_digit())
        && letters.chars().all(|c| c.is_ascii_uppercase())
        && digits >= "1000" && digits <= "9999"  // Valid range
        && !matches!(letters, "SA" | "SD" | "SS") // Excluded combinations
}

/// Additional email domain validation
fn is_valid_email_domain(email: &str) -> bool {
    // Basic domain validation - could be extended with blacklist/whitelist in the future
    let domain_part = email.split('@').nth(1).unwrap_or("");

    // Check for basic domain structure
    domain_part.contains('.')
        && !domain_part.starts_with('.')
        && !domain_part.ends_with('.')
        && domain_part.len() > 3
}

/// Validates address completeness and format
fn validate_address_completeness(address: &crate::structs::order::Address) -> Result<(), AppError> {
    // Check for whitespace-only fields
    if address.street.trim().is_empty() {
        return Err(AppError::validation_error(
            "street",
            "Street address cannot be empty",
        ));
    }

    if address.city.trim().is_empty() {
        return Err(AppError::validation_error("city", "City cannot be empty"));
    }

    if address.province.trim().is_empty() {
        return Err(AppError::validation_error("state", "State cannot be empty"));
    }

    // Additional ZIP code validation
    let zip_trimmed = address.zip.trim();
    if zip_trimmed.is_empty() {
        return Err(AppError::validation_error(
            "zip",
            "ZIP code cannot be empty",
        ));
    }

    // Validate ZIP format more strictly
    if !zip_trimmed.chars().all(|c| c.is_ascii_digit() || c == '-') {
        return Err(AppError::validation_error(
            "zip",
            "ZIP code can only contain digits and hyphens",
        ));
    }

    Ok(())
}
