<script setup lang="ts">
import { NButton, NSpace } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../stores/appStore";
import { useJson } from "../composables/useJson";
import { useErrorHandler } from "../utils/error";

const appStore = useAppStore();
const { format, minify, validate, loadTree } = useJson();
const { handleError, handleSuccess } = useErrorHandler();

async function handleOpen() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (selected) {
      const path = typeof selected === "string" ? selected : selected;
      const content = await invoke<string>("read_file", { path });
      appStore.setFilePath(path as string);
      appStore.setInput(content);
      appStore.isDirty = false; // Reset: setInput marks dirty, but loading a file is clean
      loadTree(content);
      handleSuccess(`Opened ${appStore.fileName}`);
    }
  } catch (e) {
    handleError(e, "Open file");
  }
}

async function handleSave() {
  try {
    let path = appStore.filePath;
    if (!path) {
      const selected = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!selected) return;
      path = selected;
      appStore.setFilePath(path);
    }
    await invoke("write_file", { path, content: appStore.inputText });
    appStore.isDirty = false;
    handleSuccess(`Saved ${appStore.fileName}`);
  } catch (e) {
    handleError(e, "Save file");
  }
}

async function handleFormat() {
  try {
    const result = await format(appStore.inputText);
    appStore.setOutput(result);
    appStore.setViewMode("text");
  } catch (e) {
    handleError(e, "Format");
  }
}

async function handleMinify() {
  try {
    const result = await minify(appStore.inputText);
    appStore.setOutput(result);
    appStore.setViewMode("text");
  } catch (e) {
    handleError(e, "Minify");
  }
}

async function handleValidate() {
  const isValid = await validate(appStore.inputText);
  appStore.setIsValidJson(isValid);
  if (isValid) {
    handleSuccess("Valid JSON");
  } else {
    handleError("Invalid JSON", "Validate");
  }
}

function handleToggleView() {
  appStore.toggleViewMode();
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(appStore.inputText);
    handleSuccess("Copied to clipboard");
  } catch {
    handleError("Copy failed", "Copy");
  }
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    appStore.setInput(text);
    loadTree(text);
    handleSuccess("Pasted from clipboard");
  } catch {
    handleError("Paste failed", "Paste");
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
      <n-button size="small" text @click="handleOpen">
        <span class="btn-icon">📁</span> Open
      </n-button>
      <n-button size="small" text @click="handleSave">
        <span class="btn-icon">💾</span> Save
      </n-button>
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
  padding: 8px 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: var(--glass-border);
  box-shadow: var(--glass-glow), 0 0 15px var(--border-glow);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.toolbar::after {
  content: "";
  position: absolute;
  bottom: -1px;
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

.toolbar-spacer {
  flex: 1;
}

.btn-icon {
  margin-right: 4px;
  filter: saturate(0.8);
  transition: filter 0.2s;
}

:deep(.n-button:hover) .btn-icon {
  filter: saturate(1.2) drop-shadow(0 0 4px rgba(90, 200, 250, 0.5));
}

:deep(.n-button) {
  color: var(--text-secondary) !important;
  transition: all 0.25s ease !important;
}

:deep(.n-button:hover) {
  color: var(--text-primary) !important;
  text-shadow: 0 0 12px rgba(90, 200, 250, 0.5);
  transform: translateY(-1px);
}

:deep(.n-button__border) {
  border-color: transparent !important;
}

:deep(.n-button__state-border) {
  border-color: rgba(0, 122, 204, 0.3) !important;
  box-shadow: 0 0 8px rgba(0, 122, 204, 0.2) !important;
}
</style>
