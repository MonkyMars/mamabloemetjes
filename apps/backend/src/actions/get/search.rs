use crate::response::{ApiResponse, AppResponse};
use crate::services::search::{SearchQuery, SearchResult, SearchService};
use axum::extract::Query;
use serde::Deserialize;
use sqlx::Error as SqlxError;

#[derive(Debug, Deserialize)]
pub struct SearchParams {
    pub q: Option<String>,
    pub product_type: Option<String>,
    pub colors: Option<String>, // Comma-separated colors
    pub size: Option<String>,
    pub price_min: Option<f64>,
    pub price_max: Option<f64>,
    pub in_stock: Option<bool>,
    pub sort_by: Option<String>,
    pub sort_direction: Option<String>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

/// Search products with comprehensive filtering and sorting
pub async fn search_products(Query(params): Query<SearchParams>) -> ApiResponse<SearchResult> {
    // Parse search query
    let search_query = match parse_search_params(params) {
        Ok(query) => query,
        Err(e) => {
            return AppResponse::error(crate::response::error::AppError::bad_request(&format!(
                "Invalid search parameters: {}",
                e
            )));
        }
    };

    // Perform search
    match SearchService::search_products(search_query).await {
        Ok(result) => AppResponse::ok(result),
        Err(SqlxError::RowNotFound) => {
            // Return empty results instead of error for no matches
            let empty_result = SearchResult {
                products: vec![],
                total_count: 0,
                page: 1,
                per_page: 20,
                total_pages: 0,
                search_time_ms: 0,
                suggestions: None,
            };
            AppResponse::ok(empty_result)
        }
        Err(e) => {
            tracing::error!("Search error: {}", e);
            AppResponse::error(crate::response::error::AppError::internal_error(
                "Failed to search products",
            ))
        }
    }
}

/// Get search suggestions for autocomplete
pub async fn get_search_suggestions(
    Query(params): Query<SearchParams>,
) -> ApiResponse<Vec<String>> {
    let query = params.q.as_ref().map(|s| s.as_str()).unwrap_or("");

    if query.trim().is_empty() {
        // Return popular searches for empty query
        match SearchService::get_popular_searches(Some(6)).await {
            Ok(suggestions) => AppResponse::ok(suggestions),
            Err(e) => {
                tracing::error!("Failed to get popular searches: {}", e);
                AppResponse::ok(vec![]) // Return empty array on error
            }
        }
    } else {
        match SearchService::quick_search(&query).await {
            Ok(suggestions) => {
                let suggestion_strings: Vec<String> =
                    suggestions.into_iter().map(|s| s.suggestion).collect();
                AppResponse::ok(suggestion_strings)
            }
            Err(e) => {
                tracing::error!("Failed to get search suggestions: {}", e);
                AppResponse::ok(vec![])
            }
        }
    }
}

/// Search with auto-correction for better UX
pub async fn search_with_corrections(
    Query(params): Query<SearchParams>,
) -> ApiResponse<SearchResult> {
    let query = params.q.as_ref().map(|s| s.as_str()).unwrap_or("");

    if query.trim().is_empty() {
        return AppResponse::error(crate::response::error::AppError::bad_request(
            "Search query cannot be empty",
        ));
    }

    // Parse filters
    let filters = parse_search_filters(&params);

    match SearchService::search_with_corrections(query, Some(filters)).await {
        Ok(result) => AppResponse::ok(result),
        Err(e) => {
            tracing::error!("Search with corrections error: {}", e);
            AppResponse::error(crate::response::error::AppError::internal_error(
                "Failed to search products",
            ))
        }
    }
}

/// Get popular search terms
pub async fn get_popular_searches(Query(params): Query<SearchParams>) -> ApiResponse<Vec<String>> {
    let limit = params.per_page.unwrap_or(10);

    match SearchService::get_popular_searches(Some(limit)).await {
        Ok(searches) => AppResponse::ok(searches),
        Err(e) => {
            tracing::error!("Failed to get popular searches: {}", e);
            AppResponse::ok(vec![])
        }
    }
}

/// Parse search parameters into SearchQuery struct
fn parse_search_params(params: SearchParams) -> Result<SearchQuery, String> {
    use crate::services::search::{
        SearchPagination, SearchSort, SearchSortDirection, SearchSortField,
    };

    let query = params.q.clone().unwrap_or_default();

    // Parse filters
    let filters = if has_filters(&params) {
        Some(parse_search_filters(&params))
    } else {
        None
    };

    // Parse sorting
    let sort = if let Some(sort_by) = params.sort_by {
        let field = match sort_by.to_lowercase().as_str() {
            "name" => SearchSortField::Name,
            "price" => SearchSortField::Price,
            "created_at" | "date" => SearchSortField::CreatedAt,
            "stock" => SearchSortField::Stock,
            "relevance" | _ => SearchSortField::Relevance,
        };

        let direction = match params
            .sort_direction
            .unwrap_or_default()
            .to_lowercase()
            .as_str()
        {
            "desc" | "descending" => SearchSortDirection::Desc,
            "asc" | "ascending" | _ => SearchSortDirection::Asc,
        };

        Some(SearchSort { field, direction })
    } else {
        None
    };

    // Parse pagination
    let pagination = Some(SearchPagination {
        page: params.page.unwrap_or(1).max(1),
        per_page: params.per_page.unwrap_or(20).min(100).max(1), // Limit per_page to 100
    });

    Ok(SearchQuery {
        query,
        filters,
        sort,
        pagination,
    })
}

/// Parse search filters from parameters
fn parse_search_filters(params: &SearchParams) -> crate::services::search::SearchFilters {
    use crate::services::search::SearchFilters;
    use rust_decimal::Decimal;

    SearchFilters {
        product_type: params.product_type.clone(),
        colors: params.colors.as_ref().map(|colors| {
            colors
                .split(',')
                .map(|c| c.trim().to_string())
                .filter(|c| !c.is_empty())
                .collect()
        }),
        size: params.size.clone(),
        price_min: params.price_min.and_then(|p| Decimal::try_from(p).ok()),
        price_max: params.price_max.and_then(|p| Decimal::try_from(p).ok()),
        in_stock: params.in_stock,
    }
}

/// Check if any filters are provided
fn has_filters(params: &SearchParams) -> bool {
    params.product_type.is_some()
        || params.colors.is_some()
        || params.size.is_some()
        || params.price_min.is_some()
        || params.price_max.is_some()
        || params.in_stock.is_some()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_search_params() {
        let params = SearchParams {
            q: Some("rose".to_string()),
            product_type: Some("flower".to_string()),
            colors: Some("red,pink".to_string()),
            size: None,
            price_min: Some(10.0),
            price_max: Some(50.0),
            in_stock: Some(true),
            sort_by: Some("price".to_string()),
            sort_direction: Some("desc".to_string()),
            page: Some(2),
            per_page: Some(15),
        };

        let result = parse_search_params(params).unwrap();
        assert_eq!(result.query, "rose");
        assert!(result.filters.is_some());
        assert!(result.sort.is_some());
        assert!(result.pagination.is_some());

        let filters = result.filters.unwrap();
        assert_eq!(filters.product_type.unwrap(), "flower");
        assert_eq!(filters.colors.unwrap(), vec!["red", "pink"]);
        assert!(filters.in_stock.unwrap());

        let pagination = result.pagination.unwrap();
        assert_eq!(pagination.page, 2);
        assert_eq!(pagination.per_page, 15);
    }

    #[test]
    fn test_parse_search_filters() {
        let params = SearchParams {
            q: None,
            product_type: Some("bouquet".to_string()),
            colors: Some("red, pink, white".to_string()),
            size: Some("large".to_string()),
            price_min: Some(20.0),
            price_max: Some(100.0),
            in_stock: Some(false),
            sort_by: None,
            sort_direction: None,
            page: None,
            per_page: None,
        };

        let filters = parse_search_filters(&params);
        assert_eq!(filters.product_type.unwrap(), "bouquet");
        assert_eq!(filters.colors.unwrap(), vec!["red", "pink", "white"]);
        assert_eq!(filters.size.unwrap(), "large");
        assert!(filters.price_min.is_some());
        assert!(filters.price_max.is_some());
        assert!(!filters.in_stock.unwrap());
    }

    #[test]
    fn test_has_filters() {
        let params_with_filters = SearchParams {
            q: None,
            product_type: Some("flower".to_string()),
            colors: None,
            size: None,
            price_min: None,
            price_max: None,
            in_stock: None,
            sort_by: None,
            sort_direction: None,
            page: None,
            per_page: None,
        };

        let params_without_filters = SearchParams {
            q: Some("rose".to_string()),
            product_type: None,
            colors: None,
            size: None,
            price_min: None,
            price_max: None,
            in_stock: None,
            sort_by: None,
            sort_direction: None,
            page: None,
            per_page: None,
        };

        assert!(has_filters(&params_with_filters));
        assert!(!has_filters(&params_without_filters));
    }
}
