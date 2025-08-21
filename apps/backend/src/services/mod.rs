pub mod inventory_service;
pub mod pricing_service;
pub mod product_service;

pub use inventory_service::{InventoryService, InventoryStatus, LowStockProduct};
pub use pricing_service::{PricingResult, PricingService, ProductDiscountInfo};
pub use product_service::{ProductPriceInfo, ProductService};
