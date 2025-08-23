pub mod product_search;
pub mod search_analytics;
pub mod search_suggestions;

use crate::structs::product::Product;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Error as SqlxError;

// Re-export main search functionality
pub use product_search::ProductSearchService;
pub use search_analytics::SearchAnalyticsService;
pub use search_suggestions::SearchSuggestionsService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub filters: Option<SearchFilters>,
    pub sort: Option<SearchSort>,
    pub pagination: Option<SearchPagination>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchFilters {
    pub product_type: Option<String>,
    pub colors: Option<Vec<String>>,
    pub size: Option<String>,
    pub price_min: Option<Decimal>,
    pub price_max: Option<Decimal>,
    pub in_stock: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSort {
    pub field: SearchSortField,
    pub direction: SearchSortDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SearchSortField {
    Relevance,
    Name,
    Price,
    CreatedAt,
    Stock,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SearchSortDirection {
    Asc,
    Desc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchPagination {
    pub page: u32,
    pub per_page: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub products: Vec<Product>,
    pub total_count: u64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
    pub search_time_ms: u64,
    pub suggestions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSuggestion {
    pub suggestion: String,
    pub category: String,
    pub score: f32,
}

// Main search coordinator service
pub struct SearchService;

impl SearchService {
    /// Perform a comprehensive product search
    pub async fn search_products(query: SearchQuery) -> Result<SearchResult, SqlxError> {
        let start_time = std::time::Instant::now();

        // Log the search query for analytics
        if !query.query.trim().is_empty() {
            let _ = SearchAnalyticsService::log_search(&query.query).await;
        }

        // Perform the main search
        let mut result = ProductSearchService::search(query).await?;

        // Add search time
        result.search_time_ms = start_time.elapsed().as_millis() as u64;

        // Add suggestions if query is not empty and we have few results
        if !result.products.is_empty() && result.total_count < 5 {
            result.suggestions =
                SearchSuggestionsService::get_suggestions(&result.products[0].name)
                    .await
                    .ok()
                    .map(|suggestions| suggestions.into_iter().map(|s| s.suggestion).collect());
        }

        Ok(result)
    }

    /// Quick search for autocomplete functionality
    pub async fn quick_search(query: &str) -> Result<Vec<SearchSuggestion>, SqlxError> {
        if query.trim().is_empty() || query.len() < 2 {
            return Ok(vec![]);
        }

        SearchSuggestionsService::get_suggestions(query).await
    }

    /// Get popular search terms
    pub async fn get_popular_searches(limit: Option<u32>) -> Result<Vec<String>, SqlxError> {
        SearchAnalyticsService::get_popular_searches(limit.unwrap_or(10)).await
    }

    /// Search with auto-correction
    pub async fn search_with_corrections(
        query: &str,
        filters: Option<SearchFilters>,
    ) -> Result<SearchResult, SqlxError> {
        let search_query = SearchQuery {
            query: query.to_string(),
            filters,
            sort: Some(SearchSort {
                field: SearchSortField::Relevance,
                direction: SearchSortDirection::Desc,
            }),
            pagination: Some(SearchPagination {
                page: 1,
                per_page: 20,
            }),
        };

        let mut result = Self::search_products(search_query).await?;

        // If we have very few results, try with a more lenient search
        if result.total_count < 3 && !query.trim().is_empty() {
            let corrected_query = Self::apply_search_corrections(query);
            if corrected_query != query {
                let corrected_search = SearchQuery {
                    query: corrected_query,
                    filters: result.products.first().map(|_| SearchFilters {
                        product_type: None,
                        colors: None,
                        size: None,
                        price_min: None,
                        price_max: None,
                        in_stock: Some(true),
                    }),
                    sort: Some(SearchSort {
                        field: SearchSortField::Relevance,
                        direction: SearchSortDirection::Desc,
                    }),
                    pagination: Some(SearchPagination {
                        page: 1,
                        per_page: 20,
                    }),
                };

                let corrected_result = Self::search_products(corrected_search).await?;
                if corrected_result.total_count > result.total_count {
                    result = corrected_result;
                }
            }
        }

        Ok(result)
    }

    /// Apply basic search corrections and expansions
    fn apply_search_corrections(query: &str) -> String {
        let mut corrected = query.to_lowercase();

        // Common Dutch spelling corrections for flower terms
        let corrections = [
            ("roos", "rose"),
            ("roses", "roos"),
            ("tulp", "tulip"),
            ("tulips", "tulp"),
            ("lelie", "lily"),
            ("lilies", "lelie"),
            ("boeket", "bouquet"),
            ("bouquets", "boeket"),
            ("wit", "white"),
            ("rood", "red"),
            ("roze", "pink"),
            ("geel", "yellow"),
            ("paars", "purple"),
            ("blauw", "blue"),
            ("groot", "large"),
            ("klein", "small"),
            ("medium", "medium"),
        ];

        for (from, to) in corrections.iter() {
            corrected = corrected.replace(from, to);
        }

        corrected
    }
}

impl Default for SearchPagination {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 20,
        }
    }
}

impl Default for SearchSort {
    fn default() -> Self {
        Self {
            field: SearchSortField::Relevance,
            direction: SearchSortDirection::Desc,
        }
    }
}
