<script setup lang="ts">
import { onMounted } from "vue";
import { NMessageProvider } from "naive-ui";
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
  background-color: var(--bg-primary);
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
  width: 4px;
  flex-shrink: 0;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--border-color);
  transition: background-color 0.2s;
}

.resizer:hover,
.app-layout.dragging .resizer {
  background-color: var(--accent);
}

.resizer-handle {
  width: 2px;
  height: 24px;
  border-radius: 1px;
  background-color: var(--text-secondary);
  opacity: 0.5;
}

.resizer:hover .resizer-handle,
.app-layout.dragging .resizer-handle {
  background-color: #ffffff;
  opacity: 1;
}

.inspector {
  min-width: 250px;
  max-width: 800px;
  flex-shrink: 0;
}
</style>
