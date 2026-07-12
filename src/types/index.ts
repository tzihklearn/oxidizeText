export interface JsonTreeNode {
  id: string;
  key: string;
  path: string;
  type_label: string;
  preview: string;
  children?: JsonTreeNode[];
}

export interface AppState {
  inputText: string;
  outputText: string;
  treeData: JsonTreeNode[];
  isLoading: boolean;
}
