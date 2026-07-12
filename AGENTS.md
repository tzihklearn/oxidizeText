# AGENTS.md — OxidizeText

## Project overview
Tauri v2 desktop JSON processing tool. Rust backend (`src-tauri/`), Vue 3 + TypeScript frontend (`src/`). The app is a JSON forge: format, minify, validate, and browse large nested JSON via a virtual-scrolled tree view (inspired by IntelliJ's debugger variable viewer).

**Current state**: Fresh scaffold — only the default Tauri greet command exists. The full design spec is in `oxidizeText.md`. That document is the blueprint for all planned components, Rust commands, data structures, and UI layout. Read it before implementing anything.

## Build & run

```bash
npm install              # install frontend deps
npm run tauri dev        # start dev (Vite on port 1420 + Tauri window)
npm run tauri build      # production build (runs vue-tsc + vite build first)
```

- `npm run build` runs `vue-tsc --noEmit && vite build` — this is the frontend build step, automatically invoked by `tauri build`.
- `npm run dev` starts only the Vite dev server (port 1420). Use `tauri dev` for the full app.
- Vite is locked to **port 1420** with `strictPort: true`. If the port is occupied, Vite will fail.

## Architecture

```
src/                  # Vue 3 frontend (currently only App.vue, main.ts)
src-tauri/
  src/
    main.rs           # thin entry: calls com_tzih_oxidizetext_lib::run()
    lib.rs            # Tauri builder, command registration, plugin setup
  Cargo.toml          # Rust deps (tauri 2, serde, serde_json, tauri-plugin-opener)
  tauri.conf.json     # window size 800x600, CSP disabled (null)
  capabilities/
    default.json      # Tauri v2 permissions: only core:default, opener:default
```

**Rust crate naming quirk**: The Cargo.toml sets `[lib] name = "com_tzih_oxidizetext_lib"` (underscores, not hyphens). The bin crate `com-tzih-oxidizetext` depends on it. Always reference the lib as `com_tzih_oxidizetext_lib` in Rust code.

**Tauri v2 (not v1)**: Uses v2 APIs — `@tauri-apps/api` v2, capabilities-based permissions, `tauri::generate_context!()`, `tauri-plugin-opener`.

## Design spec (`oxidizeText.md`)

Planned additions that do not exist yet:
- **Rust commands**: `format_json`, `minify_json`, `validate_json`, `json_to_tree` (in `src-tauri/src/commands/`)
- **Vue components**: Toolbar, EditorPane, InspectorPanel, StatusBar
- **Composables**: `useJson`, `useDebounce`, `useResizer`
- **State management**: Pinia store (`src/stores/appStore.ts`)
- **UI library**: Naive UI (`naive-ui`) — not yet installed. Uses `n-tree` for virtual-scrolled tree.
- **Tauri plugins needed**: `tauri-plugin-clipboard-manager` for clipboard access
- **Tauri capabilities needed**: `fs` (read/write), `clipboard`, `dialog` (open/save) — not in default.json yet

Key implementation constraints from the spec:
- Tree recursion max depth = 100, preview strings truncated to 50 chars
- Use `tokio::task::spawn_blocking` for tree building (CPU-heavy)
- Debounce `json_to_tree` calls to 500ms on the frontend
- InspectorPanel sidebar defaults to 450px width, uses `<n-tree>` with `virtual-scroll` enabled

## Toolchain

| Tool | Config |
|------|--------|
| TypeScript | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` |
| Rust edition | 2021 |
| Release profile | `lto = true`, `opt-level = 3`, `codegen-units = 1`, `panic = "abort"`, `strip = true` |
| Formatter/linter | Not yet configured |

## Gotchas
- Vite implicitly ignores `src-tauri/` via the watch config. Don't expect HMR on Rust changes.
- Tauri v2 uses capabilities, not the v1 `allowlist` system. Permissions live in `src-tauri/capabilities/`.
- CSP is set to `null` (disabled). If security requirements change, add a CSP policy.
- The `vue-tsc --noEmit` step in build catches TS errors. A failing build likely means a TS type error, not a runtime issue.
