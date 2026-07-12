use serde_json::Value;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::tree_node::JsonTreeNode;

const MAX_DEPTH: usize = 100;

#[tauri::command]
pub async fn json_to_tree(input: &str) -> Result<Vec<JsonTreeNode>, String> {
    let value: Value = serde_json::from_str(input).map_err(AppError::from)?;

    let result =
        tauri::async_runtime::spawn_blocking(move || build_tree("root", &value, "$", 0))
            .await
            .map_err(|e| AppError::Other(e.to_string()))
            .map_err(|e| e.to_string())?;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_tree_simple_object() {
        let json = r#"{"name": "test", "count": 42}"#;
        let value: Value = serde_json::from_str(json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        assert_eq!(tree.len(), 1);
        let root = &tree[0];
        assert_eq!(root.key, "root");
        assert_eq!(root.path, "$");
        assert!(root.type_label.contains("object"));
        assert!(root.children.is_some());

        let children = root.children.as_ref().unwrap();
        assert_eq!(children.len(), 2);

        // Check "name" field
        let name_node = children.iter().find(|c| c.key == "name").unwrap();
        assert_eq!(name_node.path, "$.name");
        assert_eq!(name_node.type_label, "string");
        assert_eq!(name_node.preview, "test");

        // Check "count" field
        let count_node = children.iter().find(|c| c.key == "count").unwrap();
        assert_eq!(count_node.path, "$.count");
        assert_eq!(count_node.type_label, "number");
        assert_eq!(count_node.preview, "42");
    }

    #[test]
    fn test_build_tree_nested_arrays() {
        let json = r#"{"items": [{"id": 1}, {"id": 2}]}"#;
        let value: Value = serde_json::from_str(json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        let root = &tree[0];
        let children = root.children.as_ref().unwrap();
        let items = children.iter().find(|c| c.key == "items").unwrap();

        assert!(items.type_label.contains("array"));
        assert_eq!(items.path, "$.items");

        let array_children = items.children.as_ref().unwrap();
        assert_eq!(array_children.len(), 2);
        assert_eq!(array_children[0].path, "$.items[0]");
        assert_eq!(array_children[1].path, "$.items[1]");

        // Check nested objects have children
        assert!(array_children[0].children.is_some());
        let first_item_children = array_children[0].children.as_ref().unwrap();
        assert_eq!(first_item_children[0].path, "$.items[0].id");
    }

    #[test]
    fn test_build_tree_null_and_bool() {
        let json = r#"{"active": true, "data": null}"#;
        let value: Value = serde_json::from_str(json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        let root = &tree[0];
        let children = root.children.as_ref().unwrap();

        let active = children.iter().find(|c| c.key == "active").unwrap();
        assert_eq!(active.type_label, "boolean");
        assert_eq!(active.preview, "true");

        let data = children.iter().find(|c| c.key == "data").unwrap();
        assert_eq!(data.type_label, "null");
        assert_eq!(data.preview, "null");
    }

    #[test]
    fn test_build_tree_string_truncation() {
        let long_string = "a".repeat(100);
        let json = format!(r#"{{"data": "{}"}}"#, long_string);
        let value: Value = serde_json::from_str(&json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        let root = &tree[0];
        let children = root.children.as_ref().unwrap();
        let data = children.iter().find(|c| c.key == "data").unwrap();

        assert!(data.preview.len() <= 53); // 50 chars + "..."
        assert!(data.preview.ends_with("..."));
    }

    #[test]
    fn test_build_tree_max_depth_truncation() {
        // Build a deeply nested JSON: {"a":{"a":{"a":...}}}
        let mut json = String::from("\"leaf\"");
        for _ in 0..MAX_DEPTH + 5 {
            json = format!(r#"{{"a":{}}}"#, json);
        }
        let value: Value = serde_json::from_str(&json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        // The tree should have been truncated at MAX_DEPTH
        // Walk down to verify truncation happened
        let mut current = &tree[0];
        for _ in 0..MAX_DEPTH + 1 {
            if let Some(ref children) = current.children {
                if children.is_empty() {
                    break;
                }
                // At max depth, children should have a node with preview "{...}"
                // but the function creates the truncated node differently
                current = &children[0];
            }
        }
        // After max depth, the last reachable node should indicate truncation
        assert!(
            current.type_label == "max_depth"
                || current.preview == "{...}"
                || current.preview == "[...]"
        );
    }

    #[test]
    fn test_build_tree_empty_object_and_array() {
        let json = r#"{"empty_obj": {}, "empty_arr": []}"#;
        let value: Value = serde_json::from_str(json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        let root = &tree[0];
        let children = root.children.as_ref().unwrap();

        let obj = children.iter().find(|c| c.key == "empty_obj").unwrap();
        assert!(obj.type_label.contains("object (0)"));
        assert!(obj.children.as_ref().unwrap().is_empty());

        let arr = children.iter().find(|c| c.key == "empty_arr").unwrap();
        assert!(arr.type_label.contains("array [0]"));
        assert!(arr.children.as_ref().unwrap().is_empty());
    }

    #[test]
    fn test_build_tree_uuid_unique() {
        let json = r#"{"a": 1, "b": 2, "c": 3}"#;
        let value: Value = serde_json::from_str(json).unwrap();
        let tree = build_tree("root", &value, "$", 0);

        let root = &tree[0];
        let children = root.children.as_ref().unwrap();

        // All IDs should be unique
        let ids: Vec<&str> = children.iter().map(|c| c.id.as_str()).collect();
        let mut unique = ids.clone();
        unique.sort();
        unique.dedup();
        assert_eq!(ids.len(), unique.len());

        // IDs should look like UUIDs (36 chars for standard UUID string)
        for id in ids {
            assert_eq!(id.len(), 36);
        }
    }
}
