use shuttle_runtime::SecretStore;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions};
use std::{str::FromStr, sync::OnceLock, time::Duration};

static POOL: OnceLock<PgPool> = OnceLock::new();

pub fn initialize_pool_with_secrets(secrets: SecretStore) {
    let database_url = secrets
        .get("POSTGRES_URL")
        .expect("POSTGRES_URL must be set in secrets");

    let connect_options = PgConnectOptions::from_str(&database_url)
        .expect("Failed to parse database URL")
        .application_name("mamabloemetjes-backend")
        .statement_cache_capacity(100);

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(300))
        .max_lifetime(Duration::from_secs(1800))
        .test_before_acquire(false)
        .connect_lazy_with(connect_options);

    POOL.set(pool).expect("Pool should only be set once");
}

pub fn pool() -> &'static PgPool {
    POOL.get().expect("Pool should be initialized before use")
}
