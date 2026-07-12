use serde_json::Value;

use crate::error::AppError;

#[tauri::command]
pub fn format_json(input: &str) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(input).map_err(AppError::from)?;
    serde_json::to_string_pretty(&parsed)
        .map_err(AppError::from)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn minify_json(input: &str) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(input).map_err(AppError::from)?;
    serde_json::to_string(&parsed)
        .map_err(AppError::from)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn validate_json(input: &str) -> Result<bool, String> {
    serde_json::from_str::<Value>(input)
        .map(|_| true)
        .map_err(AppError::from)
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_json_pretty_print() {
        let input = r#"{"a":1,"b":"hello","c":[1,2,3]}"#;
        let result = format_json(input).unwrap();
        assert!(result.contains("\n")); // pretty-printed output has newlines
        assert!(result.contains(r#""a": 1"#));
    }

    #[test]
    fn test_format_json_invalid_input() {
        let result = format_json("not json");
        assert!(result.is_err());
    }

    #[test]
    fn test_minify_json_compact() {
        let input = "{\n  \"a\": 1,\n  \"b\": \"hello\"\n}";
        let result = minify_json(input).unwrap();
        assert!(!result.contains("\n")); // no newlines in compact output
        assert!(result.contains(r#""a":1"#));
    }

    #[test]
    fn test_validate_json_valid() {
        assert!(validate_json(r#"{"valid": true}"#).unwrap());
    }

    #[test]
    fn test_validate_json_invalid() {
        assert!(validate_json("{invalid").is_err());
    }

    #[test]
    fn test_validate_json_empty() {
        assert!(validate_json("").is_err());
    }
}
