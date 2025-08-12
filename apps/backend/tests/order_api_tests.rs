use axum::Router;
use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use axum::response::Response;
use backend::routes::setup_routes;
use http_body_util::BodyExt;
use serde_json::{Value, json};
use tower::ServiceExt;

/// Helper function to create a test router
fn create_test_router() -> Router {
    setup_routes(Router::new())
}

/// Helper function to create a valid order JSON
fn create_valid_order_json() -> Value {
    json!({
        "id": null,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "address": {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "zip": "12345"
        },
        "price": 99.99,
        "content": [
            {
                "product_ids": [
                    {
                        "product_id": "550e8400-e29b-41d4-a716-446655440000",
                        "count": 2
                    }
                ]
            }
        ],
        "created_at": null,
        "updated_at": null,
        "order_status": "Pending"
    })
}

/// Helper function to create an invalid order JSON
fn create_invalid_order_json() -> Value {
    json!({
        "id": null,
        "name": "", // Invalid: empty name
        "email": "invalid-email", // Invalid: not a valid email
        "address": {
            "street": "", // Invalid: empty street
            "city": "Anytown",
            "state": "CA",
            "zip": "123" // Invalid: too short
        },
        "price": -10.0, // Invalid: negative price
        "content": [], // Invalid: empty content
        "created_at": null,
        "updated_at": null,
        "order_status": "Pending"
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

    assert_eq!(response.status(), StatusCode::OK);

    let response_json = extract_json_from_response(response).await;

    // Check that we got a successful response with the order data
    assert_eq!(response_json["success"].as_bool().unwrap(), true);
    let order_data = &response_json["data"];

    // Verify the returned order has the expected fields
    assert_eq!(order_data["name"], "John Doe");
    assert_eq!(order_data["email"], "john.doe@example.com");
    assert_eq!(order_data["price"], 99.99);

    // Verify that ID was generated
    assert!(order_data["id"].is_string());

    // Verify timestamps were added
    assert!(order_data["created_at"].is_string());
    assert!(order_data["updated_at"].is_string());
}

#[tokio::test]
async fn test_invalid_order_submission() {
    let order_json = create_invalid_order_json();

    let response = send_order_request(order_json).await;

    // Should return a bad request status for invalid data that fails deserialization
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_empty_name_validation() {
    let mut order_json = create_valid_order_json();
    order_json["name"] = json!("");

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_invalid_email_validation() {
    let mut order_json = create_valid_order_json();
    order_json["email"] = json!("invalid-email");

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_negative_price_validation() {
    let mut order_json = create_valid_order_json();
    order_json["price"] = json!(-10.0);

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_empty_content_validation() {
    let mut order_json = create_valid_order_json();
    order_json["content"] = json!([]);

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_invalid_product_count_validation() {
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product_ids"][0]["count"] = json!(0);

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_invalid_address_validation() {
    let mut order_json = create_valid_order_json();
    order_json["address"]["street"] = json!("");

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
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
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_missing_required_fields() {
    let incomplete_order = json!({
        "name": "John Doe"
        // Missing all other required fields
    });

    let response = send_order_request(incomplete_order).await;

    // Should return a bad request status for missing fields
    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn test_order_with_multiple_products() {
    let mut order_json = create_valid_order_json();

    // Add multiple products
    order_json["content"][0]["product_ids"] = json!([
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440000",
            "count": 2
        },
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440001",
            "count": 3
        }
    ]);

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::OK);
    let response_json = extract_json_from_response(response).await;
    assert_eq!(response_json["success"].as_bool().unwrap(), true);
}

#[tokio::test]
async fn test_order_with_multiple_content_items() {
    let mut order_json = create_valid_order_json();

    // Add multiple content items
    order_json["content"] = json!([
        {
            "product_ids": [
                {
                    "product_id": "550e8400-e29b-41d4-a716-446655440000",
                    "count": 2
                }
            ]
        },
        {
            "product_ids": [
                {
                    "product_id": "550e8400-e29b-41d4-a716-446655440001",
                    "count": 1
                }
            ]
        }
    ]);

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::OK);
    let response_json = extract_json_from_response(response).await;
    assert_eq!(response_json["success"].as_bool().unwrap(), true);
}

#[tokio::test]
async fn test_edge_case_valid_values() {
    let mut order_json = create_valid_order_json();

    // Test edge case valid values
    order_json["name"] = json!("a".repeat(100)); // Maximum length name
    order_json["price"] = json!(0.01); // Minimum valid price
    order_json["address"]["state"] = json!("ab"); // Minimum state length
    order_json["address"]["zip"] = json!("12345-6789"); // ZIP with extension

    let response = send_order_request(order_json).await;

    assert_eq!(response.status(), StatusCode::OK);
    let response_json = extract_json_from_response(response).await;
    assert_eq!(response_json["success"].as_bool().unwrap(), true);
}

#[tokio::test]
async fn test_edge_case_invalid_values() {
    // Test name too long
    let mut order_json = create_valid_order_json();
    order_json["name"] = json!("a".repeat(101));

    let response = send_order_request(order_json).await;
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    // Test price too high
    let mut order_json = create_valid_order_json();
    order_json["price"] = json!(1_000_001.0);

    let response = send_order_request(order_json).await;
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    // Test product count too high
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product_ids"][0]["count"] = json!(1001);

    let response = send_order_request(order_json).await;
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_validation_empty_name_after_trim() {
    let mut order_json = create_valid_order_json();
    order_json["name"] = json!("   "); // Only whitespace - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return 400 Bad Request (correct REST behavior)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_validation_price_exactly_zero() {
    let mut order_json = create_valid_order_json();
    order_json["price"] = json!(0.0); // Zero price - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return 400 Bad Request (correct REST behavior)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_validation_whitespace_only_street() {
    let mut order_json = create_valid_order_json();
    order_json["address"]["street"] = json!("   "); // Whitespace only - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return 400 Bad Request (correct REST behavior)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_validation_product_count_exactly_zero() {
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product_ids"][0]["count"] = json!(0); // Zero count - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return 400 Bad Request (correct REST behavior)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_validation_product_count_over_limit() {
    let mut order_json = create_valid_order_json();
    order_json["content"][0]["product_ids"][0]["count"] = json!(1001); // Over limit - should pass JSON validation but fail business logic

    let response = send_order_request(order_json).await;

    // Validation errors should return 400 Bad Request (correct REST behavior)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_validation_invalid_email_domain() {
    let mut order_json = create_valid_order_json();
    order_json["email"] = json!("user@.com"); // Invalid domain - should pass basic email validation but fail domain check

    let response = send_order_request(order_json).await;

    // Validation errors should return 400 Bad Request (correct REST behavior)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
