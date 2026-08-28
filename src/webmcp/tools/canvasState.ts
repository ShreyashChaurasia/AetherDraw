import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import { extractSemanticCanvasState } from "../../lib/elementFactory";

export function createGetCanvasStateTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "get_canvas_state",
    description:
      "Returns a structured JSON representation of all elements currently on the AetherDraw canvas. " +
      "Includes shapes, text labels, arrows, connections, groups, colors, and overall canvas bounds. " +
      "Always call this first to inspect what the user has drawn before making changes.",
    inputSchema: {
      type: "object",
      properties: {
        includeDeleted: {
          type: "boolean",
          description: "Whether to include soft-deleted elements",
          default: false,
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        elementCount: { type: "number" },
        canvasBounds: {
          type: "object",
          properties: {
            minX: { type: "number" },
            minY: { type: "number" },
            maxX: { type: "number" },
            maxY: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
          },
        },
        elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
              text: { type: "string" },
              strokeColor: { type: "string" },
              backgroundColor: { type: "string" },
              connectedTo: { type: "array", items: { type: "string" } },
            },
          },
        },
        selectedElementIds: { type: "array", items: { type: "string" } },
      },
    },
    annotations: {
      readOnlyHint: true,
      category: "inspection",
    },
    async execute(input) {
      const api = getAPI();
      if (!api) {
        throw new Error("AetherDraw canvas is not yet initialized");
      }

      const elements = input?.includeDeleted
        ? api.getSceneElementsIncludingDeleted()
        : api.getSceneElements();

      const appState = api.getAppState();
      return extractSemanticCanvasState(elements, appState.selectedElementIds);
    },
  };
}

export function createGetSelectedElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "get_selected_elements",
    description:
      "Returns only the canvas elements currently selected (highlighted) by the human user. " +
      "Use this to perform context-aware operations on whatever the user is focused on.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
      category: "inspection",
    },
    async execute() {
      const api = getAPI();
      if (!api) {
        throw new Error("AetherDraw canvas is not yet initialized");
      }

      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const selectedMap = appState.selectedElementIds || {};

      const selectedElements = elements.filter((el) => selectedMap[el.id]);
      return extractSemanticCanvasState(selectedElements, selectedMap);
    },
  };
}

export function createFindElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "find_elements",
    description:
      "Search the canvas for elements matching a text query, shape type, or color. " +
      "Returns matching elements with their IDs and properties to locate specific nodes for editing.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Case-insensitive text substring to search for in node labels or text",
        },
        type: {
          type: "string",
          enum: ["rectangle", "ellipse", "diamond", "arrow", "text", "line", "frame"],
          description: "Filter by shape type",
        },
        strokeColor: {
          type: "string",
          description: "Filter by stroke color (hex)",
        },
        backgroundColor: {
          type: "string",
          description: "Filter by background fill color (hex)",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      category: "inspection",
    },
    async execute(input: { query?: string; type?: string; strokeColor?: string; backgroundColor?: string } = {}) {
      const api = getAPI();
      if (!api) {
        throw new Error("AetherDraw canvas is not yet initialized");
      }

      const elements = api.getSceneElements();
      const semanticState = extractSemanticCanvasState(elements);

      const queryLower = input.query?.toLowerCase();

      const matches = semanticState.elements.filter((el) => {
        if (input.type && el.type !== input.type) return false;
        if (input.strokeColor && el.strokeColor.toLowerCase() !== input.strokeColor.toLowerCase()) return false;
        if (input.backgroundColor && el.backgroundColor.toLowerCase() !== input.backgroundColor.toLowerCase()) return false;
        if (queryLower) {
          if (!el.text || !el.text.toLowerCase().includes(queryLower)) {
            return false;
          }
        }
        return true;
      });

      return {
        matchCount: matches.length,
        matches,
      };
    },
  };
}
