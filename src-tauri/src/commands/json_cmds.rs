use serde_json::Value;

#[tauri::command]
pub fn format_json(input: &str) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    serde_json::to_string_pretty(&parsed).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn minify_json(input: &str) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    serde_json::to_string(&parsed).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn validate_json(input: &str) -> Result<bool, String> {
    serde_json::from_str::<Value>(input)
        .map(|_| true)
        .map_err(|e| e.to_string())
}
