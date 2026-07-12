<script setup lang="ts">
import { watch } from "vue";
import JsonEditor from "./JsonEditor.vue";
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
    <JsonEditor v-model="appStore.inputText" placeholder="Paste or type JSON here..." />
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
</style>
