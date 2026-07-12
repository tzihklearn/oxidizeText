<script setup lang="ts">
import { ref, h, computed, watch, onMounted, onBeforeUnmount, shallowRef, toRaw } from "vue";
import {
  NTree,
  NInput,
  NButton,
  NSpace,
  NSpin,
  NEmpty,
  useMessage,
} from "naive-ui";
import JsonEditor from "./JsonEditor.vue";
import type { TreeOption } from "naive-ui";
import { useAppStore } from "../stores/appStore";
import { useDebounce } from "../composables/useDebounce";
import FilterWorker from "../workers/filter.worker?worker";
import type { JsonTreeNode } from "../types";

const props = withDefaults(
  defineProps<{
    viewMode?: "tree" | "text";
  }>(),
  { viewMode: "tree" }
);

const appStore = useAppStore();
const message = useMessage();
// ── Filter state ──────────────────────────────────────────────────────────
const filterInput = ref(""); // raw input value (bound to n-input)
const debouncedFilter = ref(""); // debounced value → sent to worker
const matchingIds = ref<Set<string>>(new Set());
const workerRef = shallowRef<Worker | null>(null);

const isFilterActive = computed(() => filterInput.value.trim().length > 0);

// Debounce: raw input → 300ms → debouncedFilter
const setDebouncedFilter = useDebounce((val: string) => {
  debouncedFilter.value = val;
}, 300);
watch(filterInput, (val) => setDebouncedFilter(val));

// Send filter query to worker when debounced value changes
watch(debouncedFilter, (pattern) => {
  if (!workerRef.value) return;
  if (!pattern.trim()) {
    matchingIds.value = new Set();
    return;
  }
  workerRef.value.postMessage({ type: "filter", pattern });
});

// Index treeData in worker whenever it changes (new file opened, etc.)
watch(
  () => appStore.treeData,
  (data) => {
    if (workerRef.value && data.length > 0) {
      workerRef.value.postMessage({ type: "index", treeData: toRaw(data) });
      // Re-run current filter with fresh index
      if (debouncedFilter.value) {
        workerRef.value.postMessage({
          type: "filter",
          pattern: debouncedFilter.value,
        });
      }
    }
  }
);

// Worker lifecycle
onMounted(() => {
  const worker = new FilterWorker();
  worker.onmessage = (e: MessageEvent) => {
    if (e.data.type === "result") {
      matchingIds.value = new Set(e.data.matchingIds as string[]);
    }
  };
  workerRef.value = worker;
  // Initial index
  if (appStore.treeData.length > 0) {
    worker.postMessage({ type: "index", treeData: toRaw(appStore.treeData) });
  }
});

onBeforeUnmount(() => {
  workerRef.value?.terminate();
});

// ── Filtered tree computation ─────────────────────────────────────────────

/** Prune tree to nodes that match filter + their ancestors (to keep structure visible) */
function filterTreeKeepingAncestors(
  nodes: JsonTreeNode[],
  matchIds: Set<string>
): JsonTreeNode[] {
  function walk(list: JsonTreeNode[]): JsonTreeNode[] {
    const result: JsonTreeNode[] = [];
    for (const node of list) {
      const filteredChildren = node.children
        ? walk(node.children)
        : undefined;
      const hasMatchingChildren =
        filteredChildren && filteredChildren.length > 0;
      const isMatch = matchIds.has(node.id);

      if (isMatch || hasMatchingChildren) {
        result.push({
          ...node,
          children: filteredChildren || node.children,
        });
      }
    }
    return result;
  }
  return walk(nodes);
}

/** Tree data swapped in when filtering is active */
const filteredTreeData = computed(() => {
  if (!isFilterActive.value) return appStore.treeData;
  return filterTreeKeepingAncestors(appStore.treeData, matchingIds.value);
});

const expandedKeys = ref<string[]>([]);

const typeColors: Record<string, string> = {
  object: "#569cd6",
  array: "#4ec9b0",
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
  expandedKeys.value = collectIds(
    isFilterActive.value ? filteredTreeData.value : appStore.treeData
  );
}

function collapseAll() {
  expandedKeys.value = [];
}

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
          v-model:value="filterInput"
          size="small"
          placeholder="Filter nodes..."
          class="filter-input"
        />
        <span v-if="isFilterActive" class="filter-count">
          {{ matchingIds.size }} match{{ matchingIds.size !== 1 ? "es" : "" }}
        </span>
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
          <JsonEditor
            v-model="appStore.outputText"
            :readonly="true"
            placeholder="Formatted or minified output appears here..."
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
          :data="(isFilterActive ? filteredTreeData : appStore.treeData) as unknown as TreeOption[]"
          :default-expand-all="false"
          :expand-on-click="true"
          block-node
          :render-label="renderLabel"
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
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-left: var(--glass-border);
  box-shadow: var(--glass-glow), inset 0 0 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
}

/* Sci-fi scanning line animation over the tree */
.inspector-panel::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(90, 200, 250, 0.4),
    rgba(0, 122, 204, 0.6),
    rgba(90, 200, 250, 0.4),
    transparent
  );
  opacity: 0.3;
  animation: scanline 8s linear infinite;
  pointer-events: none;
  z-index: 5;
}

@keyframes scanline {
  0% {
    top: 0;
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.inspector-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: var(--glass-border);
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 2;
}

.inspector-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(90, 200, 250, 0.3);
  letter-spacing: 1px;
}

.filter-input {
  flex: 1;
  min-width: 80px;
}

.filter-count {
  font-size: 11px;
  color: #5ac8fa;
  white-space: nowrap;
  text-shadow: 0 0 6px rgba(90, 200, 250, 0.3);
}

.filter-input :deep(.n-input__input-el) {
  color: var(--text-primary) !important;
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
  background: rgba(10, 14, 23, 0.85);
  backdrop-filter: blur(4px);
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

/* Tree node hover with cyan glass highlight */
:deep(.n-tree-node-wrapper:hover) {
  background: linear-gradient(
    90deg,
    rgba(0, 122, 204, 0.08) 0%,
    rgba(90, 200, 250, 0.05) 50%,
    transparent 100%
  ) !important;
  box-shadow: inset 2px 0 0 rgba(90, 200, 250, 0.4) !important;
}

/* Selected node with prominent cyan glass */
:deep(.n-tree-node--selected) {
  background: linear-gradient(
    90deg,
    rgba(0, 122, 204, 0.15) 0%,
    rgba(90, 200, 250, 0.08) 50%,
    transparent 100%
  ) !important;
  box-shadow: inset 3px 0 0 rgba(0, 122, 204, 0.6),
    0 0 15px rgba(0, 122, 204, 0.1) !important;
}

:deep(.n-tree-node-content) {
  color: var(--text-primary);
}

/* Nesting depth visual effect: left border glow that intensifies with depth */
:deep(.n-tree-node-wrapper) {
  position: relative;
}

:deep(.n-tree-node-wrapper::before) {
  content: "";
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(90, 200, 250, 0.15),
    transparent
  );
  opacity: 0.6;
  transition: opacity 0.2s;
}

:deep(.n-tree-node-wrapper:hover::before) {
  opacity: 1;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(90, 200, 250, 0.4),
    transparent
  );
  box-shadow: 0 0 6px rgba(90, 200, 250, 0.3);
}

.tree-node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

/* JSON key names with cyan-blue gradient */
.node-key {
  font-weight: 600;
  background: linear-gradient(135deg, #5ac8fa, #007aff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
  text-shadow: none;
  letter-spacing: 0.3px;
}

/* Glass-like type labels */
.node-type {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid;
  text-transform: lowercase;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Preview text in dim cyan-gray */
.node-preview {
  color: #6a8aaa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  font-size: 12px;
}

.copy-btn {
  opacity: 0;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(42, 58, 92, 0.4);
  border-radius: 4px;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 12px;
  flex-shrink: 0;
  color: var(--text-secondary);
  backdrop-filter: blur(4px);
}

.copy-btn:hover {
  color: #5ac8fa;
  border-color: rgba(90, 200, 250, 0.4);
  box-shadow: 0 0 8px rgba(90, 200, 250, 0.2);
  background: rgba(90, 200, 250, 0.08);
}

.tree-node-row:hover .copy-btn {
  opacity: 1;
}

.output-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
