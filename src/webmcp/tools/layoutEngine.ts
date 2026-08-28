import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import type { LayoutDirection } from "../../types";
import { computeDagreLayout } from "../../layout/dagre";
import { computeElkLayout } from "../../layout/elk";

export function createApplyAutoLayoutTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "apply_auto_layout",
    description:
      "Reorganizes the spatial coordinates of elements on the canvas using Dagre or ELK graph layout algorithms. " +
      "Eliminates messy overlaps and creates clean, structured hierarchical layouts.",
    inputSchema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["TB", "LR", "BT", "RL"],
          description: "Flow direction: TB=top-to-bottom, LR=left-to-right",
          default: "TB",
        },
        engine: {
          type: "string",
          enum: ["dagre", "elk"],
          description: "Layout engine: dagre (fast, simple DAG) or elk (advanced orthogonal routing)",
          default: "dagre",
        },
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional subset of element IDs to layout. If omitted, layouts all shapes.",
        },
        nodeSpacing: {
          type: "number",
          default: 60,
          description: "Horizontal/vertical spacing between adjacent nodes in px",
        },
        rankSpacing: {
          type: "number",
          default: 80,
          description: "Spacing between successive hierarchy ranks in px",
        },
      },
    },
    annotations: {
      category: "layout",
    },
    async execute(
      input: {
        direction?: LayoutDirection;
        engine?: "dagre" | "elk";
        elementIds?: string[];
        nodeSpacing?: number;
        rankSpacing?: number;
      } = {}
    ) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const allElements = api.getSceneElements();
      const targetIds = input.elementIds ? new Set(input.elementIds) : null;

      // Extract shapes (nodes)
      const shapes = allElements.filter((el) => {
        if (el.isDeleted || el.type === "arrow" || el.type === "line") return false;
        if (el.type === "text" && (el as any).containerId) return false;
        if (targetIds && !targetIds.has(el.id)) return false;
        return true;
      });

      if (shapes.length === 0) {
        return { success: false, message: "No shape elements found to layout" };
      }

      // Extract arrows (edges) connecting these shapes
      const shapeIdSet = new Set(shapes.map((s) => s.id));
      const edges: { source: string; target: string }[] = [];

      allElements.forEach((el) => {
        if (el.type === "arrow" && !el.isDeleted) {
          const arrow = el as any;
          const src = arrow.startBinding?.elementId;
          const dst = arrow.endBinding?.elementId;
          if (src && dst && shapeIdSet.has(src) && shapeIdSet.has(dst)) {
            edges.push({ source: src, target: dst });
          }
        }
      });

      const layoutNodes = shapes.map((s) => ({
        id: s.id,
        width: s.width,
        height: s.height,
      }));

      let layoutResult;
      if (input.engine === "elk") {
        layoutResult = await computeElkLayout(layoutNodes, edges, {
          direction: input.direction || "TB",
          nodeSpacing: input.nodeSpacing,
          rankSpacing: input.rankSpacing,
        });
      } else {
        layoutResult = computeDagreLayout(layoutNodes, edges, {
          direction: input.direction || "TB",
          nodeSpacing: input.nodeSpacing,
          rankSpacing: input.rankSpacing,
        });
      }

      // Apply new coordinates
      const updatedElements = allElements.map((el) => {
        const newPos = layoutResult.positions.get(el.id);
        if (newPos) {
          return {
            ...el,
            x: newPos.x,
            y: newPos.y,
            version: el.version + 1,
            updated: Date.now(),
          };
        }
        return el;
      });

      api.updateScene({ elements: updatedElements });
      api.scrollToContent(shapes, { fitToViewport: true, animate: true, duration: 400 });

      return {
        success: true,
        engineUsed: input.engine || "dagre",
        laidOutNodeCount: shapes.length,
        edgesCount: edges.length,
      };
    },
  };
}
