// Usage Example for Mamabloemetjes Order Validation
//
// This file demonstrates how to use the comprehensive validation system
// for orders with Dutch addresses and business rules.

use backend_test::structs::{Address, IncomingOrder, OrderContent, ProductEntry};
use backend_test::validate::{MamabloemetjesValidator, is_valid_order, validate_address};
use rust_decimal::Decimal;
use uuid::Uuid;

fn main() {
    println!("🌷 Mamabloemetjes Order Validation Examples\n");

    // Example 1: Simple Address Validation
    address_validation_example();

    // Example 2: Complete Order Validation
    complete_order_validation_example();

    // Example 3: Error Handling
    error_handling_example();
}

fn address_validation_example() {
    println!("📍 Example 1: Address Validation");
    println!("================================");

    // Valid Dutch address
    let valid_address = Address {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "1012AB".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };

    // This is the simple function you requested
    if let Err(err) = validate_address(&valid_address) {
        println!("❌ Address validation failed: {}", err);
    } else {
        println!(
            "✅ Valid address: {} {}, {} {}",
            valid_address.street,
            valid_address.house_number,
            valid_address.postal_code,
            valid_address.city
        );
    }

    // Invalid address example
    let invalid_address = Address {
        street: "".to_string(), // Empty street
        house_number: "123".to_string(),
        postal_code: "0123AB".to_string(), // Invalid: starts with 0
        city: "Amsterdam".to_string(),
        province: "Invalid Province".to_string(), // Invalid province
    };

    if let Err(err) = validate_address(&invalid_address) {
        println!("❌ Invalid address error: {}", err);
    }

    println!();
}

fn complete_order_validation_example() {
    println!("📦 Example 2: Complete Order Validation");
    println!("=======================================");

    let shipping_address = Address {
        street: "Vondelpark".to_string(),
        house_number: "1".to_string(),
        postal_code: "1071AA".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };

    let billing_address = Address {
        street: "Leidseplein".to_string(),
        house_number: "26".to_string(),
        postal_code: "1017PT".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };

    // Validate addresses individually
    println!("Validating shipping address...");
    if let Err(err) = validate_address(&shipping_address) {
        println!("❌ Shipping address validation failed: {}", err);
        return;
    }
    println!("✅ Shipping address is valid");

    println!("Validating billing address...");
    if let Err(err) = validate_address(&billing_address) {
        println!("❌ Billing address validation failed: {}", err);
        return;
    }
    println!("✅ Billing address is valid");

    // Create a complete order
    let order = IncomingOrder {
        customer_id: Uuid::new_v4(),
        price: Decimal::new(4999, 2), // €49.99
        items: vec![OrderContent {
            product: vec![
                ProductEntry {
                    product_id: Uuid::new_v4(),
                    quantity: 2,
                },
                ProductEntry {
                    product_id: Uuid::new_v4(),
                    quantity: 1,
                },
            ],
        }],
        shipping_address,
        billing_address,
        notes: Some("Special delivery instructions: Handle with care".to_string()),
    };

    // Validate complete order
    match MamabloemetjesValidator::validate_complete_order(&order) {
        Ok(_) => println!("✅ Complete order validation passed!"),
        Err(err) => println!("❌ Order validation failed: {}", err),
    }

    // Quick validation check
    if is_valid_order(&order) {
        println!("✅ Order is ready for processing");
    } else {
        println!("❌ Order has validation issues");
    }

    println!();
}

fn error_handling_example() {
    println!("⚠️  Example 3: Error Handling");
    println!("=============================");

    // Example with multiple validation errors
    let problematic_order = IncomingOrder {
        customer_id: Uuid::nil(),     // Invalid: nil UUID
        price: Decimal::new(-100, 2), // Invalid: negative price
        items: vec![],                // Invalid: empty items
        shipping_address: Address {
            street: "".to_string(),                 // Invalid: empty
            house_number: "0".to_string(),          // Invalid: starts with 0
            postal_code: "0000XX".to_string(),      // Invalid: format
            city: "".to_string(),                   // Invalid: empty
            province: "Not a Province".to_string(), // Invalid: not Dutch province
        },
        billing_address: Address {
            street: "Valid Street".to_string(),
            house_number: "123".to_string(),
            postal_code: "1234AB".to_string(),
            city: "Amsterdam".to_string(),
            province: "Zuid-Holland".to_string(), // Different from postal code
        },
        notes: Some("A".repeat(1001)), // Invalid: too long
    };

    // Get detailed validation errors
    let errors = backend_test::validate::get_validation_errors(&problematic_order);

    println!("Found {} validation errors:", errors.len());
    for (i, error) in errors.iter().enumerate() {
        println!("{}. {}", i + 1, error);
    }

    println!();

    // Example usage in a handler function (pseudo-code)
    println!("💡 Usage in Application Code:");
    println!("=============================");
    println!(
        r#"
// In your order handler:
pub async fn create_order(payload: IncomingOrder) -> AppResponse {{
    // Validate shipping address
    if let Err(err) = validate_address(&payload.shipping_address) {{
        return AppResponse::Error(AppError::ValidationError(format!(
            "Shipping address validation failed: {{}}",
            err
        )));
    }}

    // Validate billing address
    if let Err(err) = validate_address(&payload.billing_address) {{
        return AppResponse::Error(AppError::ValidationError(format!(
            "Billing address validation failed: {{}}",
            err
        )));
    }}

    // Validate complete order
    if let Err(err) = MamabloemetjesValidator::validate_complete_order(&payload) {{
        return AppResponse::Error(AppError::ValidationError(format!(
            "Order validation failed: {{}}",
            err
        )));
    }}

    // Process the valid order...
    AppResponse::Success("Order created successfully".to_string())
}}
"#
    );

    println!("🎯 Available Validation Functions:");
    println!("=================================");
    println!("• validate_address(&address) - Simple address validation");
    println!("• MamabloemetjesValidator::validate_complete_order(&order) - Full validation");
    println!("• is_valid_order(&order) - Quick boolean check");
    println!("• get_validation_errors(&order) - Detailed error list");
    println!("• MamabloemetjesValidator::is_valid_dutch_postal_code(code) - Postal code check");
    println!("• MamabloemetjesValidator::is_valid_dutch_province(province) - Province check");
    println!("• MamabloemetjesValidator::normalize_dutch_postal_code(code) - Format postal code");

    println!("\n🌷 All validation is designed for Dutch addresses and business rules!");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_example_validations() {
        // Test that our examples actually work
        let valid_address = Address {
            street: "Test Street".to_string(),
            house_number: "123".to_string(),
            postal_code: "1234AB".to_string(),
            city: "Amsterdam".to_string(),
            province: "Noord-Holland".to_string(),
        };

        assert!(validate_address(&valid_address).is_ok());

        let invalid_address = Address {
            street: "".to_string(),
            house_number: "123".to_string(),
            postal_code: "1234AB".to_string(),
            city: "Amsterdam".to_string(),
            province: "Noord-Holland".to_string(),
        };

        assert!(validate_address(&invalid_address).is_err());
    }
}
