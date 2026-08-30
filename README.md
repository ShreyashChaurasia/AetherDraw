# AetherDraw

> **The Agent-Native Infinite Whiteboard for Visual Thinking powered by WebMCP**  
> *Built for the DevPost WebMCP Challenge 2026*

[![WebMCP Challenge](https://img.shields.io/badge/WebMCP-Challenge%202026-6366f1?style=for-the-badge&logo=w3c&logoColor=white)](https://webmcp.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Excalidraw](https://img.shields.io/badge/Engine-Excalidraw-6965db?style=for-the-badge)](https://github.com/excalidraw/excalidraw)

---

## Overview

Visual canvas applications (Excalidraw, Miro, FigJam) are among the most difficult interfaces for AI agents to operate:

* **Without WebMCP:** AI agents have to guess arbitrary pixel coordinates, rely on expensive screenshot vision loops, and simulate fragile mouse drag events on `<canvas>` elements that easily drift or break.
* **With WebMCP:** **AetherDraw** exposes a rich, semantic tool surface (`document.modelContext.registerTool`) directly into the browser execution runtime. AI agents gain spatial awareness, inspect scene ASTs, generate complex cloud architectures, route connections, reorganize layouts, and apply cohesive color themes with precision.

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

AetherDraw is built on top of and extends the open-source **[Excalidraw](https://github.com/excalidraw/excalidraw)** canvas engine (MIT License). We express deep gratitude to the Excalidraw team and community for building the foundation of virtual whiteboard collaboration.

AetherDraw extends Excalidraw into an **agent-native spatial environment** by introducing:
1. **W3C Web Model Context Protocol (WebMCP):** Standardized tool registration layer on `document.modelContext`.
2. **Automated Graph Layout Engines:** Integration with Dagre and ELK.js for non-overlapping, automated hierarchical layouts.
3. **Semantic Scene AST Extraction:** High-level spatial and topological introspection for AI models.
4. **Live Execution Telemetry & Inspector:** Real-time event stream monitor and interactive schema tester for developers and judges.

---

## Key Features

1. **Agent-Native WebMCP Interface:** 11 schema-typed tools registered directly to `document.modelContext` across 4 layers.
2. **Deterministic Multi-Node Generators:** Single-call generation of architectures, flowcharts, ERDs, and mindmaps with automated spatial layout.
3. **Bi-Directional Spatial Awareness:** Inspection tools (`get_canvas_state`, `find_elements`, `get_selected_elements`) allow agents to read, understand, and build upon human drawings.
4. **Intelligent Auto-Layout:** Dagre (Sugiyama layered DAG) and ELK.js (orthogonal edge routing) organize complex graphs and prevent node overlapping.
5. **Harmonious Styling & Theming:** 7 color palettes (*Hand-Drawn Classic, Nordic Frost, Cyberpunk Neon, Pastel Dream, Blueprint, Minimal Dark, Solarized*).
6. **Live Telemetry & Developer Inspector:** Built-in WebMCP schema viewer, execution parameter runner, and live latency stream.
7. **AI Copilot Drawer:** Interactive conversational assistant with optional Gemini API integration.

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
| `find_elements` | Inspection | `readOnlyHint: true` | Searches nodes by text substring, shape type, or color tags. |
| `create_diagram` | Generation | `category: generation` | Creates structured multi-node diagrams with automated layout in one shot. |
| `add_elements` | Mutation | `category: mutation` | Inserts individual shapes, text labels, and notes. |
| `update_elements` | Mutation | `category: mutation` | Updates stroke colors, fill styles, opacity, dimensions, and text. |
| `delete_elements` | Mutation | `destructiveHint: true` | Soft-deletes elements and their attached arrow bindings. |
| `connect_elements` | Mutation | `category: mutation` | Draws smart connecting arrows between node IDs. |
| `apply_auto_layout` | Layout | `category: layout` | Reorganizes coordinates using Dagre or ELK.js (TB, LR, BT, RL). |
| `apply_theme` | Styling | `category: styling` | Applies cohesive color palettes across the canvas. |
| `export_canvas` | Export | `readOnlyHint: true` | Exports high-resolution PNG or SVG image data URLs. |

---

## Tech Stack

* **Framework:** React 19 + TypeScript + Vite 6
* **Canvas Engine:** `@excalidraw/excalidraw` (v0.18.1)
* **Styling:** Tailwind CSS 4 + Lucide Icons
* **Protocol:** W3C Web Model Context Protocol (`@mcp-b/webmcp-polyfill`)
* **Layout Engines:** `@dagrejs/dagre` + `elkjs`
* **AI Provider:** Google Gemini API / Heuristic Fallback

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/ShreyashChaurasia/AetherDraw.git
cd AetherDraw
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Automated WebMCP Tests
```bash
npm run test:webmcp
```
Executes full headless browser automation testing all 11 WebMCP tools.

### 4. Build for Production
```bash
npm run build
```

---

## Project Links

* **GitHub Repository:** [github.com/ShreyashChaurasia/AetherDraw](https://github.com/ShreyashChaurasia/AetherDraw)
* **Issue Tracker:** [github.com/ShreyashChaurasia/AetherDraw/issues](https://github.com/ShreyashChaurasia/AetherDraw/issues)
* **WebMCP Hackathon:** [webmcp.devpost.com](https://webmcp.devpost.com/)
* **Original Excalidraw Engine:** [github.com/excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)

---

## License

MIT License (c) 2026 Shreyash Chaurasia
