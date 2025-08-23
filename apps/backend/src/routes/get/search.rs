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
