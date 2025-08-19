use axum::Router;
use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use axum::response::Response;
use backend::routes::setup_routes;
use http_body_util::BodyExt;
use serde_json::{Value, json};
use tower::ServiceExt;

#[tokio::test]
async fn debug_validation_error() {
    let order_json = create_valid_order_json();
    let response = send_order_request(order_json).await;

    println!("DEBUG: Status: {}", response.status());

    if response.status() == StatusCode::UNPROCESSABLE_ENTITY {
        let response_json = extract_json_from_response(response).await;
        println!(
            "DEBUG: Response body: {}",
            serde_json::to_string_pretty(&response_json).unwrap()
        );
    }

    // This test is just for debugging, always pass
    assert!(true);
}

/// Helper function to create a test router
fn create_test_router() -> Router {
    setup_routes(Router::new())
}

/// Helper function to create a valid order JSON
fn create_valid_order_json() -> Value {
    json!({
        "name": "John Doe",
        "email": "john.doe@example.com",
        "address": {
            "street": "123 Main St",
            "city": "Amsterdam",
            "province": "noord holland",
            "zip": "1234AB"
        },
        "price": "99.99",
        "content": [
            {
                "product": [
                    {
                        "product_id": "550e8400-e29b-41d4-a716-446655440000",
                        "quantity": 2
                    }
                ]
            }
        ],
        "order_status": "pending"
    })
}

/// Helper function to create an invalid order JSON
fn create_invalid_order_json() -> Value {
    json!({
        "name": "", // Invalid: empty name
        "email": "invalid-email", // Invalid: not a valid email
        "address": {
            "street": "", // Invalid: empty street
            "city": "Amsterdam",
            "province": "noord holland",
            "zip": "123" // Invalid: too short
        },
        "price": "-10.0", // Invalid: negative price
        "content": [], // Invalid: empty content
        "order_status": "pending"
    })
}

/// Helper function to send a POST request to the order endpoint
async fn send_order_request(order_json: Value) -> Response<Body> {
    let router = create_test_router();
    let request = Request::builder()
        .method(Method::POST)
        .uri("/order")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_string(&order_json).unwrap()))
        .unwrap();

    router.oneshot(request).await.unwrap()
}

/// Helper function to extract JSON from response body
async fn extract_json_from_response(response: Response<Body>) -> Value {
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    serde_json::from_str(&body_str).unwrap()
}

#[tokio::test]
async fn test_valid_order_submission() {
    let order_json = create_valid_order_json();

    let response = send_order_request(order_json).await;

    // Since we don't have a database connection in tests, we expect validation to pass
    // but database operations to fail, which would return a 500 Internal Server Error
    // However, if validation fails, we'd get a 422 or 400 status

    // Check that validation passes (not a 422 or 400 client error for validation)
    assert!(
        !matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Validation should pass for valid order data, but got status: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_invalid_order_submission() {
    let order_json = create_invalid_order_json();

    let response = send_order_request(order_json).await;

    // Should return a validation error status for invalid data
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_empty_name_validation() {
    let mut order_json = create_valid_order_json();
    order_json["name"] = json!("");

    let response = send_order_request(order_json).await;

    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_invalid_email_validation() {
    let mut order_json = create_valid_order_json();
    order_json["email"] = json!("invalid-email");

    let response = send_order_request(order_json).await;

    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_negative_price_validation() {
    let mut order_json = create_valid_order_json();
    order_json["price"] = json!(-10.0);

    let response = send_order_request(order_json).await;

    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_empty_content_validation() {
    let mut order_json = create_valid_order_json();
    order_json["content"] = json!([]);

    let response = send_order_request(order_json).await;

    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_invalid_product_count_validation() {
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product"][0]["quantity"] = json!(0);

    let response = send_order_request(order_json).await;

    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_invalid_address_validation() {
    let mut order_json = create_valid_order_json();
    order_json["address"]["street"] = json!("");

    let response = send_order_request(order_json).await;

    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_malformed_json_request() {
    let router = create_test_router();

    let request = Request::builder()
        .method(Method::POST)
        .uri("/order")
        .header("content-type", "application/json")
        .body(Body::from("{ invalid json }"))
        .unwrap();

    let response = router.oneshot(request).await.unwrap();

    // Should return a bad request status for malformed JSON
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected JSON parsing error, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_missing_required_fields() {
    let incomplete_order = json!({
        "name": "John Doe"
        // Missing all other required fields
    });

    let response = send_order_request(incomplete_order).await;

    // Should return a bad request status for missing fields
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for missing fields, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_order_with_multiple_products() {
    let mut order_json = create_valid_order_json();

    // Add multiple products
    order_json["content"][0]["product"] = json!([
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440000",
            "quantity": 2
        },
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440001",
            "quantity": 3
        }
    ]);

    let response = send_order_request(order_json).await;

    // Validation should pass for valid data with multiple products
    assert!(
        !matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Validation should pass for valid order with multiple products, but got status: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_order_with_multiple_content_items() {
    let mut order_json = create_valid_order_json();

    // Add multiple content items
    order_json["content"] = json!([
        {
            "product": [
                {
                    "product_id": "550e8400-e29b-41d4-a716-446655440000",
                    "quantity": 2
                }
            ]
        },
        {
            "product": [
                {
                    "product_id": "550e8400-e29b-41d4-a716-446655440001",
                    "quantity": 1
                }
            ]
        }
    ]);

    let response = send_order_request(order_json).await;

    // Validation should pass for valid data with multiple content items
    assert!(
        !matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Validation should pass for valid order with multiple content items, but got status: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_edge_case_valid_values() {
    let mut order_json = create_valid_order_json();

    // Test edge case valid values
    order_json["name"] = json!("a".repeat(100)); // Maximum length name
    order_json["price"] = json!("0.01"); // Minimum valid price
    order_json["address"]["province"] = json!("zeeland"); // Valid Dutch province
    order_json["address"]["zip"] = json!("1234AB"); // Valid Dutch ZIP

    let response = send_order_request(order_json).await;

    // Validation should pass for edge case valid values
    assert!(
        !matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Validation should pass for edge case valid values, but got status: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_edge_case_invalid_values() {
    // Test name too long
    let mut order_json = create_valid_order_json();
    order_json["name"] = json!("a".repeat(101));

    let response = send_order_request(order_json).await;
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for name too long, got: {}",
        response.status()
    );

    // Test price too high
    let mut order_json = create_valid_order_json();
    order_json["price"] = json!("1000001.0");

    let response = send_order_request(order_json).await;
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for price too high, got: {}",
        response.status()
    );

    // Test product count too high
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product"][0]["quantity"] = json!(51);

    let response = send_order_request(order_json).await;
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for quantity too high, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_validation_empty_name_after_trim() {
    let mut order_json = create_valid_order_json();
    order_json["name"] = json!("   "); // Only whitespace - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return client error
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for whitespace-only name, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_validation_price_exactly_zero() {
    let mut order_json = create_valid_order_json();
    order_json["price"] = json!("0.0"); // Zero price - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return client error
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for zero price, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_validation_whitespace_only_street() {
    let mut order_json = create_valid_order_json();
    order_json["address"]["street"] = json!("   "); // Whitespace only - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return client error
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for whitespace-only street, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_validation_product_count_exactly_zero() {
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product"][0]["quantity"] = json!(0); // Zero count - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return client error
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for zero quantity, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_validation_product_count_over_limit() {
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product"][0]["quantity"] = json!(51); // Over limit - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return client error
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for quantity over limit, got: {}",
        response.status()
    );
}

#[tokio::test]
async fn test_validation_invalid_email_domain() {
    let mut order_json = create_valid_order_json();
    order_json["email"] = json!("user@.com"); // Invalid domain - should pass basic email validation but fail domain check

    let response = send_order_request(order_json).await;

    // Validation errors should return client error
    assert!(
        matches!(
            response.status(),
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "Expected validation error for invalid email domain, got: {}",
        response.status()
    );
}
