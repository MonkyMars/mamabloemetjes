use once_cell::sync::Lazy;
use regex::Regex;
use std::collections::HashMap;
use thiserror::Error;
use validator::ValidationError;

#[derive(Error, Debug)]
pub enum AddressValidationError {
    #[error("Invalid postal code: {0}. Must be in format 1234AB")]
    InvalidPostalCode(String),
    #[error("Invalid province: {0}. Must be one of the 12 Dutch provinces")]
    InvalidProvince(String),
    #[error("Street name cannot be empty")]
    EmptyStreet,
    #[error("Street name is too long (max 200 characters)")]
    StreetTooLong,
    #[error("House number cannot be empty")]
    EmptyHouseNumber,
    #[error("House number is too long (max 20 characters)")]
    HouseNumberTooLong,
    #[error("Invalid house number format: {0}")]
    InvalidHouseNumberFormat(String),
    #[error("City name cannot be empty")]
    EmptyCity,
    #[error("City name is too long (max 100 characters)")]
    CityTooLong,
    #[error("Invalid city name: {0}. Contains invalid characters")]
    InvalidCityFormat(String),
    #[error("Postal code {0} does not match city {1}")]
    PostalCodeCityMismatch(String, String),
}

// Dutch postal code regex: 4 digits (not starting with 0) followed by 2 letters
static POSTAL_CODE_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[1-9][0-9]{3}[A-Za-z]{2}$").unwrap());

// House number regex: starts with non-zero digit, may have letters or hyphenated suffix
static HOUSE_NUMBER_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[1-9][0-9]*(?:[a-zA-Z]|-[0-9]+[a-zA-Z]?)?$").unwrap());

// City name regex: letters, spaces, hyphens, apostrophes
static CITY_NAME_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[a-zA-ZÀ-ÿ\s\-'\.]+$").unwrap());

// Dutch provinces with their common abbreviations
static DUTCH_PROVINCES: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    [
        ("Noord-Holland", "NH"),
        ("Zuid-Holland", "ZH"),
        ("Noord-Brabant", "NB"),
        ("Gelderland", "GLD"),
        ("Utrecht", "UT"),
        ("Overijssel", "OV"),
        ("Limburg", "LB"),
        ("Friesland", "FR"),
        ("Groningen", "GR"),
        ("Drenthe", "DR"),
        ("Flevoland", "FL"),
        ("Zeeland", "ZL"),
    ]
    .iter()
    .cloned()
    .collect()
});

// Postal code ranges for each province (first 2 digits)
static PROVINCE_POSTAL_RANGES: Lazy<HashMap<&'static str, Vec<(u32, u32)>>> = Lazy::new(|| {
    [
        ("Noord-Holland", vec![(10, 19), (20, 21)]),
        ("Zuid-Holland", vec![(22, 34), (36, 39)]),
        ("Utrecht", vec![(35, 35), (39, 39)]),
        ("Noord-Brabant", vec![(47, 59)]),
        ("Gelderland", vec![(65, 73), (38, 38)]),
        ("Overijssel", vec![(74, 83)]),
        ("Limburg", vec![(59, 64)]),
        ("Friesland", vec![(84, 94)]),
        ("Groningen", vec![(95, 99)]),
        ("Drenthe", vec![(76, 79), (94, 95)]),
        ("Flevoland", vec![(12, 13), (80, 83)]),
        ("Zeeland", vec![(43, 46)]),
    ]
    .iter()
    .cloned()
    .collect()
});

/// Comprehensive address validation
pub struct AddressValidator;

impl AddressValidator {
    /// Validate complete Dutch address
    pub fn validate_dutch_address(
        street: &str,
        house_number: &str,
        postal_code: &str,
        city: &str,
        province: &str,
    ) -> Result<(), AddressValidationError> {
        Self::validate_street(street)?;
        Self::validate_house_number(house_number)?;
        Self::validate_postal_code(postal_code)?;
        Self::validate_city(city)?;
        Self::validate_province(province)?;
        Self::validate_postal_code_province_match(postal_code, province)?;

        Ok(())
    }

    /// Validate street name
    pub fn validate_street(street: &str) -> Result<(), AddressValidationError> {
        let trimmed = street.trim();

        if trimmed.is_empty() {
            return Err(AddressValidationError::EmptyStreet);
        }

        if trimmed.len() > 200 {
            return Err(AddressValidationError::StreetTooLong);
        }

        Ok(())
    }

    /// Validate house number
    pub fn validate_house_number(house_number: &str) -> Result<(), AddressValidationError> {
        let trimmed = house_number.trim();

        if trimmed.is_empty() {
            return Err(AddressValidationError::EmptyHouseNumber);
        }

        if trimmed.len() > 20 {
            return Err(AddressValidationError::HouseNumberTooLong);
        }

        if !HOUSE_NUMBER_REGEX.is_match(trimmed) {
            return Err(AddressValidationError::InvalidHouseNumberFormat(
                house_number.to_string(),
            ));
        }

        Ok(())
    }

    /// Validate Dutch postal code
    pub fn validate_postal_code(postal_code: &str) -> Result<(), AddressValidationError> {
        if !POSTAL_CODE_REGEX.is_match(postal_code) {
            return Err(AddressValidationError::InvalidPostalCode(
                postal_code.to_string(),
            ));
        }
        Ok(())
    }

    /// Validate city name
    pub fn validate_city(city: &str) -> Result<(), AddressValidationError> {
        let trimmed = city.trim();

        if trimmed.is_empty() {
            return Err(AddressValidationError::EmptyCity);
        }

        if trimmed.len() > 100 {
            return Err(AddressValidationError::CityTooLong);
        }

        if !CITY_NAME_REGEX.is_match(trimmed) {
            return Err(AddressValidationError::InvalidCityFormat(city.to_string()));
        }

        Ok(())
    }

    /// Validate Dutch province
    pub fn validate_province(province: &str) -> Result<(), AddressValidationError> {
        if !DUTCH_PROVINCES.contains_key(province) {
            return Err(AddressValidationError::InvalidProvince(
                province.to_string(),
            ));
        }
        Ok(())
    }

    /// Validate that postal code matches the province
    pub fn validate_postal_code_province_match(
        postal_code: &str,
        province: &str,
    ) -> Result<(), AddressValidationError> {
        if postal_code.len() < 4 {
            return Err(AddressValidationError::InvalidPostalCode(
                postal_code.to_string(),
            ));
        }

        let postal_prefix: u32 = match postal_code[..2].parse() {
            Ok(prefix) => prefix,
            Err(_) => {
                return Err(AddressValidationError::InvalidPostalCode(
                    postal_code.to_string(),
                ));
            }
        };

        if let Some(ranges) = PROVINCE_POSTAL_RANGES.get(province) {
            let matches = ranges
                .iter()
                .any(|(start, end)| postal_prefix >= *start && postal_prefix <= *end);

            if !matches {
                return Err(AddressValidationError::PostalCodeCityMismatch(
                    postal_code.to_string(),
                    province.to_string(),
                ));
            }
        } else {
            return Err(AddressValidationError::InvalidProvince(
                province.to_string(),
            ));
        }

        Ok(())
    }

    /// Normalize postal code to standard format (uppercase letters)
    pub fn normalize_postal_code(postal_code: &str) -> String {
        if postal_code.len() >= 6 {
            let (digits, letters) = postal_code.split_at(4);
            format!("{}{}", digits, letters.to_uppercase())
        } else {
            postal_code.to_uppercase()
        }
    }

    /// Get province from postal code
    pub fn get_province_from_postal_code(postal_code: &str) -> Option<&'static str> {
        if postal_code.len() < 4 {
            return None;
        }

        let postal_prefix: u32 = postal_code[..2].parse().ok()?;

        for (province, ranges) in PROVINCE_POSTAL_RANGES.iter() {
            for (start, end) in ranges {
                if postal_prefix >= *start && postal_prefix <= *end {
                    return Some(province);
                }
            }
        }

        None
    }

    /// Check if postal code format is valid
    pub fn is_valid_postal_code_format(postal_code: &str) -> bool {
        POSTAL_CODE_REGEX.is_match(postal_code)
    }

    /// Check if province name is valid
    pub fn is_valid_province(province: &str) -> bool {
        DUTCH_PROVINCES.contains_key(province)
    }

    /// Get all valid Dutch provinces
    pub fn get_valid_provinces() -> Vec<&'static str> {
        DUTCH_PROVINCES.keys().cloned().collect()
    }

    /// Get province abbreviation
    pub fn get_province_abbreviation(province: &str) -> Option<&'static str> {
        DUTCH_PROVINCES.get(province).copied()
    }
}

// Validator functions for use with the validator crate
pub fn validate_dutch_postal_code(postal_code: &str) -> Result<(), ValidationError> {
    if !AddressValidator::is_valid_postal_code_format(postal_code) {
        return Err(ValidationError::new("invalid_dutch_postal_code"));
    }
    Ok(())
}

pub fn validate_dutch_province(province: &str) -> Result<(), ValidationError> {
    if !AddressValidator::is_valid_province(province) {
        return Err(ValidationError::new("invalid_dutch_province"));
    }
    Ok(())
}

pub fn validate_dutch_house_number(house_number: &str) -> Result<(), ValidationError> {
    match AddressValidator::validate_house_number(house_number) {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new("invalid_dutch_house_number")),
    }
}

pub fn validate_dutch_city_name(city: &str) -> Result<(), ValidationError> {
    match AddressValidator::validate_city(city) {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new("invalid_dutch_city_name")),
    }
}
