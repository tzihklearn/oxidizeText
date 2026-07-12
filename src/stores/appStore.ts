import { defineStore } from "pinia";
import type { JsonTreeNode } from "../types";

export type ViewMode = "tree" | "text";

export const useAppStore = defineStore("app", {
  state: () => ({
    inputText: "",
    outputText: "",
    treeData: [] as JsonTreeNode[],
    isLoading: false,
    isValidJson: true,
    treeNodeCount: 0,
    jsonSizeBytes: 0,
    viewMode: "tree" as ViewMode,
  }),
  actions: {
    setInput(text: string) {
      this.inputText = text;
    },
    setOutput(text: string) {
      this.outputText = text;
    },
    setTreeData(data: JsonTreeNode[]) {
      this.treeData = data;
    },
    setLoading(v: boolean) {
      this.isLoading = v;
    },
    setIsValidJson(v: boolean) {
      this.isValidJson = v;
    },
    setViewMode(mode: ViewMode) {
      this.viewMode = mode;
    },
    toggleViewMode() {
      this.viewMode = this.viewMode === "tree" ? "text" : "tree";
    },
  },
});
