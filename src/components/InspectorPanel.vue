<script setup lang="ts">
import { ref, h } from "vue";
import {
  NTree,
  NInput,
  NButton,
  NSpace,
  NSpin,
  NEmpty,
  useMessage,
} from "naive-ui";
import type { TreeOption } from "naive-ui";
import { useAppStore } from "../stores/appStore";
import type { JsonTreeNode } from "../types";

const props = withDefaults(
  defineProps<{
    viewMode?: "tree" | "text";
  }>(),
  { viewMode: "tree" }
);

const appStore = useAppStore();
const message = useMessage();
const filterPattern = ref("");
const expandedKeys = ref<string[]>([]);

const typeColors: Record<string, string> = {
  object: "#569cd6",
  array: "#6a9955",
  string: "#ce9178",
  number: "#b5cea8",
  boolean: "#c586c0",
  null: "#808080",
};

function collectIds(nodes: JsonTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) {
      ids.push(...collectIds(node.children));
    }
  }
  return ids;
}

function expandAll() {
  expandedKeys.value = collectIds(appStore.treeData);
}

function collapseAll() {
  expandedKeys.value = [];
}

const filterFunction = (pattern: string, node: TreeOption) => {
  const p = pattern.toLowerCase();
  const jsonNode = node as unknown as JsonTreeNode;
  return (
    jsonNode.key.toLowerCase().includes(p) ||
    jsonNode.preview.toLowerCase().includes(p)
  );
};

function getBaseType(label: string): string {
  const spaceIdx = label.indexOf(" ");
  return spaceIdx >= 0 ? label.substring(0, spaceIdx) : label;
}

function renderLabel(info: {
  option: TreeOption;
  checked: boolean;
  selected: boolean;
}) {
  const node = info.option as unknown as JsonTreeNode;
  const baseType = getBaseType(node.type_label);
  const color = typeColors[baseType] || "#cccccc";

  return h("div", { class: "tree-node-row" }, [
    h("span", { class: "node-key", title: node.path }, node.key),
    h(
      "span",
      {
        class: "node-type",
        style: {
          color,
          backgroundColor: color + "20",
          borderColor: color,
        },
      },
      node.type_label
    ),
    h("span", { class: "node-preview" }, node.preview),
    h(
      "button",
      {
        class: "copy-btn",
        title: "Copy path",
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(node.path).then(() => {
            message.success("Path copied!");
          });
        },
      },
      "📋"
    ),
  ]);
}
</script>

<template>
  <div class="inspector-panel">
    <div class="inspector-header">
      <span class="inspector-title">{{
        props.viewMode === "text" ? "Output" : "Inspector"
      }}</span>
      <template v-if="props.viewMode === 'tree'">
        <n-input
          v-model:value="filterPattern"
          size="small"
          placeholder="Filter nodes..."
          class="filter-input"
        />
        <n-space>
          <n-button size="small" text @click="expandAll">Expand All</n-button>
          <n-button size="small" text @click="collapseAll"
            >Collapse All</n-button
          >
        </n-space>
      </template>
    </div>

    <div class="inspector-body">
      <template v-if="props.viewMode === 'text'">
        <div class="output-area">
          <n-input
            type="textarea"
            :value="appStore.outputText"
            readonly
            placeholder="Formatted or minified output appears here..."
            class="output-textarea"
          />
        </div>
      </template>

      <template v-else>
        <n-spin v-if="appStore.isLoading" class="loading-overlay">
          <template #description>Loading tree...</template>
        </n-spin>

        <n-empty
          v-else-if="appStore.treeData.length === 0"
          description="No JSON parsed yet. Type or paste JSON in the editor."
          class="empty-state"
        />

        <n-tree
          v-else
          :data="appStore.treeData"
          :default-expand-all="false"
          :expand-on-click="true"
          block-node
          :render-label="renderLabel"
          :filter="filterFunction"
          :pattern="filterPattern"
          :expanded-keys="expandedKeys"
          @update:expanded-keys="expandedKeys = $event as string[]"
          key-field="id"
          children-field="children"
          label-field="key"
          virtual-scroll
          class="inspector-tree"
          :style="{ height: '100%' }"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.inspector-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  overflow: hidden;
}

.inspector-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  background-color: var(--bg-secondary);
}

.inspector-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
}

.filter-input {
  flex: 1;
  min-width: 80px;
}

.inspector-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(30, 30, 30, 0.7);
  z-index: 10;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inspector-tree {
  height: 100%;
}

:deep(.n-tree-node-wrapper:hover) {
  background-color: var(--bg-tertiary) !important;
}

:deep(.n-tree-node--selected) {
  background-color: var(--bg-tertiary) !important;
}

:deep(.n-tree-node-content) {
  color: var(--text-primary);
}

.tree-node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.node-key {
  font-weight: bold;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.node-type {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  text-transform: lowercase;
  flex-shrink: 0;
}

.node-preview {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.copy-btn {
  opacity: 0;
  transition: opacity 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.copy-btn:hover {
  color: var(--accent);
}

.tree-node-row:hover .copy-btn {
  opacity: 1;
}

.output-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.output-textarea {
  height: 100%;
}

.output-textarea :deep(.n-input__textarea) {
  height: 100% !important;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.output-textarea :deep(.n-input__textarea-el) {
  height: 100% !important;
  resize: none;
}
</style>
