use mamabloemetjes_backend::structs::{Address, IncomingOrder, OrderContent, ProductEntry};
use mamabloemetjes_backend::validate::*;
use rust_decimal::Decimal;
use uuid::Uuid;
use validator::Validate;

// Helper functions for creating test data
fn create_valid_address() -> Address {
    Address {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "1012AB".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    }
}

fn create_test_order() -> IncomingOrder {
    let product_entry = ProductEntry {
        product_id: Uuid::new_v4(),
        quantity: 2,
    };

    let order_content = OrderContent {
        product: vec![product_entry],
    };

    IncomingOrder {
        customer_id: Uuid::new_v4(),
        price: Decimal::new(2999, 2), // €29.99
        items: vec![order_content],
        shipping_address: create_valid_address(),
        billing_address: create_valid_address(),
        notes: Some("Test order".to_string()),
    }
}

// Address validation tests
#[test]
fn test_validate_address_success() {
    let address = create_valid_address();
    assert!(validate_address(&address).is_ok());
}

#[test]
fn test_validate_address_invalid_postal_code() {
    let mut address = create_valid_address();
    address.postal_code = "0123AB".to_string(); // Invalid: starts with 0
    assert!(validate_address(&address).is_err());
}

#[test]
fn test_validate_address_invalid_province() {
    let mut address = create_valid_address();
    address.province = "Invalid Province".to_string();
    assert!(validate_address(&address).is_err());
}

#[test]
fn test_validate_address_empty_street() {
    let mut address = create_valid_address();
    address.street = "".to_string();
    assert!(validate_address(&address).is_err());
}

#[test]
fn test_validate_address_empty_city() {
    let mut address = create_valid_address();
    address.city = "".to_string();
    assert!(validate_address(&address).is_err());
}

// Postal code validation tests
#[test]
fn test_valid_postal_codes() {
    assert!(AddressValidator::is_valid_postal_code_format("1234AB"));
    assert!(AddressValidator::is_valid_postal_code_format("5678CD"));
    assert!(AddressValidator::is_valid_postal_code_format("9999ZZ"));
    assert!(AddressValidator::is_valid_postal_code_format("1000AA"));
}

#[test]
fn test_invalid_postal_codes() {
    assert!(!AddressValidator::is_valid_postal_code_format("0123AB")); // starts with 0
    assert!(!AddressValidator::is_valid_postal_code_format("12345A")); // wrong format
    assert!(!AddressValidator::is_valid_postal_code_format("ABCD12")); // wrong format
    assert!(!AddressValidator::is_valid_postal_code_format("123AB")); // too short
    assert!(!AddressValidator::is_valid_postal_code_format("1234A")); // missing letter
}

#[test]
fn test_postal_code_normalization() {
    assert_eq!(AddressValidator::normalize_postal_code("1234ab"), "1234AB");
    assert_eq!(AddressValidator::normalize_postal_code("5678CD"), "5678CD");
    assert_eq!(AddressValidator::normalize_postal_code("9999zz"), "9999ZZ");
}

// Province validation tests
#[test]
fn test_valid_provinces() {
    assert!(AddressValidator::is_valid_province("Noord-Holland"));
    assert!(AddressValidator::is_valid_province("Zuid-Holland"));
    assert!(AddressValidator::is_valid_province("Utrecht"));
    assert!(AddressValidator::is_valid_province("Gelderland"));
    assert!(AddressValidator::is_valid_province("Noord-Brabant"));
    assert!(AddressValidator::is_valid_province("Overijssel"));
    assert!(AddressValidator::is_valid_province("Limburg"));
    assert!(AddressValidator::is_valid_province("Friesland"));
    assert!(AddressValidator::is_valid_province("Groningen"));
    assert!(AddressValidator::is_valid_province("Drenthe"));
    assert!(AddressValidator::is_valid_province("Flevoland"));
    assert!(AddressValidator::is_valid_province("Zeeland"));
}

#[test]
fn test_invalid_provinces() {
    assert!(!AddressValidator::is_valid_province("North Holland")); // English
    assert!(!AddressValidator::is_valid_province("Amsterdam")); // City, not province
    assert!(!AddressValidator::is_valid_province("")); // Empty
    assert!(!AddressValidator::is_valid_province("Randstad")); // Region, not province
}

// House number validation tests
#[test]
fn test_house_number_validation() {
    assert!(AddressValidator::validate_house_number("123").is_ok());
    assert!(AddressValidator::validate_house_number("123A").is_ok());
    assert!(AddressValidator::validate_house_number("123-1").is_ok());
    assert!(AddressValidator::validate_house_number("1").is_ok());

    assert!(AddressValidator::validate_house_number("").is_err()); // Empty
    assert!(AddressValidator::validate_house_number("0").is_err()); // Starts with 0
    assert!(AddressValidator::validate_house_number("ABC").is_err()); // No numbers
}

// City name validation tests
#[test]
fn test_city_name_validation() {
    assert!(AddressValidator::validate_city("Amsterdam").is_ok());
    assert!(AddressValidator::validate_city("Den Haag").is_ok());
    assert!(AddressValidator::validate_city("'s-Hertogenbosch").is_ok());
    assert!(AddressValidator::validate_city("Nieuw-Amsterdam").is_ok());

    assert!(AddressValidator::validate_city("").is_err()); // Empty
    assert!(AddressValidator::validate_city("City123").is_err()); // Numbers
    assert!(AddressValidator::validate_city("City@Name").is_err()); // Special chars
}

// Postal code and province matching tests
#[test]
fn test_province_from_postal_code() {
    assert_eq!(
        AddressValidator::get_province_from_postal_code("1012AB"),
        Some("Noord-Holland")
    );
    assert_eq!(
        AddressValidator::get_province_from_postal_code("2500AB"),
        Some("Zuid-Holland")
    );
    assert_eq!(
        AddressValidator::get_province_from_postal_code("5000AB"),
        Some("Noord-Brabant")
    );
}

#[test]
fn test_postal_code_province_match() {
    assert!(
        AddressValidator::validate_postal_code_province_match("1012AB", "Noord-Holland").is_ok()
    );
    assert!(
        AddressValidator::validate_postal_code_province_match("2500AB", "Zuid-Holland").is_ok()
    );

    assert!(
        AddressValidator::validate_postal_code_province_match("1012AB", "Zuid-Holland").is_err()
    );
}

// Complete address validation tests
#[test]
fn test_complete_address_validation() {
    assert!(
        AddressValidator::validate_dutch_address(
            "Damrak",
            "123",
            "1012AB",
            "Amsterdam",
            "Noord-Holland"
        )
        .is_ok()
    );

    assert!(
        AddressValidator::validate_dutch_address("", "123", "1012AB", "Amsterdam", "Noord-Holland")
            .is_err()
    ); // Empty street

    assert!(
        AddressValidator::validate_dutch_address(
            "Damrak",
            "123",
            "1012AB",
            "Amsterdam",
            "Zuid-Holland"
        )
        .is_err()
    ); // Wrong province for postal code
}

// Business validation tests
#[test]
fn test_valid_order_business_rules() {
    let order = create_test_order();
    assert!(order.validate_business_rules().is_ok());
}

#[test]
fn test_invalid_order_total_too_high() {
    let mut order = create_test_order();
    order.price = Decimal::new(5000001, 2); // €50,000.01
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::OrderTotalTooHigh)
    ));
}

#[test]
fn test_invalid_order_total_too_low() {
    let mut order = create_test_order();
    order.price = Decimal::ZERO;
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::OrderTotalTooLow)
    ));
}

#[test]
fn test_negative_price() {
    let mut order = create_test_order();
    order.price = Decimal::new(-100, 2);
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::NegativePrice(_))
    ));
}

#[test]
fn test_invalid_quantity() {
    let mut order = create_test_order();
    order.items[0].product[0].quantity = 0;
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::InvalidProductQuantity(0))
    ));
}

#[test]
fn test_quantity_too_high() {
    let mut order = create_test_order();
    order.items[0].product[0].quantity = 1000;
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::QuantityTooHigh(1000))
    ));
}

#[test]
fn test_empty_order_items() {
    let mut order = create_test_order();
    order.items.clear();
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::EmptyOrderItems)
    ));
}

#[test]
fn test_notes_too_long() {
    let mut order = create_test_order();
    order.notes = Some("a".repeat(1001));
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::NotesTooLong)
    ));
}

#[test]
fn test_invalid_price_precision() {
    let mut order = create_test_order();
    order.price = Decimal::new(12345, 3); // €12.345 (3 decimal places)
    assert!(matches!(
        order.validate_business_rules(),
        Err(BusinessValidationError::InvalidPricePrecision)
    ));
}

#[test]
fn test_count_unique_products() {
    let order = create_test_order();
    assert_eq!(order.count_unique_products(), 1);

    let mut order_with_duplicates = create_test_order();
    let same_product = ProductEntry {
        product_id: order_with_duplicates.items[0].product[0].product_id,
        quantity: 1,
    };
    order_with_duplicates.items[0].product.push(same_product);
    assert_eq!(order_with_duplicates.count_unique_products(), 1);
}

#[test]
fn test_calculate_total_quantity() {
    let order = create_test_order();
    assert_eq!(order.calculate_total_quantity(), 2);
}

#[test]
fn test_has_duplicate_products() {
    let order = create_test_order();
    assert!(!order.has_duplicate_products());

    let mut order_with_duplicates = create_test_order();
    let same_product = ProductEntry {
        product_id: order_with_duplicates.items[0].product[0].product_id,
        quantity: 1,
    };
    order_with_duplicates.items[0].product.push(same_product);
    assert!(order_with_duplicates.has_duplicate_products());
}

// Standalone validation function tests
#[test]
fn test_validate_order_total() {
    assert!(validate_order_total(Decimal::new(2999, 2)).is_ok());
    assert!(validate_order_total(Decimal::ZERO).is_err());
    assert!(validate_order_total(Decimal::new(-100, 2)).is_err());
    assert!(validate_order_total(Decimal::new(5000001, 2)).is_err());
}

#[test]
fn test_validate_product_quantity() {
    assert!(validate_product_quantity(1).is_ok());
    assert!(validate_product_quantity(999).is_ok());
    assert!(validate_product_quantity(0).is_err());
    assert!(validate_product_quantity(-1).is_err());
    assert!(validate_product_quantity(1000).is_err());
}

// Phone number validation tests
#[test]
fn test_phone_validation() {
    assert!(validate_phone_number("0612345678").is_ok()); // Mobile
    assert!(validate_phone_number("0201234567").is_ok()); // Landline
    assert!(validate_phone_number("+31612345678").is_ok()); // International mobile
    assert!(validate_phone_number("+31201234567").is_ok()); // International landline

    assert!(validate_phone_number("1234567890").is_err()); // Invalid format
    assert!(validate_phone_number("06123456789").is_err()); // Too long
}

// Email validation tests
#[test]
fn test_email_validation() {
    assert!(validate_email("test@example.com").is_ok());
    assert!(validate_email("user.name+tag@domain.co.uk").is_ok());

    assert!(validate_email("invalid-email").is_err());
    assert!(validate_email("@domain.com").is_err());
    assert!(validate_email("user@").is_err());
}

// Complete order validation tests
#[test]
fn test_complete_order_validation_success() {
    let order = create_test_order();
    assert!(MamabloemetjesValidator::validate_complete_order(&order).is_ok());
}

#[test]
fn test_complete_order_validation_invalid_postal_code() {
    let mut order = create_test_order();
    order.shipping_address.postal_code = "0123AB".to_string(); // Invalid: starts with 0
    assert!(MamabloemetjesValidator::validate_complete_order(&order).is_err());
}

#[test]
fn test_complete_order_validation_invalid_province() {
    let mut order = create_test_order();
    order.shipping_address.province = "Invalid Province".to_string();
    assert!(MamabloemetjesValidator::validate_complete_order(&order).is_err());
}

#[test]
fn test_postal_code_province_mismatch() {
    let mut order = create_test_order();
    order.shipping_address.postal_code = "5000AB".to_string(); // Noord-Brabant postal code
    order.shipping_address.province = "Noord-Holland".to_string(); // Wrong province
    assert!(MamabloemetjesValidator::validate_complete_order(&order).is_err());
}

// Utility function tests
#[test]
fn test_utility_functions() {
    assert!(MamabloemetjesValidator::is_valid_dutch_postal_code(
        "1234AB"
    ));
    assert!(!MamabloemetjesValidator::is_valid_dutch_postal_code(
        "0123AB"
    ));

    assert!(MamabloemetjesValidator::is_valid_dutch_province(
        "Noord-Holland"
    ));
    assert!(!MamabloemetjesValidator::is_valid_dutch_province("Invalid"));

    assert_eq!(
        MamabloemetjesValidator::normalize_dutch_postal_code("1234ab"),
        "1234AB"
    );

    assert_eq!(
        MamabloemetjesValidator::get_province_from_postal_code("1012AB"),
        Some("Noord-Holland")
    );
}

#[test]
fn test_is_valid_order() {
    let valid_order = create_test_order();
    assert!(is_valid_order(&valid_order));

    let mut invalid_order = create_test_order();
    invalid_order.price = Decimal::ZERO;
    assert!(!is_valid_order(&invalid_order));
}

#[test]
fn test_get_validation_errors() {
    let mut invalid_order = create_test_order();
    invalid_order.price = Decimal::ZERO;
    invalid_order.shipping_address.postal_code = "0123AB".to_string();

    let errors = get_validation_errors(&invalid_order);
    assert!(!errors.is_empty());
    assert!(errors.iter().any(|e| e.contains("Business rule violation")));
    assert!(errors.iter().any(|e| e.contains("address issue")));
}

// ValidatedAddress struct tests
#[test]
fn test_validated_address_success() {
    let address = ValidatedAddress {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "1012AB".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };
    assert!(address.validate().is_ok());
}

#[test]
fn test_validated_address_invalid_postal_code() {
    let address = ValidatedAddress {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "0123AB".to_string(), // Invalid: starts with 0
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };
    assert!(address.validate().is_err());
}

// ValidatedProductEntry tests
#[test]
fn test_validated_product_entry_success() {
    let product = ValidatedProductEntry {
        product_id: Uuid::new_v4(),
        quantity: 5,
    };
    assert!(product.validate().is_ok());
}

#[test]
fn test_validated_product_entry_invalid_quantity() {
    let product = ValidatedProductEntry {
        product_id: Uuid::new_v4(),
        quantity: 0, // Invalid: must be > 0
    };
    assert!(product.validate().is_err());
}

// ValidatedIncomingOrder tests
#[test]
fn test_validated_incoming_order_success() {
    let order = ValidatedIncomingOrder {
        customer_id: Uuid::new_v4(),
        price: Decimal::new(2999, 2), // €29.99
        items: vec![ValidatedOrderContent {
            product: vec![ValidatedProductEntry {
                product_id: Uuid::new_v4(),
                quantity: 2,
            }],
        }],
        shipping_address: ValidatedAddress {
            street: "Damrak".to_string(),
            house_number: "123".to_string(),
            postal_code: "1012AB".to_string(),
            city: "Amsterdam".to_string(),
            province: "Noord-Holland".to_string(),
        },
        billing_address: ValidatedAddress {
            street: "Damrak".to_string(),
            house_number: "123".to_string(),
            postal_code: "1012AB".to_string(),
            city: "Amsterdam".to_string(),
            province: "Noord-Holland".to_string(),
        },
        notes: Some("Test order".to_string()),
    };
    assert!(order.validate().is_ok());
}

// Conversion tests
#[test]
fn test_address_conversion_roundtrip() {
    let original_address = Address {
        street: "Test Street".to_string(),
        house_number: "123".to_string(),
        postal_code: "1234AB".to_string(),
        city: "Test City".to_string(),
        province: "Noord-Holland".to_string(),
    };

    let validated: ValidatedAddress = original_address.clone().into();
    let converted_back: Address = validated.into();

    assert_eq!(original_address.street, converted_back.street);
    assert_eq!(original_address.postal_code, converted_back.postal_code);
    assert_eq!(original_address.province, converted_back.province);
}

#[test]
fn test_validated_address_postal_code_normalization() {
    let address = ValidatedAddress {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "1012ab".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };
    assert_eq!(address.normalized_postal_code(), "1012AB");
}

#[test]
fn test_validated_address_postal_code_province_match() {
    let address = ValidatedAddress {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "1012AB".to_string(),
        city: "Amsterdam".to_string(),
        province: "Noord-Holland".to_string(),
    };
    assert!(address.is_postal_code_province_match());

    let invalid_address = ValidatedAddress {
        street: "Damrak".to_string(),
        house_number: "123".to_string(),
        postal_code: "1012AB".to_string(),
        city: "Amsterdam".to_string(),
        province: "Zuid-Holland".to_string(), // Wrong province for postal code
    };
    assert!(!invalid_address.is_postal_code_province_match());
}
