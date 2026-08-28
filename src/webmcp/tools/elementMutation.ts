import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import { generateElementId } from "../../lib/idGenerator";
import { mapShapeTypeToExcalidraw, getDimensionsForShape } from "../../lib/elementFactory";
import { EXCALIDRAW_FONTS } from "../../lib/constants";

export function createAddElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "add_elements",
    description:
      "Adds one or more individual shapes (rectangles, diamonds, ellipses, text) or sticky notes to the canvas. " +
      "Returns the created element IDs for subsequent connections or updates.",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Optional custom ID. Auto-generated if omitted." },
              type: {
                type: "string",
                enum: ["rectangle", "ellipse", "diamond", "text"],
                default: "rectangle",
              },
              label: { type: "string", description: "Text content inside the shape or label" },
              x: { type: "number", description: "X coordinate on canvas (default: 200)" },
              y: { type: "number", description: "Y coordinate on canvas (default: 200)" },
              width: { type: "number", description: "Width in pixels" },
              height: { type: "number", description: "Height in pixels" },
              strokeColor: { type: "string", default: "#1e293b" },
              backgroundColor: { type: "string", default: "#f8fafc" },
              fillStyle: {
                type: "string",
                enum: ["solid", "hachure", "cross-hatch", "zigzag"],
                default: "solid",
              },
            },
            required: ["label"],
          },
        },
      },
      required: ["elements"],
    },
    annotations: {
      category: "mutation",
    },
    async execute(input: { elements: any[] }) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const currentElements = api.getSceneElements();
      const skeletons: any[] = [];
      const createdIds: string[] = [];

      input.elements.forEach((item, idx) => {
        const id = item.id || generateElementId("node");
        createdIds.push(id);

        const dims = getDimensionsForShape(item.type);
        const x = item.x ?? 100 + idx * 220;
        const y = item.y ?? 100;
        const width = item.width || dims.width;
        const height = item.height || dims.height;

        if (item.type === "text") {
          skeletons.push({
            id,
            type: "text",
            x,
            y,
            text: item.label,
            fontSize: 20,
            fontFamily: EXCALIDRAW_FONTS.NORMAL,
            strokeColor: item.strokeColor || "#0f172a",
          });
        } else {
          skeletons.push({
            id,
            type: mapShapeTypeToExcalidraw(item.type),
            x,
            y,
            width,
            height,
            strokeColor: item.strokeColor || "#1e293b",
            backgroundColor: item.backgroundColor || "#f8fafc",
            fillStyle: item.fillStyle || "solid",
            roundness: { type: 2 },
            roughness: 1,
            label: {
              text: item.label,
              fontSize: 16,
              fontFamily: EXCALIDRAW_FONTS.NORMAL,
            },
          });
        }
      });

      const converted = convertToExcalidrawElements(skeletons, { regenerateIds: false });
      api.updateScene({
        elements: [...currentElements, ...converted],
      });

      return {
        success: true,
        createdCount: converted.length,
        createdIds,
      };
    },
  };
}

export function createUpdateElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "update_elements",
    description:
      "Modifies visual properties (strokeColor, backgroundColor, fillStyle, strokeWidth, opacity, label) of existing elements. " +
      "Use find_elements or get_canvas_state first to locate the element IDs to modify.",
    inputSchema: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Target element ID to update" },
              label: { type: "string", description: "Updated text content" },
              strokeColor: { type: "string" },
              backgroundColor: { type: "string" },
              fillStyle: { type: "string", enum: ["solid", "hachure", "cross-hatch", "zigzag"] },
              strokeWidth: { type: "number", enum: [1, 2, 4] },
              strokeStyle: { type: "string", enum: ["solid", "dashed", "dotted"] },
              opacity: { type: "number", minimum: 0, maximum: 100 },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["id"],
          },
        },
      },
      required: ["updates"],
    },
    annotations: {
      category: "mutation",
    },
    async execute(input: { updates: any[] }) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const elements = [...api.getSceneElements()];
      const updateMap = new Map(input.updates.map((u) => [u.id, u]));
      let modifiedCount = 0;

      const updatedElements = elements.map((el) => {
        const update = updateMap.get(el.id);
        if (!update) return el;

        modifiedCount++;
        const next: any = { ...el, version: el.version + 1, updated: Date.now() };

        if (update.strokeColor !== undefined) next.strokeColor = update.strokeColor;
        if (update.backgroundColor !== undefined) next.backgroundColor = update.backgroundColor;
        if (update.fillStyle !== undefined) next.fillStyle = update.fillStyle;
        if (update.strokeWidth !== undefined) next.strokeWidth = update.strokeWidth;
        if (update.strokeStyle !== undefined) next.strokeStyle = update.strokeStyle;
        if (update.opacity !== undefined) next.opacity = update.opacity;
        if (update.x !== undefined) next.x = update.x;
        if (update.y !== undefined) next.y = update.y;
        if (update.width !== undefined) next.width = update.width;
        if (update.height !== undefined) next.height = update.height;

        return next;
      });

      api.updateScene({ elements: updatedElements });

      return {
        success: true,
        updatedCount: modifiedCount,
      };
    },
  };
}

export function createDeleteElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "delete_elements",
    description:
      "Removes one or more elements and their attached arrow connections from the canvas by element ID.",
    inputSchema: {
      type: "object",
      properties: {
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "List of element IDs to delete",
        },
      },
      required: ["elementIds"],
    },
    annotations: {
      destructiveHint: true,
      requiresConfirmation: true,
      category: "mutation",
    },
    async execute(input: { elementIds: string[] }) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const deleteSet = new Set(input.elementIds);
      const elements = api.getSceneElements();

      // Soft delete in Excalidraw
      const updatedElements = elements.map((el) => {
        if (deleteSet.has(el.id)) {
          return { ...el, isDeleted: true, updated: Date.now() };
        }
        // Also delete arrows bound to deleted elements
        if (el.type === "arrow") {
          const arrow = el as any;
          if (deleteSet.has(arrow.startBinding?.elementId) || deleteSet.has(arrow.endBinding?.elementId)) {
            return { ...el, isDeleted: true, updated: Date.now() };
          }
        }
        return el;
      });

      api.updateScene({ elements: updatedElements });

      return {
        success: true,
        deletedCount: input.elementIds.length,
      };
    },
  };
}
