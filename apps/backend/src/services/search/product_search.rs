use crate::pool::connect::pool;
use crate::services::search::{
    SearchFilters, SearchPagination, SearchQuery, SearchResult, SearchSort, SearchSortDirection,
    SearchSortField,
};
use crate::structs::product::{Product, ProductImage};
use rust_decimal::Decimal;
use sqlx::{Error as SqlxError, Row};
use std::collections::HashMap;
use uuid::Uuid;

pub struct ProductSearchService;

impl ProductSearchService {
    /// Main search function with full-text search capabilities
    pub async fn search(query: SearchQuery) -> Result<SearchResult, SqlxError> {
        let pool = pool();
        let search_term = query.query.trim();

        // If no search term, return all products with filters
        if search_term.is_empty() {
            return Self::get_filtered_products(query.filters, query.sort, query.pagination).await;
        }

        let pagination = query.pagination.unwrap_or_default();
        let sort = query.sort.unwrap_or_default();
        let offset = (pagination.page - 1) * pagination.per_page;

        // Build the search query with full-text search and ranking
        let mut sql_query = String::from(
            r#"
            WITH search_results AS (
                SELECT
                    p.*,
                    i.quantity_on_hand,
                    i.quantity_reserved,
                    (i.quantity_on_hand - i.quantity_reserved) as available_stock,
                    -- Full-text search ranking with weights
                    (
                        -- Exact name match gets highest score
                        CASE WHEN LOWER(p.name) = LOWER($1) THEN 100
                             WHEN LOWER(p.name) LIKE LOWER($1 || '%') THEN 80
                             WHEN LOWER(p.name) LIKE LOWER('%' || $1 || '%') THEN 60
                             ELSE 0 END +
                        -- SKU match
                        CASE WHEN LOWER(p.sku) LIKE LOWER('%' || $1 || '%') THEN 40 ELSE 0 END +
                        -- Description match
                        CASE WHEN LOWER(p.description) LIKE LOWER('%' || $1 || '%') THEN 20 ELSE 0 END +
                        -- Colors array match (if exists)
                        CASE WHEN p.colors::text ILIKE '%' || $1 || '%' THEN 30 ELSE 0 END +
                        -- Product type match
                        CASE WHEN LOWER(p.product_type::text) LIKE LOWER('%' || $1 || '%') THEN 25 ELSE 0 END +
                        -- Size match (if exists)
                        CASE WHEN p.size::text ILIKE '%' || $1 || '%' THEN 15 ELSE 0 END
                    ) as search_score
                FROM products p
                JOIN inventory i ON p.id = i.product_id
                WHERE p.is_active = true
                AND (
                    LOWER(p.name) LIKE LOWER('%' || $1 || '%') OR
                    LOWER(p.sku) LIKE LOWER('%' || $1 || '%') OR
                    LOWER(p.description) LIKE LOWER('%' || $1 || '%') OR
                    p.colors::text ILIKE '%' || $1 || '%' OR
                    LOWER(p.product_type::text) LIKE LOWER('%' || $1 || '%') OR
                    p.size::text ILIKE '%' || $1 || '%'
                )
            "#,
        );

        // Add filters
        let mut param_count = 1;
        if let Some(filters) = &query.filters {
            if let Some(_) = &filters.product_type {
                param_count += 1;
                sql_query.push_str(&format!(
                    " AND LOWER(p.product_type::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    param_count += 1;
                    sql_query.push_str(&format!(" AND ("));
                    for (i, _) in colors.iter().enumerate() {
                        if i > 0 {
                            sql_query.push_str(" OR ");
                        }
                        param_count += 1;
                        sql_query.push_str(&format!(
                            "p.colors::text ILIKE '%' || ${} || '%'",
                            param_count
                        ));
                    }
                    sql_query.push_str(")");
                }
            }

            if let Some(_) = &filters.size {
                param_count += 1;
                sql_query.push_str(&format!(
                    " AND LOWER(p.size::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(_) = &filters.price_min {
                param_count += 1;
                sql_query.push_str(&format!(" AND p.price >= ${}", param_count));
            }

            if let Some(_) = &filters.price_max {
                param_count += 1;
                sql_query.push_str(&format!(" AND p.price <= ${}", param_count));
            }

            if let Some(in_stock) = filters.in_stock {
                if in_stock {
                    sql_query.push_str(" AND (i.quantity_on_hand - i.quantity_reserved) > 0");
                }
            }
        }

        // Close the CTE and add the main query
        sql_query.push_str(
            r#"
            )
            SELECT
                sr.*,
                pi.product_id as image_product_id,
                pi.url as image_url,
                pi.alt_text,
                pi.is_primary
            FROM search_results sr
            LEFT JOIN product_images pi ON sr.id = pi.product_id
            WHERE sr.search_score > 0
            "#,
        );

        // Add sorting
        match sort.field {
            SearchSortField::Relevance => {
                sql_query.push_str(" ORDER BY sr.search_score DESC, sr.name ASC");
            }
            SearchSortField::Name => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(
                    " ORDER BY sr.name {}, sr.search_score DESC",
                    direction
                ));
            }
            SearchSortField::Price => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(
                    " ORDER BY sr.price {}, sr.search_score DESC",
                    direction
                ));
            }
            SearchSortField::CreatedAt => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(
                    " ORDER BY sr.created_at {}, sr.search_score DESC",
                    direction
                ));
            }
            SearchSortField::Stock => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(
                    " ORDER BY sr.available_stock {}, sr.search_score DESC",
                    direction
                ));
            }
        }

        // Add pagination
        sql_query.push_str(&format!(" LIMIT {} OFFSET {}", pagination.per_page, offset));

        // Build the query with parameters
        let mut db_query = sqlx::query(&sql_query);
        db_query = db_query.bind(search_term);

        // Bind filter parameters in the same order they were added
        if let Some(filters) = &query.filters {
            if let Some(product_type) = &filters.product_type {
                db_query = db_query.bind(product_type);
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    for color in colors {
                        db_query = db_query.bind(color);
                    }
                }
            }

            if let Some(size) = &filters.size {
                db_query = db_query.bind(size);
            }

            if let Some(price_min) = &filters.price_min {
                db_query = db_query.bind(price_min);
            }

            if let Some(price_max) = &filters.price_max {
                db_query = db_query.bind(price_max);
            }
        }

        let rows = db_query.fetch_all(pool).await?;

        // Get total count for pagination
        let total_count = Self::get_search_count(search_term, &query.filters).await?;

        // Process results
        let products = Self::process_search_results(rows)?;

        let total_pages = (total_count as f64 / pagination.per_page as f64).ceil() as u32;

        Ok(SearchResult {
            products,
            total_count,
            page: pagination.page,
            per_page: pagination.per_page,
            total_pages,
            search_time_ms: 0, // Will be set by the caller
            suggestions: None,
        })
    }

    /// Get filtered products without search term
    async fn get_filtered_products(
        filters: Option<SearchFilters>,
        sort: Option<SearchSort>,
        pagination: Option<SearchPagination>,
    ) -> Result<SearchResult, SqlxError> {
        let pool = pool();
        let pagination = pagination.unwrap_or_default();
        let sort = sort.unwrap_or_default();
        let offset = (pagination.page - 1) * pagination.per_page;

        let mut sql_query = String::from(
            r#"
            SELECT
                p.*,
                i.quantity_on_hand,
                i.quantity_reserved,
                (i.quantity_on_hand - i.quantity_reserved) as available_stock,
                pi.product_id as image_product_id,
                pi.url as image_url,
                pi.alt_text,
                pi.is_primary
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            LEFT JOIN product_images pi ON p.id = pi.product_id
            WHERE p.is_active = true
            "#,
        );

        let mut param_count = 0;

        #[allow(unused_assignments)]
        let mut db_query = sqlx::query(&sql_query);

        // Add filters (same logic as above but without search term)
        if let Some(filters) = &filters {
            if let Some(_) = &filters.product_type {
                param_count += 1;
                sql_query.push_str(&format!(
                    " AND LOWER(p.product_type::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    sql_query.push_str(" AND (");
                    for (i, _) in colors.iter().enumerate() {
                        if i > 0 {
                            sql_query.push_str(" OR ");
                        }
                        param_count += 1;
                        sql_query.push_str(&format!(
                            "p.colors::text ILIKE '%' || ${} || '%'",
                            param_count
                        ));
                    }
                    sql_query.push_str(")");
                }
            }

            if let Some(_) = &filters.size {
                param_count += 1;
                sql_query.push_str(&format!(
                    " AND LOWER(p.size::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(_) = &filters.price_min {
                param_count += 1;
                sql_query.push_str(&format!(" AND p.price >= ${}", param_count));
            }

            if let Some(_) = &filters.price_max {
                param_count += 1;
                sql_query.push_str(&format!(" AND p.price <= ${}", param_count));
            }

            if let Some(in_stock) = filters.in_stock {
                if in_stock {
                    sql_query.push_str(" AND (i.quantity_on_hand - i.quantity_reserved) > 0");
                }
            }
        }

        // Add sorting
        match sort.field {
            SearchSortField::Relevance | SearchSortField::Name => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(" ORDER BY p.name {}", direction));
            }
            SearchSortField::Price => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(" ORDER BY p.price {}", direction));
            }
            SearchSortField::CreatedAt => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(" ORDER BY p.created_at {}", direction));
            }
            SearchSortField::Stock => {
                let direction = match sort.direction {
                    SearchSortDirection::Asc => "ASC",
                    SearchSortDirection::Desc => "DESC",
                };
                sql_query.push_str(&format!(" ORDER BY available_stock {}", direction));
            }
        }

        sql_query.push_str(&format!(" LIMIT {} OFFSET {}", pagination.per_page, offset));

        // Rebuild query with filters
        db_query = sqlx::query(&sql_query);
        if let Some(filters) = &filters {
            if let Some(product_type) = &filters.product_type {
                db_query = db_query.bind(product_type);
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    for color in colors {
                        db_query = db_query.bind(color);
                    }
                }
            }

            if let Some(size) = &filters.size {
                db_query = db_query.bind(size);
            }

            if let Some(price_min) = &filters.price_min {
                db_query = db_query.bind(price_min);
            }

            if let Some(price_max) = &filters.price_max {
                db_query = db_query.bind(price_max);
            }
        }

        let rows = db_query.fetch_all(pool).await?;

        // Get total count
        let total_count = Self::get_filter_count(&filters).await?;
        let products = Self::process_search_results(rows)?;
        let total_pages = (total_count as f64 / pagination.per_page as f64).ceil() as u32;

        Ok(SearchResult {
            products,
            total_count,
            page: pagination.page,
            per_page: pagination.per_page,
            total_pages,
            search_time_ms: 0,
            suggestions: None,
        })
    }

    /// Get total count for search results
    async fn get_search_count(
        search_term: &str,
        filters: &Option<SearchFilters>,
    ) -> Result<u64, SqlxError> {
        let pool = pool();

        let mut count_query = String::from(
            r#"
            SELECT COUNT(DISTINCT p.id) as count
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE p.is_active = true
            AND (
                LOWER(p.name) LIKE LOWER('%' || $1 || '%') OR
                LOWER(p.sku) LIKE LOWER('%' || $1 || '%') OR
                LOWER(p.description) LIKE LOWER('%' || $1 || '%') OR
                p.colors::text ILIKE '%' || $1 || '%' OR
                LOWER(p.product_type::text) LIKE LOWER('%' || $1 || '%') OR
                p.size::text ILIKE '%' || $1 || '%'
            )
            "#,
        );

        let mut param_count = 1;
        if let Some(filters) = filters {
            if let Some(_) = &filters.product_type {
                param_count += 1;
                count_query.push_str(&format!(
                    " AND LOWER(p.product_type::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    count_query.push_str(" AND (");
                    for (i, _) in colors.iter().enumerate() {
                        if i > 0 {
                            count_query.push_str(" OR ");
                        }
                        param_count += 1;
                        count_query.push_str(&format!(
                            "p.colors::text ILIKE '%' || ${} || '%'",
                            param_count
                        ));
                    }
                    count_query.push_str(")");
                }
            }

            if let Some(_) = &filters.size {
                param_count += 1;
                count_query.push_str(&format!(
                    " AND LOWER(p.size::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(_) = &filters.price_min {
                param_count += 1;
                count_query.push_str(&format!(" AND p.price >= ${}", param_count));
            }

            if let Some(_) = &filters.price_max {
                param_count += 1;
                count_query.push_str(&format!(" AND p.price <= ${}", param_count));
            }

            if let Some(in_stock) = filters.in_stock {
                if in_stock {
                    count_query.push_str(" AND (i.quantity_on_hand - i.quantity_reserved) > 0");
                }
            }
        }

        let mut db_query = sqlx::query(&count_query);
        db_query = db_query.bind(search_term);

        if let Some(filters) = filters {
            if let Some(product_type) = &filters.product_type {
                db_query = db_query.bind(product_type);
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    for color in colors {
                        db_query = db_query.bind(color);
                    }
                }
            }

            if let Some(size) = &filters.size {
                db_query = db_query.bind(size);
            }

            if let Some(price_min) = &filters.price_min {
                db_query = db_query.bind(price_min);
            }

            if let Some(price_max) = &filters.price_max {
                db_query = db_query.bind(price_max);
            }
        }

        let row = db_query.fetch_one(pool).await?;
        Ok(row.get::<i64, _>("count") as u64)
    }

    /// Get total count for filtered results (no search term)
    async fn get_filter_count(filters: &Option<SearchFilters>) -> Result<u64, SqlxError> {
        let pool = pool();

        let mut count_query = String::from(
            r#"
            SELECT COUNT(DISTINCT p.id) as count
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE p.is_active = true
            "#,
        );

        let mut param_count = 0;
        if let Some(filters) = filters {
            if let Some(_) = &filters.product_type {
                param_count += 1;
                count_query.push_str(&format!(
                    " AND LOWER(p.product_type::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    count_query.push_str(" AND (");
                    for (i, _) in colors.iter().enumerate() {
                        if i > 0 {
                            count_query.push_str(" OR ");
                        }
                        param_count += 1;
                        count_query.push_str(&format!(
                            "p.colors::text ILIKE '%' || ${} || '%'",
                            param_count
                        ));
                    }
                    count_query.push_str(")");
                }
            }

            if let Some(_) = &filters.size {
                param_count += 1;
                count_query.push_str(&format!(
                    " AND LOWER(p.size::text) = LOWER(${})",
                    param_count
                ));
            }

            if let Some(_) = &filters.price_min {
                param_count += 1;
                count_query.push_str(&format!(" AND p.price >= ${}", param_count));
            }

            if let Some(_) = &filters.price_max {
                param_count += 1;
                count_query.push_str(&format!(" AND p.price <= ${}", param_count));
            }

            if let Some(in_stock) = filters.in_stock {
                if in_stock {
                    count_query.push_str(" AND (i.quantity_on_hand - i.quantity_reserved) > 0");
                }
            }
        }

        let mut db_query = sqlx::query(&count_query);
        if let Some(filters) = filters {
            if let Some(product_type) = &filters.product_type {
                db_query = db_query.bind(product_type);
            }

            if let Some(colors) = &filters.colors {
                if !colors.is_empty() {
                    for color in colors {
                        db_query = db_query.bind(color);
                    }
                }
            }

            if let Some(size) = &filters.size {
                db_query = db_query.bind(size);
            }

            if let Some(price_min) = &filters.price_min {
                db_query = db_query.bind(price_min);
            }

            if let Some(price_max) = &filters.price_max {
                db_query = db_query.bind(price_max);
            }
        }

        let row = db_query.fetch_one(pool).await?;
        Ok(row.get::<i64, _>("count") as u64)
    }

    /// Process search results into Product structs
    fn process_search_results(rows: Vec<sqlx::postgres::PgRow>) -> Result<Vec<Product>, SqlxError> {
        let mut products_map: HashMap<Uuid, Product> = HashMap::new();
        let mut product_order: Vec<Uuid> = Vec::new();

        for row in rows {
            let product_id = row.get::<Uuid, _>("id");

            if !products_map.contains_key(&product_id) {
                product_order.push(product_id);
            }

            let available_stock: Decimal = row.get::<Decimal, _>("available_stock");

            let product = products_map.entry(product_id).or_insert_with(|| Product {
                id: product_id,
                name: row.get("name"),
                sku: row.get("sku"),
                price: row.get("price"),
                discounted_price: row.get("discounted_price"),
                tax: row.get("tax"),
                subtotal: row.get("subtotal"),
                is_active: row.get("is_active"),
                description: row.get("description"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                colors: row.get("colors"),
                stock: available_stock,
                size: row.get("size"),
                product_type: row.get("product_type"),
                images: Some(Vec::new()),
            });

            // Add image if it exists
            if let Ok(image_product_id) = row.try_get::<Uuid, _>("image_product_id") {
                if let Some(ref mut images) = product.images {
                    images.push(ProductImage {
                        product_id: image_product_id,
                        url: row.get("image_url"),
                        alt_text: row.get("alt_text"),
                        is_primary: row.get("is_primary"),
                    });
                }
            }
        }

        let products: Vec<Product> = product_order
            .into_iter()
            .filter_map(|id| products_map.remove(&id))
            .collect();

        Ok(products)
    }
}
