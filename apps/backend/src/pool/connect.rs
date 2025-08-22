use once_cell::sync::Lazy;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions};
use std::{env, str::FromStr, time::Duration};

pub static POOL: Lazy<PgPool> = Lazy::new(|| {
    let database_url = env::var("POSTGRES_URL").expect("POSTGRES_URL must be set");

    let connect_options = PgConnectOptions::from_str(&database_url)
        .expect("Failed to parse database URL")
        .application_name("mamabloemetjes-backend")
        .statement_cache_capacity(100);

    PgPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(300))
        .max_lifetime(Duration::from_secs(1800))
        .test_before_acquire(false)
        .connect_lazy_with(connect_options)
});

pub fn pool() -> &'static PgPool {
    &POOL
}
