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
  gap: 8px;
  height: 24px;
  padding: 0 12px;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-separator {
  opacity: 0.5;
}

.valid {
  color: #4ec9b0;
}

.invalid {
  color: #f48771;
}
</style>
