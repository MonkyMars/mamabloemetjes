// #[cfg(test)]
// mod promotion_tests {
//     use chrono::Utc;

//     use mamabloemetjes_backend::structs::promotion::{
//         CreateDiscountPromotion, DiscountPromotion, PriceValidationItem, PriceValidationRequest,
//     };
//     use rust_decimal::Decimal;
//     use uuid::Uuid;

//     #[test]
//     fn test_discount_promotion_is_active() {
//         let now = Utc::now();
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(20),
//             start_date: now - chrono::Duration::days(1),
//             end_date: now + chrono::Duration::days(1),
//             created_at: now,
//             updated_at: now,
//         };

//         assert!(promotion.is_active());
//     }

//     #[test]
//     fn test_discount_promotion_is_not_active_expired() {
//         let now = Utc::now();
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(20),
//             start_date: now - chrono::Duration::days(10),
//             end_date: now - chrono::Duration::days(1),
//             created_at: now,
//             updated_at: now,
//         };

//         assert!(!promotion.is_active());
//     }

//     #[test]
//     fn test_discount_promotion_is_not_active_future() {
//         let now = Utc::now();
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(20),
//             start_date: now + chrono::Duration::days(1),
//             end_date: now + chrono::Duration::days(10),
//             created_at: now,
//             updated_at: now,
//         };

//         assert!(!promotion.is_active());
//     }

//     #[test]
//     fn test_discount_promotion_applies_to_product() {
//         let product_id = Uuid::new_v4();
//         let other_product_id = Uuid::new_v4();
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![product_id, Uuid::new_v4()],
//             discount_percentage: Decimal::from(20),
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(1),
//             created_at: Utc::now(),
//             updated_at: Utc::now(),
//         };

//         assert!(promotion.applies_to_product(&product_id));
//         assert!(!promotion.applies_to_product(&other_product_id));
//     }

//     #[test]
//     fn test_discount_promotion_calculate_discounted_price() {
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(20), // 20% off
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(1),
//             created_at: Utc::now(),
//             updated_at: Utc::now(),
//         };

//         let subtotal = Decimal::from(100); // €100.00
//         let tax = Decimal::from(21); // €21.00
//         let discounted_price = promotion.calculate_discounted_price(subtotal, tax);

//         // Discount applied to subtotal: €100 * 0.20 = €20 off
//         // Discounted subtotal: €100 - €20 = €80
//         // Final price: €80 + €21 = €101
//         assert_eq!(discounted_price, Decimal::from(101));
//     }

//     #[test]
//     fn test_discount_promotion_calculate_discount_amount() {
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(25), // 25% off
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(1),
//             created_at: Utc::now(),
//             updated_at: Utc::now(),
//         };

//         let subtotal = Decimal::from(80); // €80.00
//         let discount_amount = promotion.calculate_discount_amount(subtotal);

//         // 25% of €80 = €20
//         assert_eq!(discount_amount, Decimal::from(20));
//     }

//     #[test]
//     fn test_create_discount_promotion_validation_valid() {
//         let promotion = CreateDiscountPromotion {
//             product_ids: vec![Uuid::new_v4(), Uuid::new_v4()],
//             discount_percentage: Decimal::from(15),
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(7),
//         };

//         assert!(promotion.validate().is_ok());
//     }

//     #[test]
//     fn test_create_discount_promotion_validation_invalid_percentage_zero() {
//         let promotion = CreateDiscountPromotion {
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::ZERO,
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(7),
//         };

//         assert!(promotion.validate().is_err());
//     }

//     #[test]
//     fn test_create_discount_promotion_validation_invalid_percentage_too_high() {
//         let promotion = CreateDiscountPromotion {
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(150), // 150% is invalid
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(7),
//         };

//         assert!(promotion.validate().is_err());
//     }

//     #[test]
//     fn test_create_discount_promotion_validation_invalid_dates() {
//         let now = Utc::now();
//         let promotion = CreateDiscountPromotion {
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(20),
//             start_date: now,
//             end_date: now - chrono::Duration::days(1), // End before start
//         };

//         assert!(promotion.validate().is_err());
//     }

//     #[test]
//     fn test_create_discount_promotion_validation_empty_product_ids() {
//         let promotion = CreateDiscountPromotion {
//             product_ids: vec![], // Empty product list
//             discount_percentage: Decimal::from(20),
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(7),
//         };

//         assert!(promotion.validate().is_err());
//     }

//     #[test]
//     fn test_price_validation_request_creation() {
//         let item1 = PriceValidationItem {
//             product_id: Uuid::new_v4(),
//             quantity: 2,
//             expected_unit_price_cents: 2500, // €25.00
//         };

//         let item2 = PriceValidationItem {
//             product_id: Uuid::new_v4(),
//             quantity: 1,
//             expected_unit_price_cents: 1000, // €10.00
//         };

//         let request = PriceValidationRequest {
//             items: vec![item1, item2],
//         };

//         assert_eq!(request.items.len(), 2);
//         assert_eq!(request.items[0].quantity, 2);
//         assert_eq!(request.items[0].expected_unit_price_cents, 2500);
//         assert_eq!(request.items[1].quantity, 1);
//         assert_eq!(request.items[1].expected_unit_price_cents, 1000);
//     }

//     #[test]
//     fn test_decimal_to_cents_conversion() {
//         // Test the conversion logic that would be used in the service
//         let price = Decimal::from(25); // €25.00
//         let cents = (price * Decimal::from(100)).round();

//         use rust_decimal::prelude::ToPrimitive;
//         let cents_i32 = cents.to_i32().unwrap_or(0);

//         assert_eq!(cents_i32, 2500);
//     }

//     #[test]
//     fn test_decimal_to_cents_conversion_with_fractional() {
//         // Test with fractional euros
//         let price = Decimal::new(2567, 2); // €25.67
//         let cents = (price * Decimal::from(100)).round();

//         use rust_decimal::prelude::ToPrimitive;
//         let cents_i32 = cents.to_i32().unwrap_or(0);

//         assert_eq!(cents_i32, 2567);
//     }

//     #[test]
//     fn test_promotion_discount_calculation_edge_cases() {
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::new(3333, 2), // 33.33%
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(1),
//             created_at: Utc::now(),
//             updated_at: Utc::now(),
//         };

//         let subtotal = Decimal::new(9999, 2); // €99.99
//         let tax = Decimal::new(2100, 2); // €21.00
//         let discount_amount = promotion.calculate_discount_amount(subtotal);
//         let discounted_price = promotion.calculate_discounted_price(subtotal, tax);

//         // 33.33% of €99.99 ≈ €33.33
//         let expected_discount = Decimal::new(3332, 2); // More precise calculation
//         assert!(discount_amount >= expected_discount);
//         assert!(discount_amount < Decimal::new(3334, 2));

//         // Discounted price should be (99.99 - discount) + 21.00
//         let expected_min = Decimal::new(8765, 2);
//         let expected_max = Decimal::new(8768, 2);
//         assert!(discounted_price >= expected_min);
//         assert!(discounted_price <= expected_max);
//     }

//     #[test]
//     fn test_100_percent_discount() {
//         let promotion = DiscountPromotion {
//             id: Uuid::new_v4(),
//             product_ids: vec![Uuid::new_v4()],
//             discount_percentage: Decimal::from(100), // 100% off
//             start_date: Utc::now(),
//             end_date: Utc::now() + chrono::Duration::days(1),
//             created_at: Utc::now(),
//             updated_at: Utc::now(),
//         };

//         let subtotal = Decimal::from(50); // €50.00
//         let tax = Decimal::from(10); // €10.00
//         let discount_amount = promotion.calculate_discount_amount(subtotal);
//         let discounted_price = promotion.calculate_discounted_price(subtotal, tax);

//         // 100% discount means full subtotal is discounted
//         assert_eq!(discount_amount, subtotal);
//         // Final price should be just the tax
//         assert_eq!(discounted_price, tax);
//     }
// }
