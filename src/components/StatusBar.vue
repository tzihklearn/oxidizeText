<script setup lang="ts">
import { computed } from "vue";
import { NText } from "naive-ui";
import { useAppStore } from "../stores/appStore";
import type { JsonTreeNode } from "../types";

const appStore = useAppStore();

function countNodes(nodes: JsonTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}

const nodeCount = computed(() => countNodes(appStore.treeData));

const jsonSize = computed(() => {
  const bytes = new Blob([appStore.inputText]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
});

const validityText = computed(() =>
  appStore.isValidJson ? "Valid JSON ✓" : "Invalid JSON ✗"
);

const validityClass = computed(() =>
  appStore.isValidJson ? "valid" : "invalid"
);
</script>

<template>
  <div class="status-bar">
    <n-text class="status-item" :depth="3">
      {{ appStore.fileName }}
    </n-text>
    <span class="status-separator">|</span>
    <n-text class="status-item" :depth="3">
      Nodes: {{ nodeCount }}
    </n-text>
    <span class="status-separator">|</span>
    <n-text class="status-item" :depth="3">
      Size: {{ jsonSize }}
    </n-text>
    <span class="status-separator">|</span>
    <span :class="['status-item', validityClass]">
      {{ validityText }}
    </span>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 28px;
  padding: 0 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: var(--glass-border);
  box-shadow: var(--glass-glow), 0 -4px 15px rgba(42, 58, 92, 0.2);
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-secondary);
  position: relative;
}

/* Top border glow */
.status-bar::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(90, 200, 250, 0.3) 20%,
    rgba(0, 122, 204, 0.4) 50%,
    rgba(90, 200, 250, 0.3) 80%,
    transparent 100%
  );
}

.status-separator {
  opacity: 0.3;
  color: var(--border-color);
}

.status-item {
  text-shadow: 0 0 6px rgba(90, 200, 250, 0.15);
  transition: text-shadow 0.2s;
}

/* Dot-matrix sci-fi font styling for all status items */
.status-item {
  font-family: "Share Tech Mono", "SF Mono", "Courier New", monospace;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 11px;
}

/* Fallback dot-matrix simulation when font isn't loaded */
.status-item {
  text-shadow: 0 0 4px rgba(90, 200, 250, 0.2), 0 0 8px rgba(0, 122, 204, 0.1);
}

.valid {
  color: #4ec9b0;
  text-shadow: 0 0 6px rgba(78, 201, 176, 0.3), 0 0 12px rgba(78, 201, 176, 0.15);
}

.invalid {
  color: #f48771;
  text-shadow: 0 0 6px rgba(244, 135, 113, 0.3), 0 0 12px rgba(244, 135, 113, 0.15);
}

/* Node count gets extra glow */
.status-item:nth-child(3) {
  color: #5ac8fa;
  text-shadow: 0 0 8px rgba(90, 200, 250, 0.3), 0 0 16px rgba(0, 122, 204, 0.15);
}
</style>
