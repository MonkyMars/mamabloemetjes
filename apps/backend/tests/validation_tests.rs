use backend::structs::order::{Address, Order, OrderContent, OrderStatus, ProductEntry};
use backend::validate::order::validate_order;
use rust_decimal::Decimal;
use rust_decimal::prelude::FromPrimitive;
use uuid::Uuid;

/// Create a valid order for testing
pub fn create_valid_order() -> Order {
    Order {
        id: None,
        name: "John Doe".to_string(),
        email: "john.doe@example.com".to_string(),
        address: Address {
            street: "123 Main St".to_string(),
            city: "Anytown".to_string(),
            province: "CA".to_string(),
            zip: "12345".to_string(),
        },
        price: Decimal::from_f32(2.33).unwrap(),
        content: vec![OrderContent {
            product: vec![ProductEntry {
                product_id: Uuid::new_v4(),
                quantity: 2,
            }],
        }],
        created_at: None,
        updated_at: None,
        order_status: OrderStatus::Pending,
    }
}

/// Create an invalid order with multiple validation errors
pub fn create_invalid_order() -> Order {
    Order {
        id: None,
        name: "".to_string(),               // Invalid: empty name
        email: "invalid-email".to_string(), // Invalid: not a valid email
        address: Address {
            street: "".to_string(), // Invalid: empty street
            city: "Anytown".to_string(),
            province: "CA".to_string(),
            zip: "123".to_string(), // Invalid: too short
        },
        price: Decimal::from_f32(-10.0).unwrap(), // Invalid: negative price
        content: vec![],                          // Invalid: empty content
        created_at: None,
        updated_at: None,
        order_status: OrderStatus::Pending,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_order_passes_validation() {
        let order = create_valid_order();
        assert!(
            validate_order(&order).is_ok(),
            "Valid order should pass validation"
        );
    }

    #[test]
    fn test_invalid_order_fails_validation() {
        let order = create_invalid_order();
        assert!(
            validate_order(&order).is_err(),
            "Invalid order should fail validation"
        );
    }

    #[test]
    fn test_empty_name_validation() {
        let mut order = create_valid_order();
        order.name = "".to_string();
        assert!(
            validate_order(&order).is_err(),
            "Empty name should fail validation"
        );

        order.name = "   ".to_string(); // Only whitespace
        assert!(
            validate_order(&order).is_err(),
            "Whitespace-only name should fail validation"
        );
    }

    #[test]
    fn test_name_length_validation() {
        let mut order = create_valid_order();

        // Test maximum length (100 characters)
        order.name = "a".repeat(101);
        assert!(
            validate_order(&order).is_err(),
            "Name over 100 characters should fail"
        );

        order.name = "a".repeat(100);
        assert!(
            validate_order(&order).is_ok(),
            "Name of exactly 100 characters should pass"
        );

        order.name = "a".repeat(1);
        assert!(
            validate_order(&order).is_ok(),
            "Name of 1 character should pass"
        );
    }

    #[test]
    fn test_email_validation() {
        let mut order = create_valid_order();

        let invalid_emails = vec![
            "invalid-email",
            "@example.com",
            "user@",
            "user@.com",
            "user@com",
            "",
        ];

        for email in invalid_emails {
            order.email = email.to_string();
            assert!(
                validate_order(&order).is_err(),
                "Invalid email '{}' should fail validation",
                email
            );
        }

        let valid_emails = vec![
            "user@example.com",
            "test.email@domain.co.uk",
            "user+tag@example.org",
        ];

        for email in valid_emails {
            order.email = email.to_string();
            assert!(
                validate_order(&order).is_ok(),
                "Valid email '{}' should pass validation",
                email
            );
        }
    }

    #[test]
    fn test_price_validation() {
        let mut order = create_valid_order();

        // Test negative price
        order.price = Decimal::from_f32(-10.0).unwrap();
        assert!(
            validate_order(&order).is_err(),
            "Negative price should fail validation"
        );

        // Test zero price
        order.price = Decimal::ZERO;
        assert!(
            validate_order(&order).is_err(),
            "Zero price should fail validation"
        );

        // Test minimum valid price
        order.price = Decimal::from_f32(0.01).unwrap();
        assert!(
            validate_order(&order).is_ok(),
            "Minimum valid price should pass validation"
        );

        // Test maximum valid price
        order.price = Decimal::from_f32(1_000_000.0).unwrap();
        assert!(
            validate_order(&order).is_ok(),
            "Maximum valid price should pass validation"
        );

        // Test price over maximum
        order.price = Decimal::from_f32(1_000_001.0).unwrap();
        assert!(
            validate_order(&order).is_err(),
            "Price over maximum should fail validation"
        );
    }

    #[test]
    fn test_address_validation() {
        let mut order = create_valid_order();

        // Test empty street
        order.address.street = "".to_string();
        assert!(
            validate_order(&order).is_err(),
            "Empty street should fail validation"
        );

        // Test whitespace-only street
        order.address.street = "   ".to_string();
        assert!(
            validate_order(&order).is_err(),
            "Whitespace-only street should fail validation"
        );

        // Reset and test city
        order.address = create_valid_order().address;
        order.address.city = "".to_string();
        assert!(
            validate_order(&order).is_err(),
            "Empty city should fail validation"
        );

        // Reset and test state
        order.address = create_valid_order().address;
        order.address.province = "".to_string();
        assert!(
            validate_order(&order).is_err(),
            "Empty state should fail validation"
        );

        // Test state length
        order.address.province = "a".to_string(); // Too short
        assert!(
            validate_order(&order).is_err(),
            "State too short should fail validation"
        );

        order.address.province = "a".repeat(21); // Too long
        assert!(
            validate_order(&order).is_err(),
            "State too long should fail validation"
        );
    }

    #[test]
    fn test_zip_code_validation() {
        let mut order = create_valid_order();

        // Test empty ZIP
        order.address.zip = "".to_string();
        assert!(
            validate_order(&order).is_err(),
            "Empty ZIP should fail validation"
        );

        // Test valid ZIP codes
        let valid_zips = vec!["12345", "12345-6789", "90210"];
        for zip in valid_zips {
            order.address.zip = zip.to_string();
            assert!(
                validate_order(&order).is_ok(),
                "Valid ZIP '{}' should pass validation",
                zip
            );
        }

        // Test invalid ZIP codes
        let invalid_zips = vec!["123", "12345678901", "abcde"];
        for zip in invalid_zips {
            order.address.zip = zip.to_string();
            assert!(
                validate_order(&order).is_err(),
                "Invalid ZIP '{}' should fail validation",
                zip
            );
        }
    }

    #[test]
    fn test_content_validation() {
        let mut order = create_valid_order();

        // Test empty content
        order.content = vec![];
        assert!(
            validate_order(&order).is_err(),
            "Empty content should fail validation"
        );

        // Test content with empty product
        order.content = vec![OrderContent { product: vec![] }];
        assert!(
            validate_order(&order).is_err(),
            "Content with empty product should fail validation"
        );
    }

    #[test]
    fn test_product_count_validation() {
        let mut order = create_valid_order();

        // Test zero count
        order.content[0].product[0].quantity = 0;
        assert!(
            validate_order(&order).is_err(),
            "Zero product count should fail validation"
        );

        // Test negative count
        order.content[0].product[0].quantity = -1;
        assert!(
            validate_order(&order).is_err(),
            "Negative product count should fail validation"
        );

        // Test valid count
        order.content[0].product[0].quantity = 1;
        assert!(
            validate_order(&order).is_ok(),
            "Valid product count should pass validation"
        );

        // Test maximum count
        order.content[0].product[0].quantity = 1000;
        assert!(
            validate_order(&order).is_ok(),
            "Maximum product count should pass validation"
        );

        // Test over maximum count
        order.content[0].product[0].quantity = 1001;
        assert!(
            validate_order(&order).is_err(),
            "Over maximum product count should fail validation"
        );
    }

    #[test]
    fn test_multiple_product_validation() {
        let mut order = create_valid_order();

        // Add multiple product to test nested validation
        order.content[0].product.push(ProductEntry {
            product_id: Uuid::new_v4(),
            quantity: 3,
        });

        assert!(
            validate_order(&order).is_ok(),
            "Multiple valid product should pass validation"
        );

        // Make one product invalid
        order.content[0].product[1].quantity = 0;
        assert!(
            validate_order(&order).is_err(),
            "One invalid product should fail validation"
        );
    }

    #[test]
    fn test_multiple_content_items_validation() {
        let mut order = create_valid_order();

        // Add multiple content items
        order.content.push(OrderContent {
            product: vec![ProductEntry {
                product_id: Uuid::new_v4(),
                quantity: 1,
            }],
        });

        assert!(
            validate_order(&order).is_ok(),
            "Multiple valid content items should pass validation"
        );

        // Make one content item invalid
        order.content[1].product = vec![];
        assert!(
            validate_order(&order).is_err(),
            "One invalid content item should fail validation"
        );
    }

    #[test]
    fn test_edge_case_validations() {
        let mut order = create_valid_order();

        // Test very long but valid name
        order.name = "a".repeat(100);
        assert!(
            validate_order(&order).is_ok(),
            "Maximum length name should pass validation"
        );

        // Test minimum valid price
        order.price = Decimal::from_f32(0.01).unwrap();
        assert!(
            validate_order(&order).is_ok(),
            "Minimum valid price should pass validation"
        );

        // Test complex email
        order.email = "user+tag@subdomain.example.com".to_string();
        assert!(
            validate_order(&order).is_ok(),
            "Complex valid email should pass validation"
        );

        // Test maximum state length
        order.address.province = "a".repeat(20);
        assert!(
            validate_order(&order).is_ok(),
            "Maximum state length should pass validation"
        );
    }
}
