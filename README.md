# AetherDraw

> **The Agent-Native Infinite Whiteboard for Visual Thinking powered by WebMCP**  
> *Built for the DevPost WebMCP Challenge 2026*

[![WebMCP Challenge](https://img.shields.io/badge/WebMCP-Challenge%202026-6366f1?style=for-the-badge&logo=w3c&logoColor=white)](https://webmcp.devpost.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-aetherdraw.onrender.com-46E3B7?style=for-the-badge)](https://aetherdraw.onrender.com)
[![WebMCP Manifest](https://img.shields.io/badge/WebMCP%20Manifest-webmcp.json-blue?style=for-the-badge)](https://aetherdraw.onrender.com/webmcp.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Engine: Excalidraw](https://img.shields.io/badge/Engine-Excalidraw-6965db?style=for-the-badge)](https://github.com/excalidraw/excalidraw)

---

## Live Links & Quick Access

* **Live Web Application:** [https://aetherdraw.onrender.com](https://aetherdraw.onrender.com)
* **Live WebMCP Manifest:** [https://aetherdraw.onrender.com/webmcp.json](https://aetherdraw.onrender.com/webmcp.json)
* **Source Repository:** [https://github.com/ShreyashChaurasia/AetherDraw](https://github.com/ShreyashChaurasia/AetherDraw)
* **WebMCP Challenge:** [https://webmcp.devpost.com](https://webmcp.devpost.com)

---

## Overview

Visual whiteboard tools (Excalidraw, Miro, FigJam) are among the most difficult interfaces for autonomous AI agents to operate:

* **Without WebMCP:** AI models have to guess arbitrary pixel coordinates, rely on slow vision loops, and simulate fragile mouse drag events on raw HTML5 `<canvas>` elements that easily drift or break.
* **With WebMCP:** **AetherDraw** exposes a structured, semantic tool surface (`document.modelContext.registerTool`) directly into the browser runtime. AI agents gain spatial awareness, inspect scene ASTs, generate complex cloud architectures, route smart Bezier arrows, reorganize layouts, and apply cohesive color themes with deterministic precision.

```
+------------------------------------------------------------------------+
|                          AetherDraw Canvas                             |
|                                                                        |
|   [Human Draws]                                                        |
|   +--------------+         [Agent Adds & Connects via WebMCP]          |
|   | Client App   |-------> +--------------+      +-----------------+   |
|   +--------------+         | API Gateway  |----->| Redis Cache     |   |
|                            +------+-------+      +-----------------+   |
|                                   |                                    |
|                                   v                                    |
|                            +--------------+      +-----------------+   |
|                            | Auth Service |----->| PostgreSQL (DB) |   |
|                            +--------------+      +-----------------+   |
+------------------------------------------------------------------------+
```

---

## Attribution & Technology Foundation

AetherDraw is built on top of and extends the open-source **[Excalidraw](https://github.com/excalidraw/excalidraw)** canvas engine (MIT License). We express deep gratitude to the Excalidraw team and community for building the gold standard of collaborative virtual whiteboards.

AetherDraw extends Excalidraw into an **agent-native spatial environment** by introducing:
1. **W3C Web Model Context Protocol (WebMCP):** Standardized tool registration layer on `document.modelContext`.
2. **Automated Graph Layout Engines:** Dagre (Sugiyama hierarchical DAG) and ELK.js (orthogonal routing) for non-overlapping, automated graph layouts.
3. **Semantic Scene AST Extraction:** High-level spatial and topological introspection for AI models.
4. **Live Execution Telemetry & Inspector:** Real-time event stream monitor and interactive schema runner for developers and judges.
5. **Autosave Canvas Persistence:** Debounced session persistence across page refreshes and browser restarts.

---

## Key Features

1. **Agent-Native WebMCP Interface:** 11 schema-typed tools registered directly to `document.modelContext` across 4 distinct functional layers.
2. **One-Shot Diagram Generation:** Single-call generation of cloud architectures, flowcharts, ERDs, and mindmaps with automated spatial layout.
3. **Dynamic Screen-Fit Zoom:** Automatically calculates viewport dimensions and positions diagrams to fill the screen cleanly with toolbar clearance.
4. **Bi-Directional Spatial Awareness:** Inspection tools (`get_canvas_state`, `find_elements`, `get_selected_elements`) allow agents to read, understand, and build upon human drawings.
5. **Smart Arrow Routing & Obstacle Avoidance:** Organic cubic Bezier curves and outer-gutter feedback loops eliminate line crossings.
6. **Harmonious Styling & Theming:** 7 color palettes (*Classic, Nordic Frost, Cyberpunk Neon, Pastel Dream, Blueprint, Minimal Dark, Solarized*).
7. **Session Persistence:** Canvas elements, viewport zoom, pan coordinates, and theme settings persist across browser reloads via debounced storage.
8. **Developer Inspector & Live Telemetry:** Built-in drawer with live execution logs, millisecond latency metrics, and interactive tool invocation forms.
9. **Built-in AI Copilot:** Interactive conversational assistant with optional Google Gemini API support or local heuristic execution.

---

## WebMCP Tool Suite Architecture

```
                  +---------------------------------+
                  |     document.modelContext       |
                  +----------------+----------------+
                                   |
         +-------------------------+-------------------------+
         v                         v                         v
+------------------+      +------------------+      +------------------+
| Layer A: State   |      | Layer B/C: Make  |      | Layer D: Layout  |
| ---------------- |      | ---------------- |      | ---------------- |
| get_canvas_state |      | create_diagram   |      | apply_auto_layout|
| find_elements    |      | add_elements     |      | apply_theme      |
| get_selected_el  |      | update_elements  |      | export_canvas    |
|                  |      | delete_elements  |      |                  |
|                  |      | connect_elements |      |                  |
+------------------+      +------------------+      +------------------+
```

### Complete Tool Registry (11 Tools)

| Tool Name | Category | Annotations | Description |
|---|---|---|---|
| `get_canvas_state` | Inspection | `readOnlyHint: true` | Serializes active scene to structured semantic AST with bounds and connections. |
| `get_selected_elements` | Inspection | `readOnlyHint: true` | Returns elements currently highlighted by the user for context-aware actions. |
| `find_elements` | Inspection | `readOnlyHint: true` | Searches nodes by text substring, shape type, or category tags. |
| `create_diagram` | Generation | `category: generation` | Creates structured multi-node diagrams with automated layout in one shot. |
| `add_elements` | Mutation | `category: mutation` | Inserts individual shapes, text labels, and sticky notes. |
| `update_elements` | Mutation | `category: mutation` | Updates stroke colors, fill styles, opacity, dimensions, and text. |
| `delete_elements` | Mutation | `destructiveHint: true` | Soft-deletes elements and their attached arrow bindings. |
| `connect_elements` | Mutation | `category: mutation` | Draws smart connecting arrows with Bezier routes between node IDs. |
| `apply_auto_layout` | Layout | `category: layout` | Reorganizes coordinates using Dagre or ELK.js (TB, LR, BT, RL). |
| `apply_theme` | Styling | `category: styling` | Applies cohesive color palettes across the canvas elements. |
| `export_canvas` | Export | `readOnlyHint: true` | Exports high-resolution PNG or SVG image data URLs. |

---

## How to Test with WebMCP (Developer & Judge Guide)

You can test AetherDraw directly in Google Chrome or any browser supporting WebMCP.

### Method 1: Interactive Browser DevTools Console

1. Navigate to **[https://aetherdraw.onrender.com](https://aetherdraw.onrender.com)**.
2. Open DevTools (`F12` or `Ctrl + Shift + I` / `Cmd + Option + I`) and switch to the **Console** tab.
3. Verify tool registration:
   ```javascript
   const tools = await document.modelContext.getTools();
   console.log("Registered tools count:", tools.length);
   console.log("Tool names:", tools.map(t => t.name));
   ```
4. Generate an architecture diagram programmatically:
   ```javascript
   await document.modelContext.executeTool("create_diagram", {
     title: "AI Inference Pipeline",
     layoutDirection: "LR",
     theme: "nord",
     nodes: [
       { id: "client", label: "Web Client", shape: "rectangle", category: "entry" },
       { id: "gateway", label: "API Gateway", shape: "rectangle", category: "gateway" },
       { id: "redis", label: "Session Cache", shape: "database", category: "cache" },
       { id: "vector", label: "Vector DB / RAG", shape: "database", category: "storage" },
       { id: "worker", label: "LLM Worker", shape: "rectangle", category: "compute" }
     ],
     connections: [
       { from: "client", to: "gateway", label: "POST /chat" },
       { from: "gateway", to: "redis", label: "Read Session" },
       { from: "gateway", to: "vector", label: "Vector Search" },
       { from: "gateway", to: "worker", label: "Forward Prompt" },
       { from: "worker", to: "client", label: "Stream Tokens", style: "dashed" }
     ]
   });
   ```
5. Inspect the canvas AST state:
   ```javascript
   const state = await document.modelContext.executeTool("get_canvas_state", { summaryOnly: false });
   console.log("Canvas AST:", state);
   ```
6. Reorganize layout or change theme:
   ```javascript
   await document.modelContext.executeTool("apply_theme", { theme: "cyberpunk" });
   await document.modelContext.executeTool("apply_auto_layout", { direction: "TB" });
   ```

### Method 2: In-App Inspector & Telemetry Drawer

Click the **Inspector** button in the bottom right corner of the application:
* View registered tool schemas and property definitions.
* Trigger tools with custom JSON inputs directly inside the UI.
* Watch real-time execution events, latency metrics, and success status.

---

## Project Structure

```
AetherDraw/
|-- public/
|   |-- excalidraw-assets/         # Fonts and vendor canvas assets
|   |-- favicon.svg                # Application icon
|   `-- webmcp.json                # Static WebMCP manifest declaration
|-- src/
|   |-- components/
|   |   |-- Canvas/
|   |   |   `-- ExcalidrawCanvas.tsx  # Core Excalidraw canvas host with persistence hooks
|   |   |-- Copilot/
|   |   |   `-- CopilotPanel.tsx      # Natural language AI copilot drawer
|   |   |-- Inspector/
|   |   |   |-- ToolInspector.tsx     # WebMCP interactive tool runner
|   |   |   `-- ToolLog.tsx           # Real-time telemetry event stream
|   |   `-- UI/
|   |       |-- AboutModal.tsx        # Project about and documentation modal
|   |       |-- BottomDock.tsx        # Floating bottom control bar
|   |       |-- Sidebar.tsx           # Navigation drawer
|   |       |-- Toast.tsx             # System notifications
|   |       `-- TopNav.tsx            # Floating top options bar (Templates, Themes, Layout)
|   |-- layout/
|   |   |-- dagre.ts                  # Dagre hierarchical layout computation
|   |   |-- elk.ts                    # ELK.js orthogonal layout computation
|   |   |-- router.ts                 # Collision avoidance and Bezier arrow router
|   |   `-- types.ts                  # Layout interfaces and coordinate models
|   |-- lib/
|   |   |-- canvasUtils.ts            # Viewport fit-screen zoom and camera centering
|   |   |-- constants.ts              # Shape dimensions, fonts, and layout defaults
|   |   |-- elementFactory.ts         # Excalidraw element skeleton builder
|   |   |-- idGenerator.ts            # Unique element identifier generator
|   |   `-- storage.ts                # Debounced localStorage session persistence
|   |-- templates/
|   |   `-- catalog.ts                # Pre-built templates (Microservices, ERD, CI/CD, etc.)
|   |-- themes/
|   |   `-- palettes.ts               # 7 color palettes (Nord, Cyberpunk, Pastel, etc.)
|   |-- webmcp/
|   |   |-- events.ts                 # WebMCP event bus and telemetry logger
|   |   |-- polyfill.ts               # W3C document.modelContext bridge and fallback
|   |   |-- registry.ts               # Tool registry and dispatcher
|   |   |-- types.ts                  # Tool definitions and schema types
|   |   `-- tools/                    # 11 Granular WebMCP tool implementations
|   |       |-- canvasState.ts        # get_canvas_state, get_selected_elements, find_elements
|   |       |-- connectionManager.ts  # connect_elements
|   |       |-- diagramGenerator.ts   # create_diagram
|   |       |-- elementMutation.ts    # add_elements, update_elements, delete_elements
|   |       |-- exportManager.ts      # export_canvas
|   |       |-- layoutEngine.ts       # apply_auto_layout
|   |       `-- themeManager.ts       # apply_theme
|   |-- App.tsx                       # Main application coordinator
|   |-- index.css                     # Tailwind CSS and theme styles
|   `-- main.tsx                      # Vite React entry point
|-- scripts/
|   |-- generate-webmcp-manifest.mjs  # Generates public/webmcp.json
|   |-- patch-excalidraw-links.mjs    # Postinstall link customizer
|   `-- test-webmcp.mjs               # Automated headless E2E test suite
|-- package.json
|-- tsconfig.json
|-- render.yaml                       # Production Render deployment config
`-- vite.config.ts                    # Vite build configuration
```

---

## Tech Stack

* **Framework:** React 19 + TypeScript 5 + Vite 6
* **Canvas Engine:** `@excalidraw/excalidraw` (v0.18.1)
* **Styling:** Tailwind CSS 4 + Lucide Icons
* **Protocol:** W3C Web Model Context Protocol (`@mcp-b/webmcp-polyfill`)
* **Layout Engines:** `@dagrejs/dagre` + `elkjs`
* **AI Provider:** Google Gemini API / Heuristic Fallback
* **Hosting:** Render (`https://aetherdraw.onrender.com`)

---

## Getting Started Locally

### 1. Clone & Install
```bash
git clone https://github.com/ShreyashChaurasia/AetherDraw.git
cd AetherDraw
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Automated WebMCP Tests
```bash
npm run test:webmcp
```
Executes full headless browser automation validating all 11 WebMCP tools.

### 4. Production Build
```bash
npm run build
```

---

## Project Links

* **Live Deployment:** [https://aetherdraw.onrender.com](https://aetherdraw.onrender.com)
* **GitHub Repository:** [https://github.com/ShreyashChaurasia/AetherDraw](https://github.com/ShreyashChaurasia/AetherDraw)
* **Issue Tracker:** [https://github.com/ShreyashChaurasia/AetherDraw/issues](https://github.com/ShreyashChaurasia/AetherDraw/issues)
* **Excalidraw Canvas Engine:** [https://github.com/excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)

---

## License

MIT License (c) 2026 Shreyash Chaurasia
