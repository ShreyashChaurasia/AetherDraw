import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import { generateElementId } from "../../lib/idGenerator";
import { EXCALIDRAW_FONTS } from "../../lib/constants";

export function createConnectElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "connect_elements",
    description:
      "Draws smart connecting arrows between existing element IDs with automatic anchor attachment.",
    inputSchema: {
      type: "object",
      properties: {
        connections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fromId: { type: "string", description: "Source element ID" },
              toId: { type: "string", description: "Target element ID" },
              label: { type: "string", description: "Optional text label on the arrow" },
              strokeStyle: { type: "string", enum: ["solid", "dashed", "dotted"], default: "solid" },
              strokeColor: { type: "string", default: "#475569" },
              startArrowhead: { type: "string", enum: ["arrow", "bar", "dot", "triangle", "none"], default: "none" },
              endArrowhead: { type: "string", enum: ["arrow", "bar", "dot", "triangle", "none"], default: "arrow" },
            },
            required: ["fromId", "toId"],
          },
        },
      },
      required: ["connections"],
    },
    annotations: {
      category: "mutation",
    },
    async execute(input: { connections: any[] }) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const elements = api.getSceneElements();
      const elementMap = new Map(elements.map((el) => [el.id, el]));

      const skeletons: any[] = [];

      for (const conn of input.connections) {
        const fromEl = elementMap.get(conn.fromId);
        const toEl = elementMap.get(conn.toId);

        if (!fromEl || !toEl) {
          throw new Error(
            `Cannot connect elements: fromId '${conn.fromId}' (${!!fromEl}) or toId '${conn.toId}' (${!!toEl}) not found`
          );
        }

        skeletons.push({
          id: generateElementId("arrow"),
          type: "arrow",
          strokeColor: conn.strokeColor || "#475569",
          strokeWidth: 2,
          strokeStyle: conn.strokeStyle || "solid",
          roughness: 1,
          start: { id: conn.fromId },
          end: { id: conn.toId },
          startArrowhead: conn.startArrowhead && conn.startArrowhead !== "none" ? conn.startArrowhead : null,
          endArrowhead: conn.endArrowhead && conn.endArrowhead !== "none" ? conn.endArrowhead : "arrow",
          ...(conn.label
            ? {
                label: {
                  text: conn.label,
                  fontSize: 13,
                  fontFamily: EXCALIDRAW_FONTS.NORMAL,
                },
              }
            : {}),
        });
      }

      const arrows = convertToExcalidrawElements(skeletons, { regenerateIds: false });
      api.updateScene({ elements: [...elements, ...arrows] });

      return {
        success: true,
        connectedCount: arrows.length,
      };
    },
  };
}
