use std::fs;

use crate::error::AppError;

#[tauri::command]
pub fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path)
        .map_err(AppError::from)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content)
        .map_err(AppError::from)
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_write_file() {
        let tmp = std::env::temp_dir().join("oxidizetext_test_file.txt");
        let path = tmp.to_str().unwrap();
        let content = r#"{"test": "hello world"}"#;

        write_file(path, content).unwrap();
        let read = read_file(path).unwrap();
        assert_eq!(read, content);

        // Cleanup
        let _ = std::fs::remove_file(tmp);
    }

    #[test]
    fn test_read_nonexistent_file() {
        let result = read_file("/nonexistent/path/to/file.json");
        assert!(result.is_err());
    }
}
