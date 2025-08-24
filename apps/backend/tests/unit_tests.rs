// Unit tests consolidated from various modules

// Tests for actions::get::search module
mod search_actions_tests {
    use mamabloemetjes_backend::actions::get::search::{
        SearchParams, has_filters, parse_search_filters, parse_search_params,
    };

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

// Tests for middleware::auth module
mod auth_middleware_tests {
    use mamabloemetjes_backend::middleware::auth::extract_token_from_header;

    #[test]
    fn test_extract_token_from_header() {
        assert_eq!(extract_token_from_header("Bearer abc123"), Some("abc123"));
        assert_eq!(extract_token_from_header("bearer abc123"), None);
        assert_eq!(extract_token_from_header("Basic abc123"), None);
        assert_eq!(extract_token_from_header("abc123"), None);
    }
}

// Tests for services::search::search_analytics module
mod search_analytics_tests {
    use mamabloemetjes_backend::services::search::search_analytics::SearchAnalyticsService;

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

// Tests for services::search::search_suggestions module
mod search_suggestions_tests {
    use mamabloemetjes_backend::services::search::search_suggestions::SearchSuggestionsService;

    #[test]
    fn test_normalize_query() {
        assert_eq!(
            SearchSuggestionsService::normalize_query("  Rose   Bouquet  "),
            "rose bouquet"
        );
        assert_eq!(
            SearchSuggestionsService::normalize_query("Red-Rose!@#"),
            "red-rose"
        );
    }

    #[test]
    fn test_expand_color_query() {
        assert_eq!(SearchSuggestionsService::expand_color_query("rood"), "red");
        assert_eq!(SearchSuggestionsService::expand_color_query("pink"), "roze");
        assert_eq!(
            SearchSuggestionsService::expand_color_query("unknown"),
            "unknown"
        );
    }

    #[test]
    fn test_translate_color() {
        assert_eq!(SearchSuggestionsService::translate_color("red"), "rode");
        assert_eq!(SearchSuggestionsService::translate_color("white"), "witte");
        assert_eq!(
            SearchSuggestionsService::translate_color("unknown"),
            "unknown"
        );
    }

    #[test]
    fn test_translate_size() {
        assert_eq!(SearchSuggestionsService::translate_size("small"), "klein");
        assert_eq!(SearchSuggestionsService::translate_size("large"), "groot");
        assert_eq!(
            SearchSuggestionsService::translate_size("unknown"),
            "unknown"
        );
    }
}
