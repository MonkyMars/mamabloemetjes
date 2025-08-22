use crate::services::PricingResult;
use crate::structs::enums::OrderStatus;
use crate::structs::order::{IncomingOrder, Order};
use crate::utils;
use chrono::Utc;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

impl std::fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let status = match self {
            OrderStatus::Pending => "pending",
            OrderStatus::Processing => "processing",
            OrderStatus::Shipped => "shipped",
            OrderStatus::Delivered => "delivered",
            OrderStatus::Cancelled => "cancelled",
        };
        write!(f, "{}", status)
    }
}

impl From<String> for OrderStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "pending" => OrderStatus::Pending,
            "processing" => OrderStatus::Processing,
            "shipped" => OrderStatus::Shipped,
            "delivered" => OrderStatus::Delivered,
            "cancelled" => OrderStatus::Cancelled,
            _ => OrderStatus::Pending,
        }
    }
}

impl Order {
    /// Calculate total from components
    pub fn calculate_total(&self) -> Decimal {
        self.subtotal + self.tax_amount + self.shipping_cost - self.discount_amount
    }

    /// Build order with pricing information from the pricing service.
    /// This method uses the calculated pricing including discounts
    pub fn build_order_with_pricing(
        payload: &IncomingOrder,
        pricing_result: &PricingResult,
    ) -> Self {
        let subtotal_before_discount = pricing_result.subtotal_before_discount;
        let discount_amount = pricing_result.total_discount_amount;
        let subtotal_after_discount = pricing_result.final_total;

        // Calculate tax on the discounted amount
        let tax_amount = utils::tax::Tax::calculate_tax(subtotal_after_discount);
        let shipping_cost = dec!(0.00);

        // Total is subtotal after discount + tax + shipping
        let total_amount = subtotal_after_discount + tax_amount + shipping_cost;

        Order {
            id: None,
            subtotal: subtotal_before_discount,
            tax_amount,
            shipping_cost,
            discount_amount,
            order_number: IncomingOrder::generate_order_number(),
            customer_id: payload.customer_id,
            notes: payload.notes.clone(),
            shipping_address: payload.shipping_address.clone(),
            billing_address: payload.billing_address.clone(),
            total_amount,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            status: OrderStatus::Pending,
        }
    }
}

impl IncomingOrder {
    /// Generate a human-readable order number
    pub fn generate_order_number() -> String {
        let timestamp = Utc::now().timestamp();
        format!("MB-{}", timestamp)
    }
}
