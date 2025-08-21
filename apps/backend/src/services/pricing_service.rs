use crate::response::AppResponse;
use crate::services::product_service::{ProductPriceInfo, ProductService};
use crate::structs::order::IncomingOrder;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Result of pricing calculations with detailed breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingResult {
    pub products: Vec<ProductPriceInfo>,
    pub subtotal_before_discount: Decimal,
    pub total_discount_amount: Decimal,
    pub final_total: Decimal,
    pub is_valid: bool,
}

/// Service for handling all pricing operations including validation and discounts
pub struct PricingService;

impl PricingService {
    /// Comprehensive pricing calculation with validation
    /// This is the main entry point for order processing
    pub async fn calculate_and_validate_pricing(
        order: &IncomingOrder,
    ) -> AppResponse<PricingResult> {
        // Fetch products with discount calculations in a single operation
        let products = match ProductService::fetch_products_with_pricing(order).await {
            AppResponse::Success(products) => products,
            AppResponse::Error(err) => return AppResponse::Error(err),
        };

        // Calculate pricing breakdown
        let pricing_result = Self::build_pricing_result(&products, order.price);

        // Validate the total
        if let Err(validation_error) =
            ProductService::validate_total_price(pricing_result.final_total, order.price)
        {
            return AppResponse::Error(validation_error);
        }

        AppResponse::Success(pricing_result)
    }

    /// Calculate pricing for discount application only (no validation)
    pub async fn calculate_discounted_pricing(order: &IncomingOrder) -> AppResponse<PricingResult> {
        let products = match ProductService::fetch_products_with_pricing(order).await {
            AppResponse::Success(products) => products,
            AppResponse::Error(err) => return AppResponse::Error(err),
        };

        let pricing_result = Self::build_pricing_result(&products, order.price);
        AppResponse::Success(pricing_result)
    }

    /// Simple price validation without discount calculations
    /// Use this for basic order validation when discounts aren't needed
    pub async fn validate_order_pricing(order: &IncomingOrder) -> AppResponse<PricingResult> {
        let products = match ProductService::fetch_products_for_validation(order).await {
            AppResponse::Success(products) => products,
            AppResponse::Error(err) => return AppResponse::Error(err),
        };

        let pricing_result = Self::build_pricing_result(&products, order.price);

        // Validate the total
        match ProductService::validate_total_price(pricing_result.final_total, order.price) {
            Ok(()) => AppResponse::Success(pricing_result),
            Err(validation_error) => AppResponse::Error(validation_error),
        }
    }

    /// Get product information for external use (e.g., order line creation)
    pub async fn get_product_pricing_info(
        order: &IncomingOrder,
    ) -> AppResponse<Vec<ProductPriceInfo>> {
        ProductService::fetch_products_with_pricing(order).await
    }

    /// Internal: Build comprehensive pricing result from product data
    fn build_pricing_result(
        products: &[ProductPriceInfo],
        expected_total: Decimal,
    ) -> PricingResult {
        let subtotal_before_discount: Decimal =
            products.iter().map(|product| product.line_total).sum();

        let final_total = ProductService::calculate_total_from_products(products);
        let total_discount_amount = subtotal_before_discount - final_total;

        let is_valid = final_total == expected_total;

        PricingResult {
            products: products.to_vec(),
            subtotal_before_discount,
            total_discount_amount,
            final_total,
            is_valid,
        }
    }

    /// Calculate total savings from discounts
    pub fn calculate_total_savings(pricing_result: &PricingResult) -> Decimal {
        pricing_result.total_discount_amount
    }

    /// Get breakdown of discounts by product
    pub fn get_discount_breakdown(pricing_result: &PricingResult) -> Vec<ProductDiscountInfo> {
        pricing_result
            .products
            .iter()
            .filter(|product| product.best_discount_percentage > Decimal::ZERO)
            .map(|product| ProductDiscountInfo {
                product_id: product.id,
                product_name: product.name.clone(),
                original_price: product.original_price,
                discount_percentage: product.best_discount_percentage,
                discounted_price: product.discounted_price,
                savings_per_unit: product.original_price - product.discounted_price,
                total_savings: (product.original_price - product.discounted_price)
                    * Decimal::from(product.quantity),
            })
            .collect()
    }
}

/// Detailed discount information for a specific product
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductDiscountInfo {
    pub product_id: uuid::Uuid,
    pub product_name: String,
    pub original_price: Decimal,
    pub discount_percentage: Decimal,
    pub discounted_price: Decimal,
    pub savings_per_unit: Decimal,
    pub total_savings: Decimal,
}
