<script setup lang="ts">
import { watch } from "vue";
import { NInput } from "naive-ui";
import { useAppStore } from "../stores/appStore";
import { useJson } from "../composables/useJson";
import { useDebounce } from "../composables/useDebounce";

const appStore = useAppStore();
const { loadTree } = useJson();
const debouncedLoadTree = useDebounce(loadTree, 500);

watch(
  () => appStore.inputText,
  (newVal) => {
    debouncedLoadTree(newVal);
  }
);
</script>

<template>
  <div class="editor-pane">
    <n-input
      type="textarea"
      v-model:value="appStore.inputText"
      placeholder="Paste or type JSON here..."
      :autosize="false"
      class="editor-input"
    />
  </div>
</template>

<style scoped>
.editor-pane {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: var(--glass-border);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.2);
  position: relative;
}

/* Subtle corner accents for sci-fi feel */
.editor-pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border-top: 1px solid rgba(90, 200, 250, 0.2);
  border-left: 1px solid rgba(90, 200, 250, 0.2);
  pointer-events: none;
  z-index: 2;
}

.editor-input {
  height: 100%;
}

.editor-input :deep(.n-input__textarea) {
  height: 100% !important;
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, Monaco,
    "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  background: transparent;
  color: var(--text-primary);
  caret-color: #5ac8fa;
}

.editor-input :deep(.n-input__textarea-el) {
  height: 100% !important;
  padding: 16px;
}

.editor-input :deep(.n-input__textarea-el::selection) {
  background: rgba(0, 122, 204, 0.35);
  color: #ffffff;
}

.editor-input :deep(.n-input__textarea-el::placeholder) {
  color: var(--text-dim) !important;
  font-style: italic;
  opacity: 0.6;
}

.editor-input :deep(.n-input__border) {
  border: none !important;
}

.editor-input :deep(.n-input__state-border) {
  border: none !important;
  box-shadow: none !important;
}
</style>
