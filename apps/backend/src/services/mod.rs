pub mod auth;
pub mod cart_service;
pub mod inventory_service;
pub mod pricing_service;
pub mod product_service;
pub mod search;

pub use auth::AuthService;
pub use cart_service::CartService;
pub use inventory_service::{InventoryService, InventoryStatus, LowStockProduct};
pub use pricing_service::{PricingResult, PricingService, ProductDiscountInfo};
pub use product_service::{ProductPriceInfo, ProductService};
pub use search::{
    ProductSearchService, SearchAnalyticsService, SearchService, SearchSuggestionsService,
};
