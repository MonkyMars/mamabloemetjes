use std::env;

pub fn pool() -> sqlx::PgPool {
    let database_url = env::var("POSTGRES_URL").expect("POSTGRES_URL must be set");
    sqlx::PgPool::connect_lazy(&database_url).expect("Failed to create pool")
}
