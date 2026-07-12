<script setup lang="ts">
import { NButton, NSpace, useMessage } from "naive-ui";
import { useAppStore } from "../stores/appStore";
import { useJson } from "../composables/useJson";

const appStore = useAppStore();
const { format, minify, validate } = useJson();
const message = useMessage();

async function handleFormat() {
  try {
    const result = await format(appStore.inputText);
    appStore.setOutput(result);
    appStore.setViewMode("text");
  } catch (e) {
    message.error("Format failed");
    console.error(e);
  }
}

async function handleMinify() {
  try {
    const result = await minify(appStore.inputText);
    appStore.setOutput(result);
    appStore.setViewMode("text");
  } catch (e) {
    message.error("Minify failed");
    console.error(e);
  }
}

async function handleValidate() {
  const isValid = await validate(appStore.inputText);
  appStore.setIsValidJson(isValid);
  if (isValid) {
    message.success("Valid JSON");
  } else {
    message.error("Invalid JSON");
  }
}

function handleToggleView() {
  appStore.toggleViewMode();
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(appStore.inputText);
    message.success("Copied to clipboard");
  } catch {
    message.error("Copy failed");
  }
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    appStore.setInput(text);
    message.success("Pasted from clipboard");
  } catch {
    message.error("Paste failed");
  }
}

const viewToggleLabel = () =>
  appStore.viewMode === "tree" ? "Text Output" : "Tree View";

const viewToggleIcon = () =>
  appStore.viewMode === "tree" ? "📄" : "🌳";
</script>

<template>
  <div class="toolbar">
    <n-space>
      <n-button size="small" text @click="handleFormat">
        <span class="btn-icon">✨</span> Format
      </n-button>
      <n-button size="small" text @click="handleMinify">
        <span class="btn-icon">📦</span> Minify
      </n-button>
      <n-button size="small" text @click="handleValidate">
        <span class="btn-icon">🔍</span> Validate
      </n-button>
      <n-button size="small" text @click="handleToggleView">
        <span class="btn-icon">{{ viewToggleIcon() }}</span>
        {{ viewToggleLabel() }}
      </n-button>
      <div class="toolbar-spacer" />
      <n-button size="small" text @click="handleCopy">
        <span class="btn-icon">📋</span> Copy
      </n-button>
      <n-button size="small" text @click="handlePaste">
        <span class="btn-icon">📥</span> Paste
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.toolbar-spacer {
  flex: 1;
}

.btn-icon {
  margin-right: 4px;
}
</style>
