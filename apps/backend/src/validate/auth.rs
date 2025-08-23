use regex::Regex;

/// Validate email format
pub fn validate_email(email: &str) -> Result<(), String> {
    if email.is_empty() {
        return Err("Email is required".to_string());
    }

    if email.len() > 254 {
        return Err("Email is too long".to_string());
    }

    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
        .map_err(|_| "Invalid email regex".to_string())?;

    if !email_regex.is_match(email) {
        return Err("Invalid email format".to_string());
    }

    Ok(())
}

/// Validate password strength
pub fn validate_password(password: &str) -> Result<(), String> {
    if password.is_empty() {
        return Err("Password is required".to_string());
    }

    if password.len() < 8 {
        return Err("Password must be at least 8 characters long".to_string());
    }

    if password.len() > 128 {
        return Err("Password is too long (max 128 characters)".to_string());
    }

    // Check for at least one uppercase letter
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err("Password must contain at least one uppercase letter".to_string());
    }

    // Check for at least one lowercase letter
    if !password.chars().any(|c| c.is_lowercase()) {
        return Err("Password must contain at least one lowercase letter".to_string());
    }

    // Check for at least one digit
    if !password.chars().any(|c| c.is_ascii_digit()) {
        return Err("Password must contain at least one number".to_string());
    }

    // Check for at least one special character
    let special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if !password.chars().any(|c| special_chars.contains(c)) {
        return Err(
            "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
                .to_string(),
        );
    }

    Ok(())
}

/// Validate user role
pub fn validate_role(role: &str) -> Result<(), String> {
    match role {
        "user" | "admin" => Ok(()),
        _ => Err("Invalid role. Must be 'user' or 'admin'".to_string()),
    }
}
