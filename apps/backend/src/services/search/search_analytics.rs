use crate::pool::connect::pool;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Error as SqlxError, Row};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchAnalytics {
    pub id: Uuid,
    pub search_term: String,
    pub search_count: i32,
    pub last_searched: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMetrics {
    pub total_searches: u64,
    pub unique_terms: u64,
    pub popular_searches: Vec<PopularSearch>,
    pub recent_searches: Vec<String>,
    pub search_trends: Vec<SearchTrend>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PopularSearch {
    pub term: String,
    pub count: i32,
    pub percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchTrend {
    pub date: String,
    pub search_count: i32,
    pub unique_searches: i32,
}

pub struct SearchAnalyticsService;

impl SearchAnalyticsService {
    /// Log a search query for analytics
    pub async fn log_search(search_term: &str) -> Result<(), SqlxError> {
        let pool = pool();
        let normalized_term = Self::normalize_search_term(search_term);

        if normalized_term.is_empty() || normalized_term.len() < 2 {
            return Ok(());
        }

        // First, try to update existing search record
        let updated_rows = sqlx::query(
            r#"
            UPDATE search_analytics
            SET search_count = search_count + 1,
                last_searched = NOW(),
                updated_at = NOW()
            WHERE LOWER(search_term) = LOWER($1)
            "#,
        )
        .bind(&normalized_term)
        .execute(pool)
        .await?;

        // If no rows were updated, insert a new record
        if updated_rows.rows_affected() == 0 {
            sqlx::query(
                r#"
                INSERT INTO search_analytics (id, search_term, search_count, last_searched, created_at, updated_at)
                VALUES ($1, $2, 1, NOW(), NOW(), NOW())
                ON CONFLICT (search_term) DO UPDATE SET
                    search_count = search_analytics.search_count + 1,
                    last_searched = NOW(),
                    updated_at = NOW()
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(&normalized_term)
            .execute(pool)
            .await?;
        }

        Ok(())
    }

    /// Get popular search terms
    pub async fn get_popular_searches(limit: u32) -> Result<Vec<String>, SqlxError> {
        let pool = pool();

        let rows = sqlx::query(
            r#"
            SELECT search_term
            FROM search_analytics
            WHERE search_count > 1
            ORDER BY search_count DESC, last_searched DESC
            LIMIT $1
            "#,
        )
        .bind(limit as i64)
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|row| row.get("search_term")).collect())
    }

    /// Get detailed popular searches with counts
    pub async fn get_popular_searches_with_counts(
        limit: u32,
    ) -> Result<Vec<PopularSearch>, SqlxError> {
        let pool = pool();

        // First get total search count
        let total_row = sqlx::query("SELECT SUM(search_count) as total FROM search_analytics")
            .fetch_one(pool)
            .await?;

        let total_searches: i64 = total_row.get::<Option<i64>, _>("total").unwrap_or(0);

        let rows = sqlx::query(
            r#"
            SELECT search_term, search_count
            FROM search_analytics
            WHERE search_count > 1
            ORDER BY search_count DESC, last_searched DESC
            LIMIT $1
            "#,
        )
        .bind(limit as i64)
        .fetch_all(pool)
        .await?;

        let popular_searches = rows
            .into_iter()
            .map(|row| {
                let count: i32 = row.get("search_count");
                let percentage = if total_searches > 0 {
                    (count as f32 / total_searches as f32) * 100.0
                } else {
                    0.0
                };

                PopularSearch {
                    term: row.get("search_term"),
                    count,
                    percentage,
                }
            })
            .collect();

        Ok(popular_searches)
    }

    /// Get search suggestions based on popular searches
    pub async fn get_search_suggestions(query: &str, limit: u32) -> Result<Vec<String>, SqlxError> {
        let pool = pool();
        let normalized_query = Self::normalize_search_term(query);

        if normalized_query.len() < 2 {
            return Ok(vec![]);
        }

        let rows = sqlx::query(
            r#"
            SELECT search_term
            FROM search_analytics
            WHERE LOWER(search_term) LIKE LOWER('%' || $1 || '%')
            AND search_count > 1
            AND LENGTH(search_term) > LENGTH($1)
            ORDER BY search_count DESC, last_searched DESC
            LIMIT $2
            "#,
        )
        .bind(&normalized_query)
        .bind(limit as i64)
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|row| row.get("search_term")).collect())
    }

    /// Get comprehensive search metrics
    pub async fn get_search_metrics() -> Result<SearchMetrics, SqlxError> {
        let pool = pool();

        // Get total searches and unique terms
        let totals_row = sqlx::query(
            r#"
            SELECT
                SUM(search_count) as total_searches,
                COUNT(DISTINCT search_term) as unique_terms
            FROM search_analytics
            "#,
        )
        .fetch_one(pool)
        .await?;

        let total_searches: u64 = totals_row
            .get::<Option<i64>, _>("total_searches")
            .unwrap_or(0) as u64;
        let unique_terms: u64 = totals_row
            .get::<Option<i64>, _>("unique_terms")
            .unwrap_or(0) as u64;

        // Get popular searches
        let popular_searches = Self::get_popular_searches_with_counts(10).await?;

        // Get recent unique searches
        let recent_rows = sqlx::query(
            r#"
            SELECT search_term
            FROM search_analytics
            ORDER BY last_searched DESC
            LIMIT 20
            "#,
        )
        .fetch_all(pool)
        .await?;

        let recent_searches: Vec<String> = recent_rows
            .into_iter()
            .map(|row| row.get("search_term"))
            .collect();

        // Get search trends for the last 7 days
        let trends_rows = sqlx::query(
            r#"
            SELECT
                DATE(last_searched) as search_date,
                SUM(search_count) as daily_searches,
                COUNT(DISTINCT search_term) as unique_daily_searches
            FROM search_analytics
            WHERE last_searched >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(last_searched)
            ORDER BY search_date DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        let search_trends: Vec<SearchTrend> = trends_rows
            .into_iter()
            .map(|row| SearchTrend {
                date: row.get::<chrono::NaiveDate, _>("search_date").to_string(),
                search_count: row.get::<Option<i64>, _>("daily_searches").unwrap_or(0) as i32,
                unique_searches: row
                    .get::<Option<i64>, _>("unique_daily_searches")
                    .unwrap_or(0) as i32,
            })
            .collect();

        Ok(SearchMetrics {
            total_searches,
            unique_terms,
            popular_searches,
            recent_searches,
            search_trends,
        })
    }

    /// Get search analytics for admin dashboard
    pub async fn get_search_analytics_admin(
        limit: Option<u32>,
        days: Option<u32>,
    ) -> Result<Vec<SearchAnalytics>, SqlxError> {
        let pool = pool();
        let limit = limit.unwrap_or(50);
        let days = days.unwrap_or(30);

        let rows = sqlx::query(
            r#"
            SELECT id, search_term, search_count, last_searched, created_at, updated_at
            FROM search_analytics
            WHERE last_searched >= NOW() - INTERVAL $1 || ' days'
            ORDER BY search_count DESC, last_searched DESC
            LIMIT $2
            "#,
        )
        .bind(days.to_string())
        .bind(limit as i64)
        .fetch_all(pool)
        .await?;

        let analytics: Vec<SearchAnalytics> = rows
            .into_iter()
            .map(|row| SearchAnalytics {
                id: row.get("id"),
                search_term: row.get("search_term"),
                search_count: row.get("search_count"),
                last_searched: row.get("last_searched"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
            .collect();

        Ok(analytics)
    }

    /// Clean up old search analytics (admin function)
    pub async fn cleanup_old_analytics(days_to_keep: u32) -> Result<u64, SqlxError> {
        let pool = pool();

        let result = sqlx::query(
            r#"
            DELETE FROM search_analytics
            WHERE last_searched < NOW() - INTERVAL $1 || ' days'
            AND search_count < 2
            "#,
        )
        .bind(days_to_keep.to_string())
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Normalize search terms for consistent analytics
    fn normalize_search_term(term: &str) -> String {
        term.trim()
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '-')
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ")
    }

    /// Get search term suggestions for autocomplete
    pub async fn get_autocomplete_suggestions(
        query: &str,
        limit: u32,
    ) -> Result<Vec<String>, SqlxError> {
        let pool = pool();
        let normalized_query = Self::normalize_search_term(query);

        if normalized_query.len() < 2 {
            return Self::get_popular_searches(limit).await;
        }

        // First try exact prefix matches
        let prefix_rows = sqlx::query(
            r#"
            SELECT search_term, search_count
            FROM search_analytics
            WHERE LOWER(search_term) LIKE LOWER($1 || '%')
            AND search_count > 0
            ORDER BY search_count DESC
            LIMIT $2
            "#,
        )
        .bind(&normalized_query)
        .bind(limit as i64)
        .fetch_all(pool)
        .await?;

        let mut suggestions: Vec<String> = prefix_rows
            .into_iter()
            .map(|row| row.get("search_term"))
            .collect();

        // If we don't have enough suggestions, add fuzzy matches
        if suggestions.len() < limit as usize {
            let remaining_limit = limit as i64 - suggestions.len() as i64;

            let fuzzy_rows = sqlx::query(
                r#"
                SELECT search_term, search_count
                FROM search_analytics
                WHERE LOWER(search_term) LIKE LOWER('%' || $1 || '%')
                AND NOT LOWER(search_term) LIKE LOWER($1 || '%')
                AND search_count > 0
                ORDER BY search_count DESC
                LIMIT $2
                "#,
            )
            .bind(&normalized_query)
            .bind(remaining_limit)
            .fetch_all(pool)
            .await?;

            let fuzzy_suggestions: Vec<String> = fuzzy_rows
                .into_iter()
                .map(|row| row.get("search_term"))
                .collect();

            suggestions.extend(fuzzy_suggestions);
        }

        // Remove duplicates and limit results
        suggestions.sort();
        suggestions.dedup();
        suggestions.truncate(limit as usize);

        Ok(suggestions)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_search_term() {
        assert_eq!(
            SearchAnalyticsService::normalize_search_term("  Rose   Bouquet  "),
            "rose bouquet"
        );
        assert_eq!(
            SearchAnalyticsService::normalize_search_term("Red-Rose"),
            "red-rose"
        );
        assert_eq!(
            SearchAnalyticsService::normalize_search_term("Special@#$%Characters!"),
            "specialcharacters"
        );
        assert_eq!(SearchAnalyticsService::normalize_search_term(""), "");
    }
}
