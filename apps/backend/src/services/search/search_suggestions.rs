use crate::pool::connect::pool;
use crate::services::search::SearchSuggestion;
use serde::{Deserialize, Serialize};
use sqlx::{Error as SqlxError, Row};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductSuggestion {
    pub name: String,
    pub category: String,
    pub popularity: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestionCategory {
    pub category: String,
    pub suggestions: Vec<String>,
}

pub struct SearchSuggestionsService;

impl SearchSuggestionsService {
    /// Get search suggestions based on product data and search history
    pub async fn get_suggestions(query: &str) -> Result<Vec<SearchSuggestion>, SqlxError> {
        let normalized_query = Self::normalize_query(query);

        if normalized_query.len() < 2 {
            return Self::get_popular_suggestions().await;
        }

        let mut suggestions = Vec::new();

        // Get product name suggestions
        suggestions.extend(Self::get_product_name_suggestions(&normalized_query).await?);

        // Get category suggestions
        suggestions.extend(Self::get_category_suggestions(&normalized_query).await?);

        // Get color suggestions
        suggestions.extend(Self::get_color_suggestions(&normalized_query).await?);

        // Get size suggestions
        suggestions.extend(Self::get_size_suggestions(&normalized_query).await?);

        // Get search history suggestions
        suggestions.extend(Self::get_search_history_suggestions(&normalized_query).await?);

        // Sort by score and remove duplicates
        suggestions.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Remove duplicates while preserving order
        let mut seen = HashSet::new();
        suggestions.retain(|item| seen.insert(item.suggestion.clone()));

        // Limit to top 10 suggestions
        suggestions.truncate(10);

        Ok(suggestions)
    }

    /// Get product name suggestions
    async fn get_product_name_suggestions(query: &str) -> Result<Vec<SearchSuggestion>, SqlxError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT
                p.name,
                p.product_type,
                COUNT(*) OVER (PARTITION BY p.name) as popularity,
                CASE
                    WHEN LOWER(p.name) = LOWER($1) THEN 100
                    WHEN LOWER(p.name) LIKE LOWER($1 || '%') THEN 80
                    WHEN LOWER(p.name) LIKE LOWER('%' || $1 || '%') THEN 60
                    ELSE 40
                END as relevance_score
            FROM products p
            WHERE p.is_active = true
            AND (
                LOWER(p.name) LIKE LOWER('%' || $1 || '%') OR
                LOWER(p.description) LIKE LOWER('%' || $1 || '%')
            )
            ORDER BY relevance_score DESC, popularity DESC
            LIMIT 5
            "#,
        )
        .bind(query)
        .fetch_all(pool)
        .await?;

        let suggestions = rows
            .into_iter()
            .map(|row| {
                let name: String = row.get("name");
                let product_type: String = row.get("product_type");
                let relevance_score: i32 = row.get("relevance_score");

                SearchSuggestion {
                    suggestion: name,
                    category: format!("product:{}", product_type),
                    score: relevance_score as f32,
                }
            })
            .collect();

        Ok(suggestions)
    }

    /// Get category-based suggestions
    async fn get_category_suggestions(query: &str) -> Result<Vec<SearchSuggestion>, SqlxError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT
                p.product_type,
                COUNT(*) as count
            FROM products p
            WHERE p.is_active = true
            AND LOWER(p.product_type::text) LIKE LOWER('%' || $1 || '%')
            GROUP BY p.product_type
            ORDER BY count DESC
            LIMIT 3
            "#,
        )
        .bind(query)
        .fetch_all(pool)
        .await?;

        let suggestions = rows
            .into_iter()
            .map(|row| {
                let product_type: String = row.get("product_type");
                let count: i64 = row.get("count");

                SearchSuggestion {
                    suggestion: Self::format_category_suggestion(&product_type),
                    category: "category".to_string(),
                    score: (count as f32).min(50.0),
                }
            })
            .collect();

        Ok(suggestions)
    }

    /// Get color-based suggestions
    async fn get_color_suggestions(query: &str) -> Result<Vec<SearchSuggestion>, SqlxError> {
        let pool = pool();

        // Common Dutch/English color mappings
        let color_query = Self::expand_color_query(query);

        let rows = sqlx::query(
            r#"
            SELECT
                DISTINCT unnest(p.colors) as color,
                COUNT(*) OVER (PARTITION BY unnest(p.colors)) as count
            FROM products p
            WHERE p.is_active = true
            AND p.colors IS NOT NULL
            AND (
                p.colors::text ILIKE '%' || $1 || '%' OR
                p.colors::text ILIKE '%' || $2 || '%'
            )
            ORDER BY count DESC
            LIMIT 3
            "#,
        )
        .bind(query)
        .bind(&color_query)
        .fetch_all(pool)
        .await?;

        let suggestions = rows
            .into_iter()
            .map(|row| {
                let color: String = row.get("color");
                let count: i64 = row.get("count");

                SearchSuggestion {
                    suggestion: format!("{} bloemen", Self::translate_color(&color)),
                    category: "color".to_string(),
                    score: (count as f32 * 0.8).min(40.0),
                }
            })
            .collect();

        Ok(suggestions)
    }

    /// Get size-based suggestions
    async fn get_size_suggestions(query: &str) -> Result<Vec<SearchSuggestion>, SqlxError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT
                p.size,
                COUNT(*) as count
            FROM products p
            WHERE p.is_active = true
            AND p.size IS NOT NULL
            AND p.size::text ILIKE '%' || $1 || '%'
            GROUP BY p.size
            ORDER BY count DESC
            LIMIT 2
            "#,
        )
        .bind(query)
        .fetch_all(pool)
        .await?;

        let suggestions = rows
            .into_iter()
            .map(|row| {
                let size: String = row.get("size");
                let count: i64 = row.get("count");

                SearchSuggestion {
                    suggestion: format!("{} boeket", Self::translate_size(&size)),
                    category: "size".to_string(),
                    score: (count as f32 * 0.6).min(30.0),
                }
            })
            .collect();

        Ok(suggestions)
    }

    /// Get suggestions from search history
    async fn get_search_history_suggestions(
        query: &str,
    ) -> Result<Vec<SearchSuggestion>, SqlxError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT
                search_term,
                search_count,
                CASE
                    WHEN LOWER(search_term) LIKE LOWER($1 || '%') THEN 70
                    WHEN LOWER(search_term) LIKE LOWER('%' || $1 || '%') THEN 50
                    ELSE 30
                END as relevance_score
            FROM search_analytics
            WHERE LOWER(search_term) LIKE LOWER('%' || $1 || '%')
            AND search_count > 1
            AND LENGTH(search_term) > LENGTH($1)
            ORDER BY relevance_score DESC, search_count DESC
            LIMIT 3
            "#,
        )
        .bind(query)
        .fetch_all(pool)
        .await?;

        let suggestions = rows
            .into_iter()
            .map(|row| {
                let search_term: String = row.get("search_term");
                let search_count: i32 = row.get("search_count");
                let relevance_score: i32 = row.get("relevance_score");

                SearchSuggestion {
                    suggestion: search_term,
                    category: "history".to_string(),
                    score: (relevance_score as f32 + (search_count as f32 * 0.1)).min(75.0),
                }
            })
            .collect();

        Ok(suggestions)
    }

    /// Get popular suggestions when no query is provided
    async fn get_popular_suggestions() -> Result<Vec<SearchSuggestion>, SqlxError> {
        let pool = pool();

        // Get popular search terms
        let search_rows = sqlx::query(
            r#"
            SELECT search_term, search_count
            FROM search_analytics
            WHERE search_count > 2
            ORDER BY search_count DESC
            LIMIT 3
            "#,
        )
        .fetch_all(pool)
        .await?;

        let mut suggestions: Vec<SearchSuggestion> = search_rows
            .into_iter()
            .map(|row| {
                let search_term: String = row.get("search_term");
                let search_count: i32 = row.get("search_count");

                SearchSuggestion {
                    suggestion: search_term,
                    category: "popular".to_string(),
                    score: (search_count as f32 * 0.5).min(60.0),
                }
            })
            .collect();

        // Add some default popular categories
        let default_suggestions = vec![
            SearchSuggestion {
                suggestion: "bruiloft boeket".to_string(),
                category: "popular".to_string(),
                score: 90.0,
            },
            SearchSuggestion {
                suggestion: "rode rozen".to_string(),
                category: "popular".to_string(),
                score: 85.0,
            },
            SearchSuggestion {
                suggestion: "verjaardag bloemen".to_string(),
                category: "popular".to_string(),
                score: 80.0,
            },
        ];

        suggestions.extend(default_suggestions);
        suggestions.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        suggestions.truncate(6);

        Ok(suggestions)
    }

    /// Get categorized suggestions for advanced search UI
    pub async fn get_categorized_suggestions(
        query: &str,
    ) -> Result<Vec<SuggestionCategory>, SqlxError> {
        let suggestions = Self::get_suggestions(query).await?;

        let mut categories: std::collections::HashMap<String, Vec<String>> =
            std::collections::HashMap::new();

        for suggestion in suggestions {
            let category_name = match suggestion.category.as_str() {
                s if s.starts_with("product:") => "Producten",
                "category" => "Categorieën",
                "color" => "Kleuren",
                "size" => "Maten",
                "history" => "Eerder gezocht",
                "popular" => "Populair",
                _ => "Overig",
            };

            categories
                .entry(category_name.to_string())
                .or_insert_with(Vec::new)
                .push(suggestion.suggestion);
        }

        let categorized: Vec<SuggestionCategory> = categories
            .into_iter()
            .map(|(category, suggestions)| SuggestionCategory {
                category,
                suggestions,
            })
            .collect();

        Ok(categorized)
    }

    /// Normalize query for consistent processing
    pub fn normalize_query(query: &str) -> String {
        query
            .trim()
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '-')
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ")
    }

    /// Expand color queries to include Dutch/English variants
    pub fn expand_color_query(query: &str) -> String {
        let color_mappings = [
            ("rood", "red"),
            ("red", "rood"),
            ("roze", "pink"),
            ("pink", "roze"),
            ("wit", "white"),
            ("white", "wit"),
            ("geel", "yellow"),
            ("yellow", "geel"),
            ("blauw", "blue"),
            ("blue", "blauw"),
            ("paars", "purple"),
            ("purple", "paars"),
            ("groen", "green"),
            ("green", "groen"),
            ("oranje", "orange"),
            ("orange", "oranje"),
        ];

        for (dutch, english) in color_mappings.iter() {
            if query.contains(dutch) {
                return english.to_string();
            } else if query.contains(english) {
                return dutch.to_string();
            }
        }

        query.to_string()
    }

    /// Translate color names to Dutch
    pub fn translate_color(color: &str) -> String {
        match color.to_lowercase().as_str() {
            "red" => "rode",
            "pink" => "roze",
            "white" => "witte",
            "yellow" => "gele",
            "blue" => "blauwe",
            "purple" => "paarse",
            "green" => "groene",
            "orange" => "oranje",
            _ => color,
        }
        .to_string()
    }

    /// Translate size names to Dutch
    pub fn translate_size(size: &str) -> String {
        match size.to_lowercase().as_str() {
            "small" => "klein",
            "medium" => "medium",
            "large" => "groot",
            "extralarge" => "extra groot",
            _ => size,
        }
        .to_string()
    }

    /// Format category suggestions in Dutch
    fn format_category_suggestion(category: &str) -> String {
        match category.to_lowercase().as_str() {
            "flower" => "enkele bloemen".to_string(),
            "bouquet" => "boeketten".to_string(),
            "arrangement" => "arrangementen".to_string(),
            _ => format!("{} bloemen", category),
        }
    }
}
