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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_email_valid() {
        assert!(validate_email("test@example.com").is_ok());
        assert!(validate_email("user.name+tag@domain.co.uk").is_ok());
        assert!(validate_email("test123@test-domain.org").is_ok());
    }

    #[test]
    fn test_validate_email_invalid() {
        assert!(validate_email("").is_err());
        assert!(validate_email("invalid-email").is_err());
        assert!(validate_email("@domain.com").is_err());
        assert!(validate_email("user@").is_err());
        assert!(validate_email("user@domain").is_err());
    }

    #[test]
    fn test_validate_password_valid() {
        assert!(validate_password("StrongP@ss123").is_ok());
        assert!(validate_password("MySecure!Pass1").is_ok());
        assert!(validate_password("Complex#123Pwd").is_ok());
    }

    #[test]
    fn test_validate_password_invalid() {
        assert!(validate_password("").is_err()); // Empty
        assert!(validate_password("short").is_err()); // Too short
        assert!(validate_password("alllowercase123!").is_err()); // No uppercase
        assert!(validate_password("ALLUPPERCASE123!").is_err()); // No lowercase
        assert!(validate_password("NoNumbers!").is_err()); // No numbers
        assert!(validate_password("NoSpecialChars123").is_err()); // No special chars
    }

    #[test]
    fn test_validate_role() {
        assert!(validate_role("user").is_ok());
        assert!(validate_role("admin").is_ok());
        assert!(validate_role("invalid").is_err());
        assert!(validate_role("").is_err());
    }
}
