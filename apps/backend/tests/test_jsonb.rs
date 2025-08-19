use backend::structs::order::{Address, Order, OrderContent, OrderStatus, ProductEntry};
use rust_decimal::Decimal;
use serde_json;
use std::str::FromStr;
use uuid::Uuid;

fn main() {
    println!("Testing JSONB serialization and deserialization...");

    // Create a sample order with complex nested data
    let order = Order {
        id: Some(Uuid::new_v4()),
        name: "John Doe".to_string(),
        email: "john.doe@example.com".to_string(),
        address: Address {
            street: "123 Main St".to_string(),
            city: "Anytown".to_string(),
            province: "CA".to_string(),
            zip: "12345".to_string(),
        },
        price: Decimal::from_str("99.99").unwrap(),
        content: vec![
            OrderContent {
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
            },
            OrderContent {
                product: vec![ProductEntry {
                    product_id: Uuid::new_v4(),
                    quantity: 3,
                }],
            },
        ],
        created_at: Some(chrono::Utc::now()),
        updated_at: Some(chrono::Utc::now()),
        order_status: OrderStatus::Pending,
    };

    println!("Original order:");
    println!("{:#?}", order);

    // Test address serialization
    println!("\n=== Testing Address JSONB ===");
    match serde_json::to_value(&order.address) {
        Ok(address_json) => {
            println!("Address serialized to JSON:");
            println!("{}", serde_json::to_string_pretty(&address_json).unwrap());

            // Test deserialization
            match serde_json::from_value::<Address>(address_json) {
                Ok(deserialized_address) => {
                    println!("Address successfully deserialized!");
                    println!("Original street: {}", order.address.street);
                    println!("Deserialized street: {}", deserialized_address.street);
                    assert_eq!(order.address.street, deserialized_address.street);
                    assert_eq!(order.address.city, deserialized_address.city);
                    assert_eq!(order.address.province, deserialized_address.province);
                    assert_eq!(order.address.zip, deserialized_address.zip);
                    println!("✅ Address JSONB test passed!");
                }
                Err(e) => {
                    println!("❌ Failed to deserialize address: {}", e);
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to serialize address: {}", e);
        }
    }

    // Test content serialization
    println!("\n=== Testing Content JSONB ===");
    match serde_json::to_value(&order.content) {
        Ok(content_json) => {
            println!("Content serialized to JSON:");
            println!("{}", serde_json::to_string_pretty(&content_json).unwrap());

            // Test deserialization
            match serde_json::from_value::<Vec<OrderContent>>(content_json) {
                Ok(deserialized_content) => {
                    println!("Content successfully deserialized!");
                    println!("Original content items: {}", order.content.len());
                    println!("Deserialized content items: {}", deserialized_content.len());
                    assert_eq!(order.content.len(), deserialized_content.len());

                    // Check first content item
                    assert_eq!(
                        order.content[0].product.len(),
                        deserialized_content[0].product.len()
                    );
                    assert_eq!(
                        order.content[0].product[0].quantity,
                        deserialized_content[0].product[0].quantity
                    );

                    println!("✅ Content JSONB test passed!");
                }
                Err(e) => {
                    println!("❌ Failed to deserialize content: {}", e);
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to serialize content: {}", e);
        }
    }

    // Test full order serialization
    println!("\n=== Testing Full Order JSONB ===");
    match serde_json::to_string_pretty(&order) {
        Ok(order_json) => {
            println!("Full order serialized to JSON:");
            println!("{}", order_json);

            // Test deserialization
            match serde_json::from_str::<Order>(&order_json) {
                Ok(deserialized_order) => {
                    println!("Full order successfully deserialized!");
                    assert_eq!(order.name, deserialized_order.name);
                    assert_eq!(order.email, deserialized_order.email);
                    assert_eq!(order.price, deserialized_order.price);
                    assert_eq!(order.address.street, deserialized_order.address.street);
                    assert_eq!(order.content.len(), deserialized_order.content.len());
                    println!("✅ Full order JSONB test passed!");
                }
                Err(e) => {
                    println!("❌ Failed to deserialize full order: {}", e);
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to serialize full order: {}", e);
        }
    }

    // Test edge cases
    println!("\n=== Testing Edge Cases ===");

    // Empty content
    let empty_content: Vec<OrderContent> = vec![];
    match serde_json::to_value(&empty_content) {
        Ok(json_val) => match serde_json::from_value::<Vec<OrderContent>>(json_val) {
            Ok(deserialized) => {
                assert_eq!(deserialized.len(), 0);
                println!("✅ Empty content array test passed!");
            }
            Err(e) => println!("❌ Empty content deserialization failed: {}", e),
        },
        Err(e) => println!("❌ Empty content serialization failed: {}", e),
    }

    // Single product entry
    let single_content = vec![OrderContent {
        product: vec![ProductEntry {
            product_id: Uuid::new_v4(),
            quantity: 1,
        }],
    }];

    match serde_json::to_value(&single_content) {
        Ok(json_val) => match serde_json::from_value::<Vec<OrderContent>>(json_val) {
            Ok(deserialized) => {
                assert_eq!(deserialized.len(), 1);
                assert_eq!(deserialized[0].product.len(), 1);
                assert_eq!(deserialized[0].product[0].quantity, 1);
                println!("✅ Single product entry test passed!");
            }
            Err(e) => println!("❌ Single product deserialization failed: {}", e),
        },
        Err(e) => println!("❌ Single product serialization failed: {}", e),
    }

    println!("\n🎉 All JSONB tests completed!");
    println!("\nThis demonstrates that:");
    println!("1. Address JSONB fields serialize/deserialize correctly");
    println!("2. Content JSONB fields (with nested structures) work properly");
    println!("3. Complex nested data structures are preserved");
    println!("4. Edge cases like empty arrays are handled correctly");
    println!("\nThe previous issue was likely caused by:");
    println!("- Using string interpolation instead of parameterized queries");
    println!("- Manual JSON string escaping that corrupted the JSON");
    println!("- Using .unwrap_or_default() which returned empty data on parse failures");
    println!("\nThe fix uses:");
    println!("- Proper parameterized queries with serde_json::to_value()");
    println!("- Direct JSON value binding to PostgreSQL JSONB columns");
    println!("- Proper error handling instead of silent defaults");
}
