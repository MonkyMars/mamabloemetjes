# Search System Documentation

This document provides comprehensive documentation for the search system implemented in the mamabloemetjes backend.

## Overview

The search system is a modular, efficient, and comprehensive solution that provides:

- **Full-text search** across product names, descriptions, SKUs, colors, sizes, and product types
- **Advanced filtering** by category, price range, colors, sizes, and stock availability
- **Intelligent ranking** with relevance scoring
- **Search suggestions** and autocomplete functionality
- **Search analytics** for tracking popular searches and user behavior
- **Auto-correction** and query expansion for better user experience
- **Multilingual support** (Dutch/English) for color and size terms

## Architecture

The search system is organized into several modular components:

### 1. Core Services (`src/services/search/`)

#### `SearchService` (mod.rs)
- Main coordinator for all search operations
- Handles search with corrections and suggestions
- Provides unified interface for search functionality

#### `ProductSearchService` (product_search.rs)
- Core search functionality with full-text search
- Advanced filtering and sorting capabilities
- Relevance scoring and ranking
- Pagination support

#### `SearchAnalyticsService` (search_analytics.rs)
- Tracks search queries and metrics
- Provides popular search terms
- Generates search insights and trends
- Cleanup functionality for old data

#### `SearchSuggestionsService` (search_suggestions.rs)
- Autocomplete and suggestion functionality
- Category-based suggestions
- Multilingual color and size suggestions
- Search history integration

### 2. API Endpoints (`src/routes/get/search.rs`)

All search endpoints are public and don't require authentication:

#### Primary Search Endpoint
```
GET /products/search
```

**Parameters:**
- `q` (optional): Search query string
- `product_type` (optional): Filter by product type (flower, bouquet)
- `colors` (optional): Comma-separated list of colors
- `size` (optional): Filter by size (small, medium, large, extralarge)
- `price_min` (optional): Minimum price filter
- `price_max` (optional): Maximum price filter
- `in_stock` (optional): Filter by stock availability (true/false)
- `sort_by` (optional): Sort field (relevance, name, price, date, stock)
- `sort_direction` (optional): Sort direction (asc, desc)
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 20, max: 100)

**Example:**
```
GET /products/search?q=rode%20rozen&product_type=flower&in_stock=true&sort_by=price&sort_direction=asc&page=1&per_page=10
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "products": [...],
    "total_count": 25,
    "page": 1,
    "per_page": 10,
    "total_pages": 3,
    "search_time_ms": 45,
    "suggestions": ["rode tulpen", "roze rozen"]
  }
}
```

#### Search Suggestions
```
GET /products/search/suggestions?q=roo
```

**Response:**
```json
{
  "status": "success",
  "data": ["rode rozen", "roze tulpen", "roos boeket"]
}
```

#### Popular Searches
```
GET /products/search/popular?per_page=5
```

**Response:**
```json
{
  "status": "success",
  "data": ["bruiloft boeket", "rode rozen", "verjaardag bloemen"]
}
```

### 3. Database Schema

#### Search Analytics Table
```sql
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_term VARCHAR(255) NOT NULL,
    search_count INTEGER NOT NULL DEFAULT 1,
    last_searched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_search_term UNIQUE (LOWER(search_term))
);
```

## Features

### 1. Full-Text Search with Relevance Scoring

The search system implements intelligent ranking based on:

- **Exact matches** (highest score: 100)
- **Prefix matches** (score: 80)
- **Substring matches** (score: 60)
- **SKU matches** (score: 40)
- **Description matches** (score: 20)
- **Color matches** (score: 30)
- **Product type matches** (score: 25)
- **Size matches** (score: 15)

### 2. Advanced Filtering

- **Product Type**: Filter by flower, bouquet, arrangement
- **Colors**: Multiple color selection with Dutch/English support
- **Size**: Filter by small, medium, large, extralarge
- **Price Range**: Min/max price filtering
- **Stock Availability**: Show only in-stock items

### 3. Intelligent Suggestions

- **Product Name Suggestions**: Based on existing product names
- **Category Suggestions**: Suggest product types
- **Color Suggestions**: Multilingual color suggestions
- **Size Suggestions**: Size-based suggestions
- **Search History**: Popular search terms from analytics

### 4. Search Analytics

- **Query Tracking**: All searches are logged (excluding empty queries)
- **Popular Terms**: Track most searched terms
- **Search Metrics**: Count, frequency, trends
- **Data Cleanup**: Automatic cleanup of old, low-frequency searches

### 5. Auto-Correction and Query Expansion

- **Dutch/English Translation**: Automatic translation of common terms
- **Spelling Tolerance**: Fuzzy matching for better results
- **Query Expansion**: Expand searches with related terms

## Usage Examples

### Basic Text Search
```rust
use crate::services::search::{SearchService, SearchQuery};

let query = SearchQuery {
    query: "rode rozen".to_string(),
    filters: None,
    sort: None,
    pagination: None,
};

let results = SearchService::search_products(query).await?;
```

### Advanced Filtered Search
```rust
use crate::services::search::{SearchQuery, SearchFilters, SearchSort, SearchSortField, SearchSortDirection};

let query = SearchQuery {
    query: "bloemen".to_string(),
    filters: Some(SearchFilters {
        product_type: Some("bouquet".to_string()),
        colors: Some(vec!["red".to_string(), "pink".to_string()]),
        price_min: Some(Decimal::from(10)),
        price_max: Some(Decimal::from(50)),
        in_stock: Some(true),
        size: None,
    }),
    sort: Some(SearchSort {
        field: SearchSortField::Price,
        direction: SearchSortDirection::Asc,
    }),
    pagination: Some(SearchPagination {
        page: 1,
        per_page: 20,
    }),
};

let results = SearchService::search_products(query).await?;
```

### Getting Suggestions
```rust
use crate::services::search::SearchService;

let suggestions = SearchService::quick_search("roo").await?;
```

## Performance Considerations

### Database Indexes

The system uses optimized indexes for fast search performance:

```sql
-- Product search indexes
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('dutch', name));
CREATE INDEX idx_products_description_search ON products USING gin(to_tsvector('dutch', description));
CREATE INDEX idx_products_active ON products (is_active) WHERE is_active = true;

-- Search analytics indexes
CREATE INDEX idx_search_analytics_popular ON search_analytics (search_count DESC, last_searched DESC) WHERE search_count > 1;
CREATE INDEX idx_search_analytics_search_term ON search_analytics (LOWER(search_term));
```

### Query Optimization

- **Pagination**: Results are paginated to prevent large data transfers
- **Relevance Scoring**: Uses efficient CASE statements for scoring
- **Selective Filtering**: Only applies filters when values are provided
- **CTE Usage**: Common Table Expressions for complex queries

### Caching Considerations

For high-traffic applications, consider implementing:

- **Redis caching** for popular search results
- **Search result caching** for identical queries
- **Suggestion caching** for autocomplete

## Configuration

### Environment Variables

Add these optional environment variables for search configuration:

```env
# Search configuration
SEARCH_MAX_RESULTS_PER_PAGE=100
SEARCH_DEFAULT_RESULTS_PER_PAGE=20
SEARCH_ANALYTICS_RETENTION_DAYS=365
SEARCH_MIN_QUERY_LENGTH=2
```

### Feature Flags

Configure search features through application settings:

```rust
pub struct SearchConfig {
    pub enable_analytics: bool,
    pub enable_suggestions: bool,
    pub enable_auto_correction: bool,
    pub max_suggestions: u32,
}
```

## Monitoring and Analytics

### Search Metrics

Monitor these key metrics:

- **Search volume**: Number of searches per day/hour
- **Zero-result searches**: Searches with no results
- **Popular terms**: Most searched terms
- **Search performance**: Average response time
- **User engagement**: Click-through rates on results

### Database Queries for Analytics

```sql
-- Most popular searches in the last 30 days
SELECT search_term, search_count, last_searched
FROM search_analytics
WHERE last_searched >= NOW() - INTERVAL '30 days'
ORDER BY search_count DESC
LIMIT 20;

-- Searches with no results (implement by tracking in analytics)
-- Daily search volume
SELECT DATE(last_searched) as search_date, COUNT(*) as searches
FROM search_analytics
WHERE last_searched >= NOW() - INTERVAL '7 days'
GROUP BY DATE(last_searched)
ORDER BY search_date DESC;
```

## Testing

### Unit Tests

Run search system tests:

```bash
cargo test search
```

### Integration Tests

Test complete search workflows:

```bash
cargo test --test search_integration
```

### Performance Tests

Load test search endpoints:

```bash
# Using wrk or similar tool
wrk -t12 -c400 -d30s http://localhost:3001/products/search?q=bloemen
```

## Future Enhancements

### Planned Features

1. **Elasticsearch Integration**: For even better full-text search
2. **Machine Learning**: Personalized search results
3. **Search Result Highlighting**: Highlight matching terms
4. **Faceted Search**: Dynamic filter suggestions
5. **Geographic Search**: Location-based filtering
6. **Image Search**: Search by product images

### API Improvements

1. **GraphQL Support**: Flexible query interface
2. **Search Export**: Export search results
3. **Saved Searches**: User search preferences
4. **Search Alerts**: Notify when new products match searches

## Troubleshooting

### Common Issues

1. **Slow Search Performance**
   - Check database indexes
   - Review query complexity
   - Consider adding caching

2. **No Search Results**
   - Verify product data
   - Check search term normalization
   - Review filtering logic

3. **Analytics Not Working**
   - Verify database permissions
   - Check error logs
   - Ensure analytics table exists

### Debug Queries

```sql
-- Check search analytics data
SELECT * FROM search_analytics ORDER BY search_count DESC LIMIT 10;

-- Verify product search data
SELECT id, name, description, colors, size, product_type
FROM products
WHERE is_active = true
AND LOWER(name) LIKE '%test%'
LIMIT 5;
```

## Security Considerations

- **SQL Injection**: All queries use parameterized statements
- **Rate Limiting**: Consider implementing search rate limits
- **Input Validation**: Search terms are normalized and validated
- **Data Privacy**: Search analytics don't store personal information

## Conclusion

The search system provides a robust, scalable foundation for product search functionality. It's designed to be modular, efficient, and user-friendly while providing comprehensive analytics and suggestions for continuous improvement.

For questions or contributions, please refer to the main project documentation or contact the development team.