use lazy_static::lazy_static;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions};
use std::env;
use std::str::FromStr;

lazy_static! {
    static ref POOL: PgPool = {
        let database_url = env::var("POSTGRES_URL").expect("POSTGRES_URL must be set");

        // Parse the connection URL and remove unrecognized parameters
        let connect_options = PgConnectOptions::from_str(&database_url)
            .expect("Failed to parse database URL")
            .application_name("mamabloemetjes-backend")
            .statement_cache_capacity(0); // Disable statement caching completely

        PgPoolOptions::new()
            .max_connections(1) // Single connection to prevent conflicts
            .min_connections(0) // Allow complete connection closure
            .acquire_timeout(std::time::Duration::from_secs(30))
            .idle_timeout(std::time::Duration::from_secs(1)) // Close idle connections immediately
            .max_lifetime(std::time::Duration::from_secs(5)) // Force new connection every 5 seconds
            .test_before_acquire(false) // Skip connection testing
            .after_connect(|conn, _meta| Box::pin(async move {
                // Clear any existing prepared statements immediately
                sqlx::query("DEALLOCATE ALL").execute(conn).await.ok();
                Ok(())
            }))
            .connect_lazy_with(connect_options)
    };
}

pub fn pool() -> &'static PgPool {
    &POOL
}
