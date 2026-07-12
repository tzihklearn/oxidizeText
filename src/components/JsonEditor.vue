<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from "vue";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  type DecorationSet,
  placeholder,
} from "@codemirror/view";
import { EditorState, type Extension, RangeSetBuilder } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, HighlightStyle, indentUnit } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    placeholder?: string;
  }>(),
  {
    readonly: false,
    placeholder: "Paste or type JSON here...",
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const editorContainer = ref<HTMLDivElement | null>(null);
const viewRef = shallowRef<EditorView | null>(null);

// ── Sci-Fi Syntax Highlighting ─────────────────────────────────────────────

const sciFiHighlightStyle = HighlightStyle.define([
  // JSON property names (keys) — solid cyan
  { tag: tags.propertyName, color: "#5AC8FA", fontWeight: "600" },
  // String values — warm orange
  { tag: tags.string, color: "#CE9178" },
  // Numbers — light green
  { tag: tags.number, color: "#B5CEA8" },
  // Booleans — purple
  { tag: tags.bool, color: "#C586C0" },
  // Null — gray
  { tag: tags.null, color: "#808080" },
  // Brackets, braces, commas — muted blue-gray
  { tag: tags.punctuation, color: "#8A9BB8" },
  // Bracket/brace matching
  { tag: tags.bracket, color: "#8A9BB8" },
  // Operators (like colon in JSON)
  { tag: tags.operator, color: "#8A9BB8" },
  // Line comments
  { tag: tags.comment, color: "#6A9955", fontStyle: "italic" },
  // Keywords
  { tag: tags.keyword, color: "#C586C0" },
  // Invalid/error
  { tag: tags.invalid, color: "#F48771", textDecoration: "underline wavy" },
  // Meta/annotation
  { tag: tags.meta, color: "#8A9BB8" },
  // Name (general identifier)
  { tag: tags.name, color: "#5AC8FA" },
  // Atom (true, false, null)
  { tag: tags.atom, color: "#C586C0" },
  // Separator
  { tag: tags.separator, color: "#8A9BB8" },
]);

// ── Indentation Depth Glow Extension ───────────────────────────────────────

const indentGlowClass = "cm-indent-glow";

/**
 * ViewPlugin that adds a subtle cyan bottom glow to indented lines.
 * Each line with leading whitespace gets a faint border-bottom decoration,
 * creating a visual "nesting depth" indicator beneath indented content.
 */
const indentGlowPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc;

      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const text = line.text;

        // Check if line has leading whitespace (indentation)
        const leadingWhitespace = text.match(/^(\s+)/);
        if (leadingWhitespace) {
          const indentLevel = leadingWhitespace[1].length;
          // Only apply to lines with meaningful indentation (2+ spaces)
          if (indentLevel >= 2) {
            const opacity = Math.min(0.04 + indentLevel * 0.015, 0.12);
            const decoration = Decoration.line({
              attributes: {
                class: indentGlowClass,
                style: `border-bottom: 1px solid rgba(90, 200, 250, ${opacity});`,
              },
            });
            builder.add(line.from, line.from, decoration);
          }
        }
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ── Editor Theme ───────────────────────────────────────────────────────────

const sciFiTheme = EditorView.theme({
  "&": {
    fontFamily:
      '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, Monaco, "Courier New", monospace',
    fontSize: "13px",
    lineHeight: "1.6",
    backgroundColor: "transparent",
    color: "#E0E6F1",
  },
  ".cm-content": {
    caretColor: "#5AC8FA",
    padding: "16px",
    paddingLeft: "8px",
  },
  ".cm-cursor": {
    borderLeftColor: "#5AC8FA",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#5AC8FA",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(0, 122, 204, 0.3)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(0, 122, 204, 0.2)",
  },
  ".cm-gutters": {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRight: "1px solid rgba(42, 58, 92, 0.3)",
    color: "#4A5A78",
    fontSize: "11px",
    paddingRight: "8px",
    paddingLeft: "4px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(0, 122, 204, 0.08)",
    color: "#8A9BB8",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(0, 122, 204, 0.04)",
  },
  ".cm-placeholder": {
    color: "#4A5A78 !important",
    fontStyle: "italic",
    opacity: "0.7",
  },
  ".cm-scroller": {
    overflow: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(42, 58, 92, 0.6) rgba(255, 255, 255, 0.02)",
  },
});

// ── Create Editor ──────────────────────────────────────────────────────────

function createExtensions(): Extension[] {
  const extensions: Extension[] = [
    // Language
    json(),

    // Indentation: 2 spaces
    indentUnit.of("  "),

    // History
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),

    // Sci-fi theme + syntax highlighting
    sciFiTheme,
    syntaxHighlighting(sciFiHighlightStyle),

    // Indentation glow effect
    indentGlowPlugin,

    // Line numbers with active line gutter
    lineNumbers(),
    highlightActiveLineGutter(),

    // Update listener for v-model sync
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        emit("update:modelValue", newValue);
      }
    }),

    // Placeholder
    placeholder(props.placeholder),
  ];

  if (props.readonly) {
    extensions.push(EditorView.editable.of(false));
    extensions.push(EditorState.readOnly.of(true));
  }

  return extensions;
}

function initEditor() {
  if (!editorContainer.value) return;

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions(),
  });

  const view = new EditorView({
    state,
    parent: editorContainer.value,
  });

  viewRef.value = view;
}

// ── Lifecycle & Watchers ───────────────────────────────────────────────────

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  viewRef.value?.destroy();
  viewRef.value = null;
});

// Watch for external modelValue changes (e.g., format/minify output)
watch(
  () => props.modelValue,
  (newValue) => {
    const view = viewRef.value;
    if (!view) return;

    const current = view.state.doc.toString();
    if (newValue !== current) {
      view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: newValue,
        },
      });
    }
  }
);

// Watch readonly prop — recreate editor to apply changes cleanly
watch(
  () => props.readonly,
  () => {
    const oldView = viewRef.value;
    if (!oldView) return;

    // Save cursor/scroll position
    const scrollTop = oldView.scrollDOM.scrollTop;
    const selection = oldView.state.selection;

    // Destroy and recreate
    oldView.destroy();
    initEditor();

    // Restore scroll position
    const newView = viewRef.value;
    if (newView) {
      newView.scrollDOM.scrollTop = scrollTop;
      // Only restore selection if not readonly
      if (!props.readonly && selection.ranges.length > 0) {
        newView.dispatch({ selection });
      }
    }
  }
);
</script>

<template>
  <div ref="editorContainer" class="json-editor" :class="{ readonly }"></div>
</template>

<style scoped>
.json-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  /* NOTE: parent panels (.editor-pane, .inspector-panel) already provide
     backdrop-filter — nesting two backdrop-filters breaks rendering in WKWebView */
}

.json-editor :deep(.cm-editor) {
  height: 100%;
}

.json-editor :deep(.cm-scroller) {
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, Monaco,
    "Courier New", monospace;
}

/* Read-only styling: subtle dimming */
.json-editor.readonly {
  background: rgba(255, 255, 255, 0.02);
}

.json-editor.readonly :deep(.cm-content) {
  caretColor: transparent !important;
}

.json-editor.readonly :deep(.cm-cursor) {
  display: none !important;
}

/* Indentation glow line effect — enhanced via CSS for hover */
.json-editor :deep(.cm-line) {
  position: relative;
  padding-left: 4px;
}

.json-editor :deep(.cm-line.cm-indent-glow:hover) {
  border-bottom-color: rgba(90, 200, 250, 0.15) !important;
  box-shadow: inset 0 -1px 0 rgba(90, 200, 250, 0.08);
}

/* Scrollbar styling */
.json-editor :deep(.cm-scroller::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

.json-editor :deep(.cm-scroller::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.02);
}

.json-editor :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: rgba(42, 58, 92, 0.6);
  border-radius: 4px;
}

.json-editor :deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 122, 204, 0.5);
}
</style>
