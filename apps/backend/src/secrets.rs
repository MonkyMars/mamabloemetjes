use shuttle_runtime::SecretStore;
use std::sync::OnceLock;

static SECRETS: OnceLock<SecretStore> = OnceLock::new();

pub fn initialize_secrets(secrets: SecretStore) {
    if SECRETS.set(secrets).is_err() {
        panic!("Secrets should only be set once");
    }
}

pub fn get_secret(key: &str) -> Option<String> {
    SECRETS.get()?.get(key)
}

pub fn get_jwt_secret() -> Result<String, String> {
    get_secret("JWT_SECRET").ok_or_else(|| "JWT_SECRET not found in secrets".to_string())
}

pub fn get_access_token_expiry() -> i64 {
    get_secret("ACCESS_TOKEN_EXPIRY")
        .and_then(|s| s.parse().ok())
        .unwrap_or(3600) // 1 hour default
}

pub fn get_refresh_token_expiry() -> i64 {
    get_secret("REFRESH_TOKEN_EXPIRY")
        .and_then(|s| s.parse().ok())
        .unwrap_or(86400) // 24 hours default
}
