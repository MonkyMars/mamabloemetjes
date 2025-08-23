use crate::actions::get::search::{
    SearchParams, get_popular_searches, get_search_suggestions, search_products,
    search_with_corrections,
};
use crate::response::ApiResponse;
use crate::services::search::SearchResult;
use axum::{Router, extract::Query, routing::get};

/// Search products endpoint
pub async fn search_products_route(params: Query<SearchParams>) -> ApiResponse<SearchResult> {
    search_products(params).await
}

/// Get search suggestions endpoint
pub async fn search_suggestions_route(params: Query<SearchParams>) -> ApiResponse<Vec<String>> {
    get_search_suggestions(params).await
}

/// Search with auto-corrections endpoint
pub async fn search_with_corrections_route(
    params: Query<SearchParams>,
) -> ApiResponse<SearchResult> {
    search_with_corrections(params).await
}

/// Get popular searches endpoint
pub async fn popular_searches_route(params: Query<SearchParams>) -> ApiResponse<Vec<String>> {
    get_popular_searches(params).await
}

/// Setup search routes
pub fn search_routes() -> Router {
    Router::new()
        .route("/search", get(search_products_route))
        .route("/search/suggestions", get(search_suggestions_route))
        .route("/search/corrected", get(search_with_corrections_route))
        .route("/search/popular", get(popular_searches_route))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_search_routes_exist() {
        let app = search_routes();

        // Test that routes are accessible (they will return errors without a database, but routes exist)
        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/search?q=test")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Route should exist (not 404)
        assert_ne!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_suggestions_route_exists() {
        let app = search_routes();

        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/search/suggestions?q=test")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_ne!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_popular_searches_route_exists() {
        let app = search_routes();

        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/search/popular")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_ne!(response.status(), StatusCode::NOT_FOUND);
    }
}
