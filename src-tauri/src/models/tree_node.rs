use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonTreeNode {
    pub id: String,
    pub key: String,
    pub path: String,
    pub type_label: String,
    pub preview: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<JsonTreeNode>>,
}
