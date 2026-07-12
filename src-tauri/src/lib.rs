mod commands;
mod models;

use commands::json_cmds::{format_json, minify_json, validate_json};
use commands::tree_cmds::json_to_tree;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            format_json,
            minify_json,
            validate_json,
            json_to_tree,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
