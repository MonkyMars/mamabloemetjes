use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;

pub fn pool() -> sqlx::PgPool {
    let database_url = env::var("POSTGRES_URL").expect("POSTGRES_URL must be set");

    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect_lazy(&database_url)
        .expect("Failed to create pool")
}
