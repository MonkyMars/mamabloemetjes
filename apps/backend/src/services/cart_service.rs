use crate::pool::connect::pool;
use crate::response::{AppResponse, error::AppError};
use crate::structs::cart::{
    AddCartItemRequest, Cart, CartItem, CartItemWithProduct, CartResponse, GuestCartItem,
};
use crate::structs::product::Product;
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use uuid::Uuid;

pub struct CartService;

impl CartService {
    /// Get or create a cart for the authenticated user
    pub async fn get_or_create_user_cart(user_id: Uuid) -> AppResponse<Cart> {
        // Try to get existing cart first
        match Self::get_cart_by_user_id(user_id).await {
            AppResponse::Success(cart) => AppResponse::Success(cart),
            AppResponse::Error(_) => {
                // Create new cart if none exists
                Self::create_cart_for_user(user_id).await
            }
        }
    }

    /// Get cart by user ID
    pub async fn get_cart_by_user_id(user_id: Uuid) -> AppResponse<Cart> {
        let pool = pool();

        match sqlx::query_as::<_, Cart>(
            "SELECT id, user_id, currency, created_at, updated_at, metadata
             FROM carts WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        {
            Ok(cart) => AppResponse::Success(cart),
            Err(sqlx::Error::RowNotFound) => {
                AppResponse::Error(AppError::NotFound("Cart not found".to_string()))
            }
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to fetch cart: {}",
                e
            ))),
        }
    }

    /// Create a new cart for a user
    pub async fn create_cart_for_user(user_id: Uuid) -> AppResponse<Cart> {
        let pool = pool();

        match sqlx::query_as::<_, Cart>(
            "INSERT INTO carts (user_id, currency)
             VALUES ($1, 'EUR')
             RETURNING id, user_id, currency, created_at, updated_at, metadata",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        {
            Ok(cart) => AppResponse::Success(cart),
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to create cart: {}",
                e
            ))),
        }
    }

    /// Get cart with items and product details
    pub async fn get_cart_with_items(user_id: Uuid) -> AppResponse<CartResponse> {
        let cart = match Self::get_or_create_user_cart(user_id).await {
            AppResponse::Success(cart) => cart,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        let pool = pool();

        match sqlx::query_as::<_, CartItemWithProduct>(
            "SELECT
                ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.unit_price_cents,
                ci.unit_tax_cents, ci.unit_subtotal_cents,
                ci.created_at, ci.updated_at, ci.metadata,
                p.name as product_name, p.sku as product_sku
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = $1
             ORDER BY ci.created_at ASC",
        )
        .bind(cart.id)
        .fetch_all(pool)
        .await
        {
            Ok(items) => AppResponse::Success(CartResponse::new(cart, items)),
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to fetch cart items: {}",
                e
            ))),
        }
    }

    /// Add item to cart or update quantity if already exists
    pub async fn add_item_to_cart(
        user_id: Uuid,
        request: AddCartItemRequest,
    ) -> AppResponse<CartItemWithProduct> {
        let pool = pool();

        // Get or create cart
        let cart = match Self::get_or_create_user_cart(user_id).await {
            AppResponse::Success(cart) => cart,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        // Get product and validate stock
        let product = match Self::get_product_by_id(request.product_id).await {
            AppResponse::Success(product) => product,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        // Validate stock availability
        if product.stock < Decimal::from(request.quantity) {
            return AppResponse::Error(AppError::ValidationError(format!(
                "Insufficient stock. Available: {}, requested: {}",
                product.stock, request.quantity
            )));
        }

        // Calculate unit prices in cents
        let unit_price_cents = (product.price * Decimal::from(100))
            .round()
            .to_i32()
            .unwrap_or(0);
        let unit_tax_cents = (product.tax * Decimal::from(100))
            .round()
            .to_i32()
            .unwrap_or(0);
        let unit_subtotal_cents = (product.subtotal * Decimal::from(100))
            .round()
            .to_i32()
            .unwrap_or(0);

        // Check if item already exists in cart
        let existing_item = sqlx::query_as::<_, CartItem>(
            "SELECT id, cart_id, product_id, quantity, unit_price_cents, unit_tax_cents, unit_subtotal_cents, created_at, updated_at, metadata
             FROM cart_items WHERE cart_id = $1 AND product_id = $2",
        )
        .bind(cart.id)
        .bind(request.product_id)
        .fetch_optional(pool)
        .await;

        match existing_item {
            Ok(Some(item)) => {
                // Update existing item quantity
                let new_quantity = item.quantity + request.quantity;

                // Validate total quantity against stock
                if product.stock < Decimal::from(new_quantity) {
                    return AppResponse::Error(AppError::ValidationError(format!(
                        "Insufficient stock. Available: {}, total requested: {}",
                        product.stock, new_quantity
                    )));
                }

                Self::update_cart_item_quantity(item.id, new_quantity).await
            }
            Ok(_) => {
                // Create new cart item
                match sqlx::query_as::<_, CartItem>(
                    "INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents, unit_tax_cents, unit_subtotal_cents)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id, cart_id, product_id, quantity, unit_price_cents, unit_tax_cents, unit_subtotal_cents, created_at, updated_at, metadata",
                )
                .bind(cart.id)
                .bind(request.product_id)
                .bind(request.quantity)
                .bind(unit_price_cents)
                .bind(unit_tax_cents)
                .bind(unit_subtotal_cents)
                .fetch_one(pool)
                .await
                {
                    Ok(cart_item) => {
                        AppResponse::Success(CartItemWithProduct {
                            id: cart_item.id,
                            cart_id: cart_item.cart_id,
                            product_id: cart_item.product_id,
                            quantity: cart_item.quantity,
                            unit_price_cents: cart_item.unit_price_cents,
                            unit_tax_cents: cart_item.unit_tax_cents,
                            unit_subtotal_cents: cart_item.unit_subtotal_cents,
                            created_at: cart_item.created_at,
                            updated_at: cart_item.updated_at,
                            metadata: cart_item.metadata,
                            product_name: product.name,
                            product_sku: product.sku,
                        })
                    }
                    Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                        "Failed to create cart item: {}",
                        e
                    ))),
                }
            }
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to check existing cart item: {}",
                e
            ))),
        }
    }

    /// Update cart item quantity
    pub async fn update_cart_item_quantity(
        item_id: Uuid,
        quantity: i32,
    ) -> AppResponse<CartItemWithProduct> {
        let pool = pool();

        // Get the cart item with product info
        let item_with_product = match sqlx::query_as::<_, CartItemWithProduct>(
            "SELECT
                ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.unit_price_cents,
                ci.unit_tax_cents, ci.unit_subtotal_cents,
                ci.created_at, ci.updated_at, ci.metadata,
                p.name as product_name, p.sku as product_sku
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.id = $1",
        )
        .bind(item_id)
        .fetch_one(pool)
        .await
        {
            Ok(item) => item,
            Err(sqlx::Error::RowNotFound) => {
                return AppResponse::Error(AppError::NotFound("Cart item not found".to_string()));
            }
            Err(e) => {
                return AppResponse::Error(AppError::DatabaseError(format!(
                    "Failed to fetch cart item: {}",
                    e
                )));
            }
        };

        // Validate stock
        let product = match Self::get_product_by_id(item_with_product.product_id).await {
            AppResponse::Success(product) => product,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        if product.stock < Decimal::from(quantity) {
            return AppResponse::Error(AppError::ValidationError(format!(
                "Insufficient stock. Available: {}, requested: {}",
                product.stock, quantity
            )));
        }

        // Update quantity
        match sqlx::query("UPDATE cart_items SET quantity = $1 WHERE id = $2")
            .bind(quantity)
            .bind(item_id)
            .execute(pool)
            .await
        {
            Ok(_) => AppResponse::Success(CartItemWithProduct {
                quantity,
                ..item_with_product
            }),
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to update cart item: {}",
                e
            ))),
        }
    }

    /// Remove item from cart
    pub async fn remove_cart_item(item_id: Uuid) -> AppResponse<()> {
        let pool = pool();

        match sqlx::query("DELETE FROM cart_items WHERE id = $1")
            .bind(item_id)
            .execute(pool)
            .await
        {
            Ok(result) => {
                if result.rows_affected() == 0 {
                    AppResponse::Error(AppError::NotFound("Cart item not found".to_string()))
                } else {
                    AppResponse::Success(())
                }
            }
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to remove cart item: {}",
                e
            ))),
        }
    }

    /// Clear all items from cart
    pub async fn clear_cart(user_id: Uuid) -> AppResponse<()> {
        let cart = match Self::get_cart_by_user_id(user_id).await {
            AppResponse::Success(cart) => cart,
            AppResponse::Error(_) => return AppResponse::Success(()), // No cart to clear
        };

        let pool = pool();

        match sqlx::query("DELETE FROM cart_items WHERE cart_id = $1")
            .bind(cart.id)
            .execute(pool)
            .await
        {
            Ok(_) => AppResponse::Success(()),
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to clear cart: {}",
                e
            ))),
        }
    }

    /// Merge guest cart items into user's cart
    pub async fn merge_guest_cart(
        user_id: Uuid,
        guest_items: Vec<GuestCartItem>,
    ) -> AppResponse<CartResponse> {
        let pool = pool();

        // Get or create user cart
        let cart = match Self::get_or_create_user_cart(user_id).await {
            AppResponse::Success(cart) => cart,
            AppResponse::Error(e) => return AppResponse::Error(e),
        };

        // Process each guest cart item
        for guest_item in guest_items {
            // Get product to validate and get current price
            let product = match Self::get_product_by_id(guest_item.product_id).await {
                AppResponse::Success(product) => product,
                AppResponse::Error(_) => continue, // Skip invalid products
            };

            // Calculate unit prices in cents (use backend prices, not client prices)
            let unit_price_cents = (product.price * Decimal::from(100))
                .round()
                .to_i32()
                .unwrap_or(0);
            let unit_tax_cents = (product.tax * Decimal::from(100))
                .round()
                .to_i32()
                .unwrap_or(0);
            let unit_subtotal_cents = (product.subtotal * Decimal::from(100))
                .round()
                .to_i32()
                .unwrap_or(0);

            // Check if item already exists in user's cart
            let existing_quantity = sqlx::query_scalar::<_, i32>(
                "SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
            )
            .bind(cart.id)
            .bind(guest_item.product_id)
            .fetch_optional(pool)
            .await
            .unwrap_or(Some(0))
            .unwrap_or(0);

            let total_quantity = existing_quantity + guest_item.quantity;

            // Cap at product stock
            let final_quantity =
                std::cmp::min(total_quantity, product.stock.round().to_i32().unwrap_or(0));

            if final_quantity <= 0 {
                continue;
            }

            // Insert or update cart item
            if existing_quantity > 0 {
                // Update existing item
                let _ = sqlx::query(
                    "UPDATE cart_items SET quantity = $1, unit_price_cents = $2, unit_tax_cents = $3, unit_subtotal_cents = $4, updated_at = now()
                     WHERE cart_id = $5 AND product_id = $6",
                )
                .bind(final_quantity)
                .bind(unit_price_cents)
                .bind(unit_tax_cents)
                .bind(unit_subtotal_cents)
                .bind(cart.id)
                .bind(guest_item.product_id)
                .execute(pool)
                .await;
            } else {
                // Insert new item
                let _ = sqlx::query(
                    "INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents, unit_tax_cents, unit_subtotal_cents)
                     VALUES ($1, $2, $3, $4, $5, $6)",
                )
                .bind(cart.id)
                .bind(guest_item.product_id)
                .bind(final_quantity)
                .bind(unit_price_cents)
                .bind(unit_tax_cents)
                .bind(unit_subtotal_cents)
                .execute(pool)
                .await;
            }
        }

        // Return updated cart
        Self::get_cart_with_items(user_id).await
    }

    /// Helper: Get product by ID
    async fn get_product_by_id(product_id: Uuid) -> AppResponse<Product> {
        match crate::actions::get::get_product_by_id(product_id).await {
            Ok(Some(product)) => AppResponse::Success(product),
            Ok(_) => AppResponse::Error(AppError::NotFound(format!(
                "Product with ID {} not found",
                product_id
            ))),
            Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
                "Failed to fetch product: {}",
                e
            ))),
        }
    }
}
