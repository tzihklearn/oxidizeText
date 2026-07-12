---
type: Note
---
# OxidizeText

## **1. 项目概述**

**OxidizeText** 是一款基于 **Tauri v2** 的跨平台桌面数据处理工具，参考于sublimeText。它的定位是“文本与数据的锻造台”，旨在提供一个极速、优雅的图形界面，让开发者能够轻松处理大型、嵌套的JSON数据（未来将扩展至其他格式数据）。

**核心交互范式**：借鉴 **IntelliJ IDEA / Chrome DevTools 的 Debug 变量查看器**，通过右侧侧边栏实现**无限层级、虚拟滚动、可折叠的树形结构**，专治大型嵌套JSON的浏览与分析。

## **2. 技术栈**

| **层级**          | **技术选型**                         | **版本/说明**                                 |
| --------------- | -------------------------------- | ----------------------------------------- |
| **桌面容器**        | Tauri                            | v2.0 (采用 WRY 和 Tao)                       |
| **前端框架**        | Vue 3                            | Composition API + `<script setup>` 语法     |
| **前端语言**        | TypeScript                       | 严格模式 (`strict: true`)                     |
| **UI 组件库**      | Naive UI                         | 提供 `n-tree` (虚拟滚动)、`n-input`、`n-button` 等 |
| **状态管理**        | Pinia                            | 管理应用全局状态（编辑器内容、视图模式）                      |
| **构建工具**        | Vite                             | v5.x                                      |
| **后端语言**        | Rust                             | Edition 2021                              |
| **核心JSON库**     | `serde_json`, `serde`            | 序列化/反序列化                                  |
| **树ID生成**       | `uuid`                           | v1.0 (生成唯一节点ID)                           |
| **错误处理**        | `anyhow`, `thiserror`            | 统一错误处理                                    |
| **剪贴板**         | `tauri-plugin-clipboard-manager` | 跨平台复制粘贴                                   |
| **命令行参数**(Rust) | clap                             | (为未来CLI模式预留）                              |

## **3. 项目架构**

### **3.1 目录结构**

```text
oxidize-text/
├── src-tauri/                          # Rust 后端
│   ├── src/
│   │   ├── main.rs                     # 应用入口，注册Tauri命令
│   │   ├── lib.rs                      # 导出核心库
│   │   ├── commands/                   # Tauri 命令模块
│   │   │   ├── mod.rs                  # 导出所有命令
│   │   │   ├── json_cmds.rs            # JSON 处理：格式、压缩、验证
│   │   │   └── tree_cmds.rs            # 树形结构生成命令
│   │   ├── models/                     # 数据结构
│   │   │   ├── mod.rs
│   │   │   └── tree_node.rs            # 定义 JsonTreeNode 结构体
│   │   └── utils/                      # 工具函数
│   │       └── mod.rs
│   ├── Cargo.toml                      # Rust 依赖
│   └── tauri.conf.json                 # Tauri 配置（窗口尺寸、权限）
├── src/                                # Vue 3 前端
│   ├── main.ts                         # 入口文件，注册 Naive UI
│   ├── App.vue                         # 根布局（编辑器 + 可拖动分隔条 + 侧边栏）
│   ├── components/
│   │   ├── Toolbar.vue                 # 顶部工具栏（打开、保存、格式化等）
│   │   ├── EditorPane.vue              # 代码编辑器（基于文本域或Monaco）
│   │   ├── InspectorPanel.vue          # 【核心】右侧树形检查器侧边栏
│   │   └── StatusBar.vue               # 底部状态栏（行数、节点数等）
│   ├── composables/
│   │   ├── useJson.ts                  # JSON 操作逻辑（调用后端命令）
│   │   ├── useDebounce.ts              # 防抖函数（避免高频刷新树）
│   │   └── useResizer.ts               # 拖动分隔条逻辑
│   ├── stores/
│   │   └── appStore.ts                 # Pinia Store（存输入、输出、树数据）
│   ├── types/
│   │   └── index.ts                    # TypeScript 接口定义
│   └── styles/
│       └── global.css                  # 全局样式重置
├── index.html
├── package.json                        # 前端依赖
├── vite.config.ts                      # Vite 配置 (devServer 端口 1420)
├── tsconfig.json                       # TypeScript 配置
└── README.md
```

### **3.2 前后端通信**

所有数据处理的重计算任务交由 Rust 后端处理，前端负责 UI 交互与展示。

所有数据处理的重计算任务交由 Rust 后端处理，前端负责 UI 交互与展示。

**通信方式**：Tauri 的 `invoke` API（异步 IPC 调用）。

```typescript
// 前端调用示例
import { invoke } from '@tauri-apps/api/tauri';

const result = await invoke<string>('format_json', { input: jsonString });
```

## **4. 功能需求（第一阶段 - MVP）**

### **4.1 核心功能**

| **功能**   | **描述**              | **输入**    | **输出**           |
| -------- | ------------------- | --------- | ---------------- |
| **格式化**  | 将压缩的JSON格式化为缩进美观的文本 | 原始JSON字符串 | 格式化后的JSON字符串     |
| **压缩**   | 去除所有空白字符，最小化JSON体积  | 原始JSON字符串 | 压缩后的JSON字符串      |
| **验证**   | 检查JSON语法是否正确，返回错误位置 | 原始JSON字符串 | 验证结果（成功/失败+错误信息） |
| **树形视图** | 将JSON解析为可折叠的树形结构展示  | 原始JSON字符串 | 树形UI组件           |
| **复制**   | 将处理后的内容复制到系统剪贴板     | 处理后的内容    | -                |
| **粘贴**   | 从系统剪贴板读取内容          | -         | 粘贴的内容            |

### **4.2 UI 布局（单页应用）**

```typescript
+--------------------------------------------------+
|  OxidizeText - [标题栏]                    [_][□][X] |
+--------------------------------------------------+
|  📁 打开  💾 保存  📋 复制  📥 粘贴  ✨ 格式化  |  <- 工具栏
|  🔍 验证  📦 压缩  🌳 树形视图  ⚙️ 设置         |
+--------------------------------------------------+
|                                                    |
|  +--------------------------------------------+  |
|  |  // 编辑器区域 (Monaco Editor 或 Textarea)  |  |
|  |  {                                          |  |
|  |    "name": "OxidizeText",                     |  |
|  |    "version": "0.1.0"                      |  |
|  |  }                                          |  |
|  |                                              |  |
|  +--------------------------------------------+  |
|                                                    |
|  +--------------------------------------------+  |
|  |  // 输出/预览区域                           |  |
|  |  树形视图 或 格式化后的文本                  |  |
|  |                                              |  |
|  +--------------------------------------------+  |
|                                                    |
+--------------------------------------------------+
|  行: 10  列: 5  格式: JSON  大小: 2.5KB          |  <- 状态栏
+--------------------------------------------------+
```

## **5. 数据结构定义**

### **5.1 TypeScript 类型**

```typescript
// src/types/index.ts

export interface JsonTreeNode {
  id: string;
  key: string;
  path: string;
  type_label: string;
  preview: string;
  children?: JsonTreeNode[];
}

export interface JsonApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AppState {
  inputText: string;      // 编辑器原始内容
  outputText: string;     // 格式化,压缩后的内容
  treeData: JsonTreeNode[]; // 解析后的树数据
  isLoading: boolean;     // 加载状态
}
```

### **5.2 Rust 数据结构**

```rust
// src-tauri/src/models/tree_node.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonTreeNode {
    pub id: String,            // 唯一标识 (使用 UUID v4)
    pub key: String,           // 节点名称 (字段名或数组索引)
    pub path: String,          // JSON Path (如 "$.data.list[0]")
    pub type_label: String,    // 类型展示 (如 "object (3)", "array [10]", "string")
    pub preview: String,       // 值预览 (字符串截断至50字符，数字全文)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<JsonTreeNode>>, // 子节点 (仅 object/array 存在)
}
```

## **6. Rust 后端设计**

### **6.1 Tauri 命令定义**

```rust
// src-tauri/src/commands/mod.rs

use serde_json::Value;
use tauri::command;

/// 格式化 JSON
#[command]
pub fn format_json(input: &str) -> Result<String, String> {
    let v: Value = serde_json::from_str(input)
        .map_err(|e| format!("解析失败: {}", e))?;
    serde_json::to_string_pretty(&v)
        .map_err(|e| format!("格式化失败: {}", e))
}

/// 压缩 JSON
#[command]
pub fn minify_json(input: &str) -> Result<String, String> {
    let v: Value = serde_json::from_str(input)
        .map_err(|e| format!("解析失败: {}", e))?;
    serde_json::to_string(&v)
        .map_err(|e| format!("压缩失败: {}", e))
}

/// 验证 JSON，返回详细错误信息
#[command]
pub fn validate_json(input: &str) -> Result<(), String> {
    serde_json::from_str::<Value>(input)
        .map(|_| ())
        .map_err(|e| format!("验证失败: {}", e))
}

/// 生成 JSON 树形结构
#[command]
pub fn json_to_tree(input: &str) -> Result<Vec<JsonTree>, String> {
    let v: Value = serde_json::from_str(input)
        .map_err(|e| format!("解析失败: {}", e))?;
    Ok(build_tree("root", &v))
}

fn build_tree(key: &str, value: &Value) -> Vec<JsonTree> {
    // 递归构建树结构的实现
    // ...
}


// 或者

// 1. 格式化 JSON
pub async fn format_json(input: &str) -> Result<String, String>

// 2. 压缩 JSON
pub async fn minify_json(input: &str) -> Result<String, String>

// 3. 验证 JSON (返回详细错误位置)
pub async fn validate_json(input: &str) -> Result<(), String>

// 4. 【核心】生成树形结构 (带递归限制)
pub async fn json_to_tree(input: &str) -> Result<Vec<JsonTreeNode>, String>
```

### **树形构建逻辑细节 (**`tree_cmds.rs`**)**

必须包含以下实现策略，以确保性能：

- 递归限制：设置最大深度 MAX_DEPTH = 100，超出深度直接返回 {...} 预览并停止递归。
- 路径传递：每次递归传递当前 JSON Path（如 [root.data](http://root.data).list[0]）。
- 预览截断：字符串值只取前 50 个字符，避免前端渲染超长文本。
- 使用 spawn_blocking：因为递归构建树是 CPU 密集型操作，使用 tokio::task::spawn_blocking 防止阻塞 Tauri 的异步 UI 线程。

### **6.2 注册命令**

```rust
// src-tauri/src/main.rs

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            format_json,
            minify_json,
            validate_json,
            json_to_tree,
        ])
        .run(tauri::generate_context!())
        .expect("启动 OxidizeText 失败");
}
```

### **6.3 Cargo.toml 依赖**

```toml
[package]
name = "com-tzih-oxidizetext"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[lib]
# The `_lib` suffix may seem redundant but it is necessary
# to make the lib name unique and wouldn't conflict with the bin name.
# This seems to be only an issue on Windows, see https://github.com/rust-lang/cargo/issues/8519
name = "com_tzih_oxidizetext_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"


# Read the optimization guideline for more details: https://tauri.app/concept/size/#cargo-configuration
[profile.release]
codegen-units = 1
lto = true
opt-level = 3
panic = "abort"
strip = true
```

## **7. Vue 前端设计**

页面布局与交互参考

1 总体布局 (App.vue)\
采用 Flex 横向布局：

左侧 (flex: 1)：EditorPane 编辑器（包含一个 或集成 Monaco Editor）。

中间：自定义 Resizer 拖动手柄（宽度 4px，鼠标悬停变蓝，可左右拖动）。

右侧 (固定宽度，默认 450px)：InspectorPanel 树形检查器。

2 核心组件：InspectorPanel (侧边栏)\
顶部：固定标题栏，包含 输入框（过滤节点）和 全部展开/折叠 按钮。

主体：使用 组件。

必须启用 virtual-scroll 以支持大型JSON（数万节点）。

自定义渲染：使用 #render-label 插槽，显示 Key、类型标签（彩色）、预览值和复制路径按钮。

节点交互：点击节点左侧箭头展开/折叠；鼠标悬停显示 📋 复制路径图标。

3 防抖优化\
在 useJson.ts 中，监听编辑器内容变化并调用 json_to_tree 时，必须包裹 useDebounce（建议 500ms 延迟），避免用户敲击键盘时频繁触发后端繁重的树解析。

### **7.1 主要组件**

#### **App.vue - 根布局**

```vue
<template>
  <div id="app">
    <Toolbar />
    <div class="main-panel">
      <EditorPane v-model="input" />
      <div class="divider" />
      <PreviewPane :content="output" :view-mode="viewMode" />
    </div>
    <StatusBar />
  </div>
</template>
```

#### **Toolbar.vue - 工具栏**

```vue
<template>
  <div class="toolbar">
    <button @click="handleOpen">📁 打开</button>
    <button @click="handleSave">💾 保存</button>
    <button @click="handleFormat">✨ 格式化</button>
    <button @click="handleMinify">📦 压缩</button>
    <button @click="handleValidate">🔍 验证</button>
    <button @click="toggleView">🌳 树形视图</button>
    <button @click="handleCopy">📋 复制</button>
    <button @click="handlePaste">📥 粘贴</button>
  </div>
</template>
```

### **7.2 组合式函数 (Composables)**

```typescript
// src/composables/useJson.ts

import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/tauri';

export function useJson() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const format = async (input: string) => {
    isLoading.value = true;
    try {
      const result = await invoke<string>('format_json', { input });
      return result;
    } catch (e) {
      error.value = e as string;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const minify = async (input: string) => {
    // 类似实现
  };

  const validate = async (input: string) => {
    try {
      await invoke('validate_json', { input });
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e as string };
    }
  };

  return { format, minify, validate, isLoading, error };
}
```

### **7.3 状态管理 (Pinia)**

```typescript
// src/stores/app.ts

import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    input: '',
    output: '',
    viewMode: 'text' as 'text' | 'tree',
    isDirty: false,
    fileName: undefined as string | undefined,
  }),
  actions: {
    setInput(content: string) {
      this.input = content;
      this.isDirty = true;
    },
    setOutput(content: string) {
      this.output = content;
    },
    toggleView() {
      this.viewMode = this.viewMode === 'text' ? 'tree' : 'text';
    },
  },
});
```

### **7.4 package.json 依赖**

```json
{
  "name": "com-tzih-oxidizetext",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "vue": "^3.5.13",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.7",
    "typescript": "~6.0.3",
    "vite": "^8.0.16",
    "vue-tsc": "^3.3.5",
    "@tauri-apps/cli": "^2"
  }
}
```

## **8. UI组件库推荐**

### **选择 Naive UI（推荐，与Vue 3搭配最佳）**

```typescript
// 安装
// npm install naive-ui

// src/main.ts
import { createApp } from 'vue';
import NaiveUI from 'naive-ui';
import App from './App.vue';

const app = createApp(App);
app.use(NaiveUI);
app.mount('#app');
```

**使用示例**：

```vue
<template>
  <n-button type="primary" @click="handleFormat">
    格式化
  </n-button>
  <n-input type="textarea" v-model:value="input" />
  <n-tree :data="treeData" />
  <n-dialog :show="dialogShow" />
</template>
```

## **9. 错误处理策略**

### **前端统一错误处理**

```typescript
// src/utils/error.ts
import { useMessage } from 'naive-ui';

export function useErrorHandler() {
  const message = useMessage();

  const handleError = (error: unknown, context?: string) => {
    const msg = error instanceof Error ? error.message : String(error);
    message.error(`${context ? context + ': ' : ''}${msg}`);
    console.error('[OxidizeText Error]', context, error);
  };

  return { handleError };
}
```

### **Rust 后端错误处理**

```rust
// 使用 anyhow 和 thiserror
#[derive(Debug, thiserror::Error)]
pub enum OxidizeTextError {
    #[error("JSON 解析错误: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),
    #[error("未知错误: {0}")]
    Unknown(String),
}

type Result<T> = std::result::Result<T, OxidizeTextError>;
```

## **10. 构建与打包**

### **开发环境**

```shellscript
# 安装依赖
npm install

# 启动开发模式（会同时启动Vite dev server和Tauri dev）
npm run tauri dev

# 或分别启动
npm run dev          # 只启动Vite
npm run tauri dev    # 启动Tauri（自动检测Vite是否已运行）
```

### **生产构建**

```shellscript
# 构建前端并打包应用
npm run tauri build

# 输出产物在 src-tauri/target/release/
# Windows: OxidizeText_0.1.0_x64_en-US.msi
# macOS: OxidizeText_0.1.0_x64.dmg
# Linux: OxidizeText_0.1.0_amd64.AppImage
```

### **Tauri 配置文件**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "com-tzih-OxidizeText",
  "version": "0.1.0",
  "identifier": "com.tzih.OxidizeText",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "com-tzih-OxidizeText",
        "width": 800,
        "height": 600
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### `rc-tauri/tauri.conf.json` **(关键权限)**

- **窗口尺寸**：默认宽 1200，高 800，最小宽 800，最小高 600。
- **权限列表**：必须开启 `fs`（读写文件）、`clipboard`（读写剪贴板）、`dialog`（打开保存对话框）的 `allowlist`。

## **11. 开发计划**

| **阶段**  | **内容**                                                                        |
| ------- | ----------------------------------------------------------------------------- |
| Phase 1 | 初始化项目 (`npm create tauri-app@latest`)，配置Vite + Vue 3 + TS。注意看，应该是已经完成了的，不需要处理 |
| Phase 2 | 编写 Rust 后端基础命令（format, minify, validate），搭建简单的输入输出界面                          |
| Phase 3 | 实现 json_to_tree 递归构建逻辑，完成侧边栏基础组件，打通 IPC 数据流。                                  |
| Phase 4 | 集成 `<n-tree>` 实现虚拟滚动，添加自定义渲染、过滤和路径复制功能。                                       |
| Phase 5 | 实现可拖动分隔条，完善状态栏信息（节点总数、JSON大小）。                                                |
| Phase 6 | 集成文件读写（打开 `.json` 文件，保存修改）。                                                   |
| Phase 7 | 错误处理、测试、打包                                                                    |
