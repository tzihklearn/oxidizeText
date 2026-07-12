# AGENTS.md — OxidizeText

## Project overview
Tauri v2 desktop JSON processing tool. Rust backend (`src-tauri/`), Vue 3 + TypeScript frontend (`src/`). The app is a JSON forge: format, minify, validate, and browse large nested JSON via a virtual-scrolled tree view (inspired by IntelliJ's debugger variable viewer).

**Current state**: All MVP components implemented. CodeMirror 6 for JSON editing with syntax highlighting. Glassmorphism dark sci-fi theme.

## Build & run

```bash
npm install              # install frontend deps
npm run tauri dev        # start dev (Vite on port 1420 + Tauri window)
npm run tauri build      # production build (runs vue-tsc + vite build first)
```

- `npm run build` runs `vue-tsc --noEmit && vite build` — this is the frontend build step, automatically invoked by `tauri build`.
- `npm run dev` starts only the Vite dev server (port 1420). Use `tauri dev` for the full app.
- Vite is locked to **port 1420** with `strictPort: true`. If the port is occupied, Vite will fail.

## Testing

```bash
# Frontend unit tests (Vitest)
npm test                # run once
npm run test:watch      # watch mode

# Rust unit tests
cargo test              # from src-tauri/ directory
```

**Before committing, always run:**
```bash
npm test && (cd src-tauri && cargo test)
```

### Test infrastructure
- **Frontend**: Vitest + happy-dom. Tests in `src/__tests__/`. Uses `vi.mock("@tauri-apps/api/core")` to mock Tauri IPC.
- **Rust**: Standard `#[cfg(test)] mod tests` in each command module.
- **Coverage targets**: All composables, all store actions/getters, all Rust commands with valid/invalid/edge inputs.

### When writing new code
- New composable → add `src/__tests__/<name>.test.ts`
- New store action → add test case in `appStore.test.ts`
- New Rust command → add `#[test]` in the same file's `mod tests`
- Mock Tauri APIs with `vi.mock("@tauri-apps/api/core")`

## Architecture

```
src/                           # Vue 3 frontend
  App.vue                      # Root layout (toolbar + editor + resizer + inspector + status bar)
  main.ts                      # Entry: creates Pinia + Naive UI + mounts app
  components/
    Toolbar.vue                # File ops, JSON ops, clipboard, view toggle
    EditorPane.vue             # Left: CodeMirror 6 editor with JSON syntax highlighting
    InspectorPanel.vue         # Right: n-tree (virtual-scrolled) or read-only CodeMirror output
    StatusBar.vue              # Bottom: filename, node count, size, validity
    JsonEditor.vue             # CodeMirror 6 wrapper (v-model, readonly, syntax theme)
  composables/
    useJson.ts                 # format, minify, validate, loadTree — calls Tauri commands
    useDebounce.ts             # Generic debounce (default 500ms)
    useResizer.ts              # Draggable sidebar (min 250, max 800, default 450)
  stores/
    appStore.ts                # Pinia: inputText, outputText, treeData, viewMode, etc.
  styles/
    global.css                 # CSS variables: glassmorphism dark theme + Naive UI overrides
  types/
    index.ts                   # JsonTreeNode, AppState interfaces
  __tests__/                   # Vitest unit tests
    useDebounce.test.ts
    useResizer.test.ts
    useJson.test.ts
    appStore.test.ts
    __mocks__/
      tauri-api.ts             # Mock for @tauri-apps/api/core invoke

src-tauri/src/
  main.rs                      # Thin entry: calls com_tzih_oxidizetext_lib::run()
  lib.rs                       # Tauri builder, command registration, plugin setup
  error.rs                     # AppError enum (JsonParse, Io, Other)
  commands/
    json_cmds.rs               # format_json, minify_json, validate_json
    tree_cmds.rs               # json_to_tree (recursive, max_depth=100, spawn_blocking)
    file_cmds.rs               # read_file, write_file
  models/
    tree_node.rs               # JsonTreeNode struct (id, key, path, type_label, preview, children)
```

**Rust crate naming quirk**: The Cargo.toml sets `[lib] name = "com_tzih_oxidizetext_lib"` (underscores, not hyphens). The bin crate `com-tzih-oxidizetext` depends on it. Always reference the lib as `com_tzih_oxidizetext_lib` in Rust code.

**Tauri v2 (not v1)**: Uses v2 APIs — `@tauri-apps/api` v2, capabilities-based permissions, `tauri::generate_context!()`, `tauri-plugin-opener`, `tauri-plugin-dialog`.

## Key implementation details

- Tree recursion max depth = 100, preview strings truncated to 50 chars
- `json_to_tree` uses `tauri::async_runtime::spawn_blocking` for CPU-heavy tree building
- Frontend debounces `json_to_tree` calls to 500ms via `useDebounce`
- InspectorPanel sidebar defaults to 450px width, uses `<n-tree>` with `virtual-scroll`
- CodeMirror 6 with custom glassmorphism theme: JSON keys `#5AC8FA`, strings `#CE9178`, numbers `#B5CEA8`
- Nesting depth visual effect: `ViewPlugin` adding cyan bottom border to indented lines
- **Do not nest `backdrop-filter`** in child elements — WKWebView (Tauri macOS) breaks rendering

## Theme
- Dark glassmorphism sci-fi theme (`--bg-primary: #0A0E17`, glass panels `rgba(255,255,255,0.05)`)
- Border glow `#2A3A5C`, accent `#007ACC`, key gradient `#5AC8FA` → `#007AFF`
- Status bar: "Share Tech Mono" dot-matrix font from Google Fonts

## Gotchas
- Vite implicitly ignores `src-tauri/` via the watch config. Don't expect HMR on Rust changes.
- Tauri v2 uses capabilities, not the v1 `allowlist` system. Permissions live in `src-tauri/capabilities/`.
- CSP is set to `null` (disabled). If security requirements change, add a CSP policy.
- The `vue-tsc --noEmit` step in build catches TS errors. A failing build likely means a TS type error, not a runtime issue.
- Nested `backdrop-filter` causes WKWebView rendering bugs. Apply only to top-level panels.
- `@tauri-apps/api/core` must be mocked in Vitest tests — use `vi.mock("@tauri-apps/api/core")`.
