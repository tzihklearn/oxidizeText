import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/appStore";
import type { JsonTreeNode } from "../types";

export function useJson() {
  const appStore = useAppStore();

  async function format(input: string): Promise<string> {
    appStore.setLoading(true);
    try {
      const result = await invoke<string>("format_json", { input });
      return result;
    } finally {
      appStore.setLoading(false);
    }
  }

  async function minify(input: string): Promise<string> {
    appStore.setLoading(true);
    try {
      const result = await invoke<string>("minify_json", { input });
      return result;
    } finally {
      appStore.setLoading(false);
    }
  }

  async function validate(input: string): Promise<boolean> {
    appStore.setLoading(true);
    try {
      await invoke("validate_json", { input });
      return true;
    } catch {
      return false;
    } finally {
      appStore.setLoading(false);
    }
  }

  async function loadTree(input: string): Promise<void> {
    appStore.setLoading(true);
    try {
      const result = await invoke<JsonTreeNode[]>("json_to_tree", { input });
      appStore.setTreeData(result);
      appStore.setIsValidJson(true);
    } catch (e) {
      appStore.setTreeData([]);
      appStore.setIsValidJson(false);
      console.error("Failed to load tree:", e);
    } finally {
      appStore.setLoading(false);
    }
  }

  return {
    format,
    minify,
    validate,
    loadTree,
    isLoading: appStore.isLoading,
  };
}
