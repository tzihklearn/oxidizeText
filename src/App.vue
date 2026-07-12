<script setup lang="ts">
import { onMounted, watch } from "vue";
import { NMessageProvider } from "naive-ui";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "./stores/appStore";
import { useResizer } from "./composables/useResizer";
import Toolbar from "./components/Toolbar.vue";
import EditorPane from "./components/EditorPane.vue";
import InspectorPanel from "./components/InspectorPanel.vue";
import StatusBar from "./components/StatusBar.vue";

const appStore = useAppStore();
const { isDragging, sidebarWidth, startDrag } = useResizer();

const demoJson = JSON.stringify(
  {
    project: {
      name: "OxidizeText",
      version: "0.1.0",
      metadata: {
        created: "2026-07-12",
        authors: [
          { name: "Alice", role: "lead" },
          { name: "Bob", role: "contributor" },
        ],
        settings: {
          theme: "dark",
          features: {
            formatting: true,
            validation: true,
            treeView: true,
            advanced: {
              maxDepth: 100,
              previewLength: 50,
              cacheEnabled: false,
            },
          },
        },
      },
    },
    data: {
      users: [
        {
          id: 1,
          name: "Alice",
          active: true,
          balance: 1234.56,
          tags: ["admin", "dev"],
        },
        {
          id: 2,
          name: "Bob",
          active: false,
          balance: null,
          tags: [],
        },
      ],
      stats: {
        total: 2,
        ratio: 0.5,
        nested: {
          a: {
            b: {
              c: {
                d: "deep value",
              },
            },
          },
        },
      },
    },
  },
  null,
  2
);

onMounted(() => {
  appStore.setInput(demoJson);
});

watch(
  () => [appStore.fileName, appStore.isDirty] as const,
  ([name, dirty]) => {
    const title = `${dirty ? "● " : ""}${name} — OxidizeText`;
    getCurrentWindow().setTitle(title);
  },
  { immediate: true }
);
</script>

<template>
  <n-message-provider>
    <div class="app-layout" :class="{ dragging: isDragging }">
      <Toolbar />

      <div class="main-panel">
        <EditorPane />

        <div class="resizer" @mousedown="startDrag">
          <div class="resizer-handle" />
        </div>

        <InspectorPanel
          class="inspector"
          :style="{ width: sidebarWidth + 'px' }"
          :view-mode="appStore.viewMode"
        />
      </div>

      <StatusBar />
    </div>
  </n-message-provider>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  /* Deep space radial gradient with subtle noise feel */
  background:
    radial-gradient(ellipse at 20% 50%, rgba(0, 60, 120, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 122, 204, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(42, 58, 92, 0.2) 0%, transparent 60%),
    var(--bg-primary);
  position: relative;
}

/* Subtle grid overlay for sci-fi depth */
.app-layout::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(42, 58, 92, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(42, 58, 92, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.app-layout > * {
  position: relative;
  z-index: 1;
}

.app-layout.dragging {
  cursor: col-resize;
  user-select: none;
}

.main-panel {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.resizer {
  width: 6px;
  flex-shrink: 0;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.2s ease;
  position: relative;
}

.resizer::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(42, 58, 92, 0.4) 20%,
    rgba(0, 122, 204, 0.3) 50%,
    rgba(42, 58, 92, 0.4) 80%,
    transparent 100%
  );
  opacity: 0.6;
  transition: opacity 0.2s;
}

.resizer:hover::before,
.app-layout.dragging .resizer::before {
  opacity: 1;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 122, 204, 0.5) 20%,
    rgba(90, 200, 250, 0.6) 50%,
    rgba(0, 122, 204, 0.5) 80%,
    transparent 100%
  );
  box-shadow: 0 0 15px rgba(0, 122, 204, 0.4);
}

.resizer-handle {
  width: 2px;
  height: 32px;
  border-radius: 1px;
  background-color: var(--text-secondary);
  opacity: 0.3;
  position: relative;
  z-index: 1;
  transition: all 0.2s;
}

.resizer:hover .resizer-handle,
.app-layout.dragging .resizer-handle {
  background-color: #5ac8fa;
  opacity: 1;
  box-shadow: 0 0 8px rgba(90, 200, 250, 0.6);
}

.inspector {
  min-width: 250px;
  max-width: 800px;
  flex-shrink: 0;
}
</style>
