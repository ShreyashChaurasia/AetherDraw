# AetherDraw

> **The Agent-Native Infinite Whiteboard for Visual Thinking powered by WebMCP**  
> *Built for the DevPost WebMCP Challenge 2026*

[![WebMCP Challenge](https://img.shields.io/badge/WebMCP-Challenge%202026-6366f1?style=for-the-badge&logo=w3c&logoColor=white)](https://webmcp.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Excalidraw](https://img.shields.io/badge/Engine-Excalidraw-6965db?style=for-the-badge)](https://excalidraw.com/)

---

## Overview

Visual canvas applications (Excalidraw, Miro, FigJam) are among the most difficult interfaces for AI agents to operate:

* **Without WebMCP:** AI agents have to guess arbitrary pixel coordinates, rely on expensive screenshot vision loops, and simulate fragile mouse drag events on `<canvas>` elements that easily drift or break.
* **With WebMCP:** **AetherDraw** exposes a rich, semantic tool surface (`navigator.modelContext.registerTool`) directly into the browser execution runtime. AI agents gain spatial awareness, inspect scene ASTs, generate complex cloud architectures, route connections, reorganize layouts, and apply cohesive color themes with precision.

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

## Key Features

- **Agent-Native Spatial Awareness:** The AI does not see blurry pixels; it reads structured canvas elements (`id`, `type`, `x`, `y`, `width`, `height`, `text`, `boundElements`).
- **Full WebMCP Standard Compliance:** Implements the W3C Web Machine Learning Community Group Draft standard via `navigator.modelContext` / `document.modelContext` with comprehensive fallback polyfills.
- **In-Browser Auto-Layout Engine:** Powered by Dagre/Elk algorithms to automatically calculate balanced coordinates, eliminating node collisions and messy overlaps.
- **One-Click Diagram Generators:** High-level schemas for instant Cloud Architectures, Flowcharts, Mindmaps, Sequence Diagrams, ERDs, and User Journeys.
- **Fine-Grained Element Manipulation:** Create, update, style, connect, group, and delete canvas objects with precision.
- **Integrated In-Canvas AI Copilot:** Interactive chat drawer to converse with LLMs that execute WebMCP tools in real-time.
- **Live WebMCP Inspector:** Visual inspector displaying registered tools, schema definitions, live execution logs, and manual test triggers for judges and developers.
- **Adaptive Color Theming:** Built-in color palettes including *Hand-Drawn Classic, Nordic Frost, Cyberpunk Neon, Minimal Dark, Pastel Dream, and Blueprint*.

---

## WebMCP Tool Suite Architecture

AetherDraw exposes an extensive tool hierarchy organized into 4 functional layers:

```
                  +---------------------------------+
                  |       WebMCP Tool Suite         |
                  +----------------+----------------+
         +-------------------------+-------------------------+
         v                         v                         v
+------------------+      +------------------+      +------------------+
|  State & Vision  |      | Shape & Connect  |      | Layout & Styling |
| ---------------- |      | ---------------- |      | ---------------- |
| get_canvas_state |      | create_diagram   |      | apply_auto_layout|
| find_elements    |      | add_shape / text |      | set_theme_colors |
| get_selection    |      | connect_elements |      | group_elements   |
+------------------+      +------------------+      +------------------+
```

### Layer A: Spatial & State Inspection
* `get_canvas_state`: Returns the semantic tree of active elements on the canvas (bounds, text, hierarchy, connectors).
* `get_selected_elements`: Retrieves currently selected elements for context-aware contextual edits.
* `find_elements`: Queries elements by text query, shape type, or color tags.

### Layer B: High-Level Diagram Generators
* `create_diagram`: Generates full structured diagrams in a single pass with automatic node layout and arrow bindings.

### Layer C: Fine-Grained Canvas Mutation
* `add_elements`: Adds shapes (rectangles, diamonds, ellipses, cylinders, clouds), text labels, and sticky notes.
* `connect_elements`: Creates smart bidirectional arrows with automatic anchor binding between nodes.
* `update_elements`: Modifies colors, stroke styles, opacity, fill patterns (`hachure`, `solid`, `cross-hatch`), and text content.
* `delete_elements`: Removes specific nodes or connections.

### Layer D: Layout & Aesthetics Optimization
* `apply_auto_layout`: Organizes diagram nodes using directed graph layout algorithms (Left-to-Right or Top-to-Bottom).
* `apply_theme`: Applies curated color themes across selected or entire canvas elements.
* `export_canvas`: Exports high-resolution SVG or PNG data URLs.

---

## Hackathon Alignment (DevPost WebMCP Challenge)

| Judging Criterion | How AetherDraw Excels |
| :--- | :--- |
| **WebMCP Leverage (25%)** | Provides granular and high-level tools replacing fragile vision loops with reliable AST manipulations. Demonstrates why WebMCP is the future of web agents. |
| **Execution (25%)** | Built on top of a rock-solid canvas engine with silky 60fps rendering, pan/zoom, undo/redo, responsive UI, and zero-latency tool execution. |
| **Potential Impact (25%)** | System design, technical architecture, and brainstorming are universal needs. Conversational diagramming saves hours of manual dragging and formatting. |
| **Creativity & Ambition (25%)** | Solves the "LLM spatial coordination problem" by combining LLM semantic reasoning with in-browser algorithmic layout calculations via WebMCP. |

---

## Tech Stack

- **Framework:** Next.js / Vite + React 19 (TypeScript)
- **Canvas Engine:** `@excalidraw/excalidraw`
- **Layout & Graph Computations:** `dagre` / `elkjs`
- **WebMCP Integration:** `navigator.modelContext` + Custom Browser Polyfill & Bridge
- **Styling & UI:** Tailwind CSS, Lucide Icons, Radix UI / Framer Motion
- **AI Tool Execution:** Multi-provider support (Gemini, OpenAI, Anthropic, WebLLM)

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm / pnpm / yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/ShreyashChaurasia/AetherDraw.git
cd AetherDraw

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## License

This project is licensed under the [MIT License](LICENSE).
