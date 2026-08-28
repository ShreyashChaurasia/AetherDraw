import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import type { ThemeName } from "../../types";
import { getTheme } from "../../themes/palettes";

export function createApplyThemeTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "apply_theme",
    description:
      "Applies a cohesive color palette across the canvas. Available themes: default, nord, cyberpunk, pastel, blueprint, minimal_dark, solarized.",
    inputSchema: {
      type: "object",
      properties: {
        theme: {
          type: "string",
          enum: ["default", "nord", "cyberpunk", "pastel", "blueprint", "minimal_dark", "solarized"],
          description: "Named color theme to apply",
        },
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of element IDs to theme. If omitted, applies theme across all elements.",
        },
      },
      required: ["theme"],
    },
    annotations: {
      category: "styling",
    },
    async execute(input: { theme: ThemeName; elementIds?: string[] }) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const theme = getTheme(input.theme);
      const targetIds = input.elementIds ? new Set(input.elementIds) : null;
      const elements = api.getSceneElements();

      let nodeIdx = 0;
      const updatedElements = elements.map((el) => {
        if (el.isDeleted) return el;
        if (targetIds && !targetIds.has(el.id)) return el;

        if (el.type === "arrow" || el.type === "line") {
          return {
            ...el,
            strokeColor: theme.arrowColor,
            roughness: theme.roughness,
            version: el.version + 1,
            updated: Date.now(),
          };
        }

        if (el.type === "text") {
          return {
            ...el,
            strokeColor: theme.textColor,
            version: el.version + 1,
            updated: Date.now(),
          };
        }

        const strokeColor = theme.nodeStrokes[nodeIdx % theme.nodeStrokes.length];
        const backgroundColor = theme.nodeFills[nodeIdx % theme.nodeFills.length];
        nodeIdx++;

        return {
          ...el,
          strokeColor,
          backgroundColor,
          fillStyle: theme.fillStyle,
          roughness: theme.roughness,
          version: el.version + 1,
          updated: Date.now(),
        };
      });

      api.updateScene({
        elements: updatedElements,
        appState: {
          viewBackgroundColor: theme.canvasBackground,
        },
      });

      return {
        success: true,
        appliedTheme: theme.name,
        updatedElementsCount: updatedElements.length,
      };
    },
  };
}
