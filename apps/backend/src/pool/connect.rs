use once_cell::sync::Lazy;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions};
use std::{env, str::FromStr, time::Duration};

pub static POOL: Lazy<PgPool> = Lazy::new(|| {
    let database_url = env::var("POSTGRES_URL").expect("POSTGRES_URL must be set");

    let connect_options = PgConnectOptions::from_str(&database_url)
        .expect("Failed to parse database URL")
        .application_name("mamabloemetjes-backend")
        .statement_cache_capacity(0);

    PgPoolOptions::new()
        .max_connections(1)
        .min_connections(0)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(1))
        .max_lifetime(Duration::from_secs(5))
        .test_before_acquire(false)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                sqlx::query("DEALLOCATE ALL").execute(conn).await.ok();
                Ok(())
            })
        })
        .connect_lazy_with(connect_options)
});

pub fn pool() -> &'static PgPool {
    &POOL
}
