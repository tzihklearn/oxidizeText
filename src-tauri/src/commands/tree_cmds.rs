use serde_json::Value;
use uuid::Uuid;

use crate::models::tree_node::JsonTreeNode;

const MAX_DEPTH: usize = 100;

#[tauri::command]
pub async fn json_to_tree(input: &str) -> Result<Vec<JsonTreeNode>, String> {
    let value: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;

    let result = tauri::async_runtime::spawn_blocking(move || build_tree("root", &value, "$", 0))
        .await
        .map_err(|e| format!("Task failed: {}", e))?;

    Ok(result)
}

pub fn build_tree(key: &str, value: &Value, path: &str, depth: usize) -> Vec<JsonTreeNode> {
    if depth > MAX_DEPTH {
        let preview = match value {
            Value::Object(_) => "{...}".to_string(),
            Value::Array(_) => "[...]".to_string(),
            _ => value.to_string(),
        };
        return vec![JsonTreeNode {
            id: Uuid::new_v4().to_string(),
            key: key.to_string(),
            path: path.to_string(),
            type_label: "max_depth".to_string(),
            preview,
            children: None,
        }];
    }

    match value {
        Value::Object(map) => {
            let type_label = format!("object ({})", map.len());
            let children: Vec<JsonTreeNode> = map
                .iter()
                .flat_map(|(k, v)| {
                    let child_path = format!("{}.{}", path, k);
                    build_tree(k, v, &child_path, depth + 1)
                })
                .collect();

            vec![JsonTreeNode {
                id: Uuid::new_v4().to_string(),
                key: key.to_string(),
                path: path.to_string(),
                type_label,
                preview: String::new(),
                children: Some(children),
            }]
        }
        Value::Array(arr) => {
            let type_label = format!("array [{}]", arr.len());
            let children: Vec<JsonTreeNode> = arr
                .iter()
                .enumerate()
                .flat_map(|(i, v)| {
                    let child_path = format!("{}[{}]", path, i);
                    let child_key = format!("[{}]", i);
                    build_tree(&child_key, v, &child_path, depth + 1)
                })
                .collect();

            vec![JsonTreeNode {
                id: Uuid::new_v4().to_string(),
                key: key.to_string(),
                path: path.to_string(),
                type_label,
                preview: String::new(),
                children: Some(children),
            }]
        }
        Value::String(s) => {
            let preview = if s.len() > 50 {
                format!("{}...", &s[..50])
            } else {
                s.clone()
            };
            vec![JsonTreeNode {
                id: Uuid::new_v4().to_string(),
                key: key.to_string(),
                path: path.to_string(),
                type_label: "string".to_string(),
                preview,
                children: None,
            }]
        }
        Value::Number(n) => vec![JsonTreeNode {
            id: Uuid::new_v4().to_string(),
            key: key.to_string(),
            path: path.to_string(),
            type_label: "number".to_string(),
            preview: n.to_string(),
            children: None,
        }],
        Value::Bool(b) => vec![JsonTreeNode {
            id: Uuid::new_v4().to_string(),
            key: key.to_string(),
            path: path.to_string(),
            type_label: "boolean".to_string(),
            preview: b.to_string(),
            children: None,
        }],
        Value::Null => vec![JsonTreeNode {
            id: Uuid::new_v4().to_string(),
            key: key.to_string(),
            path: path.to_string(),
            type_label: "null".to_string(),
            preview: "null".to_string(),
            children: None,
        }],
    }
}
