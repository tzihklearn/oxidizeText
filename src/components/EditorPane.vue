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
  background-color: var(--bg-primary);
}

.editor-input {
  height: 100%;
}

.editor-input :deep(.n-input__textarea) {
  height: 100% !important;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.editor-input :deep(.n-input__textarea-el) {
  height: 100% !important;
}
</style>
