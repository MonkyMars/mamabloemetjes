use crate::structs::{IncomingOrder, ProductEntry};
use rust_decimal::Decimal;
use std::collections::HashMap;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum BusinessValidationError {
    #[error("Order total must be greater than 0")]
    InvalidOrderTotal,
    #[error("Order items cannot be empty")]
    EmptyOrderItems,
    #[error("Invalid product quantity: {0}. Must be greater than 0")]
    InvalidProductQuantity(i32),
    #[error("Duplicate product in order: {0}")]
    DuplicateProduct(Uuid),
    #[error("Order total exceeds maximum allowed amount of €50,000")]
    OrderTotalTooHigh,
    #[error("Order total below minimum allowed amount of €0.01")]
    OrderTotalTooLow,
    #[error("Too many items in order: {0}. Maximum allowed is 100")]
    TooManyItems(usize),
    #[error("Product quantity exceeds maximum allowed: {0}. Maximum is 999")]
    QuantityTooHigh(i32),
    #[error("Invalid customer ID")]
    InvalidCustomerId,
    #[error("Order notes exceed maximum length of 1000 characters")]
    NotesTooLong,
    #[error("Invalid price precision. Maximum 2 decimal places allowed")]
    InvalidPricePrecision,
    #[error("Negative price not allowed: {0}")]
    NegativePrice(Decimal),
    #[error("Empty product list in order content")]
    EmptyProductList,
    #[error("Order content cannot be empty")]
    EmptyOrderContent,
}

/// Business logic validation constants
pub struct BusinessRules;

impl BusinessRules {
    pub const MAX_ORDER_TOTAL: Decimal = Decimal::from_parts(5000000, 0, 0, false, 2); // €50,000.00
    pub const MIN_ORDER_TOTAL: Decimal = Decimal::from_parts(1, 0, 0, false, 2); // €0.01
    pub const MAX_ITEMS_PER_ORDER: usize = 100;
    pub const MAX_QUANTITY_PER_ITEM: i32 = 999;
    pub const MAX_NOTES_LENGTH: usize = 1000;
}

pub trait BusinessValidator {
    fn validate_business_rules(&self) -> Result<(), BusinessValidationError>;
}

impl BusinessValidator for IncomingOrder {
    fn validate_business_rules(&self) -> Result<(), BusinessValidationError> {
        // Validate customer ID
        if self.user_id.is_nil() {
            return Err(BusinessValidationError::InvalidCustomerId);
        }

        // Validate price constraints
        self.validate_price_constraints()?;

        // Validate order items
        self.validate_order_items()?;

        // Validate notes length
        if let Some(notes) = &self.notes {
            if notes.len() > BusinessRules::MAX_NOTES_LENGTH {
                return Err(BusinessValidationError::NotesTooLong);
            }
        }

        Ok(())
    }
}

impl IncomingOrder {
    /// Validate price constraints and precision
    fn validate_price_constraints(&self) -> Result<(), BusinessValidationError> {
        // Check if price is negative
        if self.price < Decimal::ZERO {
            return Err(BusinessValidationError::NegativePrice(self.price));
        }

        // Check minimum order total
        if self.price < BusinessRules::MIN_ORDER_TOTAL {
            return Err(BusinessValidationError::OrderTotalTooLow);
        }

        // Check maximum order total
        if self.price > BusinessRules::MAX_ORDER_TOTAL {
            return Err(BusinessValidationError::OrderTotalTooHigh);
        }

        // Check price precision (max 2 decimal places)
        if self.price.scale() > 2 {
            return Err(BusinessValidationError::InvalidPricePrecision);
        }

        Ok(())
    }

    /// Validate order items and quantities
    fn validate_order_items(&self) -> Result<(), BusinessValidationError> {
        // Check if items list is empty
        if self.items.is_empty() {
            return Err(BusinessValidationError::EmptyOrderItems);
        }

        // Count total unique products and validate quantities
        let mut all_products: HashMap<Uuid, i32> = HashMap::new();
        let mut total_items = 0;

        for order_content in &self.items {
            if order_content.product.is_empty() {
                return Err(BusinessValidationError::EmptyProductList);
            }

            for product_entry in &order_content.product {
                // Validate quantity
                if product_entry.quantity <= 0 {
                    return Err(BusinessValidationError::InvalidProductQuantity(
                        product_entry.quantity,
                    ));
                }

                if product_entry.quantity > BusinessRules::MAX_QUANTITY_PER_ITEM {
                    return Err(BusinessValidationError::QuantityTooHigh(
                        product_entry.quantity,
                    ));
                }

                // Check for duplicates and accumulate quantities
                if let Some(existing_quantity) = all_products.get(&product_entry.product_id) {
                    let total_quantity = existing_quantity + product_entry.quantity;
                    if total_quantity > BusinessRules::MAX_QUANTITY_PER_ITEM {
                        return Err(BusinessValidationError::QuantityTooHigh(total_quantity));
                    }
                    all_products.insert(product_entry.product_id, total_quantity);
                } else {
                    all_products.insert(product_entry.product_id, product_entry.quantity);
                }

                total_items += 1;
            }
        }

        // Check total items limit
        if total_items > BusinessRules::MAX_ITEMS_PER_ORDER {
            return Err(BusinessValidationError::TooManyItems(total_items));
        }

        Ok(())
    }

    /// Get total quantity of all items in the order
    pub fn calculate_total_quantity(&self) -> i32 {
        self.items
            .iter()
            .flat_map(|content| &content.product)
            .map(|product| product.quantity)
            .sum()
    }

    /// Get number of unique products in the order
    pub fn count_unique_products(&self) -> usize {
        let mut unique_products = std::collections::HashSet::new();
        for content in &self.items {
            for product in &content.product {
                unique_products.insert(product.product_id);
            }
        }
        unique_products.len()
    }

    /// Check if order contains duplicate products
    pub fn has_duplicate_products(&self) -> bool {
        let mut seen_products = std::collections::HashSet::new();
        for content in &self.items {
            for product in &content.product {
                if !seen_products.insert(product.product_id) {
                    return true;
                }
            }
        }
        false
    }

    /// Get all product IDs in the order
    pub fn get_product_ids(&self) -> Vec<Uuid> {
        self.items
            .iter()
            .flat_map(|content| &content.product)
            .map(|product| product.product_id)
            .collect()
    }

    /// Validate that the order structure is coherent
    pub fn validate_order_structure(&self) -> Result<(), BusinessValidationError> {
        // Ensure order content is not empty
        if self.items.is_empty() {
            return Err(BusinessValidationError::EmptyOrderContent);
        }

        // Validate each order content has products
        for content in &self.items {
            if content.product.is_empty() {
                return Err(BusinessValidationError::EmptyProductList);
            }
        }

        Ok(())
    }
}

/// Standalone validation functions for specific business rules

/// Validate order total amount
pub fn validate_order_total(total: Decimal) -> Result<(), BusinessValidationError> {
    if total < Decimal::ZERO {
        return Err(BusinessValidationError::NegativePrice(total));
    }

    if total < BusinessRules::MIN_ORDER_TOTAL {
        return Err(BusinessValidationError::OrderTotalTooLow);
    }

    if total > BusinessRules::MAX_ORDER_TOTAL {
        return Err(BusinessValidationError::OrderTotalTooHigh);
    }

    if total.scale() > 2 {
        return Err(BusinessValidationError::InvalidPricePrecision);
    }

    Ok(())
}

/// Validate product quantity
pub fn validate_product_quantity(quantity: i32) -> Result<(), BusinessValidationError> {
    if quantity <= 0 {
        return Err(BusinessValidationError::InvalidProductQuantity(quantity));
    }

    if quantity > BusinessRules::MAX_QUANTITY_PER_ITEM {
        return Err(BusinessValidationError::QuantityTooHigh(quantity));
    }

    Ok(())
}

/// Validate order notes
pub fn validate_order_notes(notes: Option<&str>) -> Result<(), BusinessValidationError> {
    if let Some(notes_text) = notes {
        if notes_text.len() > BusinessRules::MAX_NOTES_LENGTH {
            return Err(BusinessValidationError::NotesTooLong);
        }
    }
    Ok(())
}

/// Check if product list contains duplicates
pub fn has_duplicate_products(products: &[ProductEntry]) -> bool {
    let mut seen = std::collections::HashSet::new();
    products
        .iter()
        .any(|product| !seen.insert(product.product_id))
}

/// Comprehensive business validation for incoming orders
pub fn validate_complete_business_rules(
    order: &IncomingOrder,
) -> Result<(), BusinessValidationError> {
    order.validate_business_rules()?;
    order.validate_order_structure()?;
    Ok(())
}
