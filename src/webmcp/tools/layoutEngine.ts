import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import type { LayoutDirection } from "../../types";
import { computeDagreLayout } from "../../layout/dagre";
import { computeElkLayout } from "../../layout/elk";

function getAnchorPoints(
  src: { x: number; y: number; width: number; height: number },
  dst: { x: number; y: number; width: number; height: number },
  direction: LayoutDirection = "TB"
): { start: [number, number]; end: [number, number] } {
  if (direction === "LR") {
    // Source right edge -> Target left edge
    return {
      start: [src.x + src.width, src.y + src.height / 2],
      end: [dst.x, dst.y + dst.height / 2],
    };
  } else if (direction === "RL") {
    return {
      start: [src.x, src.y + src.height / 2],
      end: [dst.x + dst.width, dst.y + dst.height / 2],
    };
  } else if (direction === "BT") {
    return {
      start: [src.x + src.width / 2, src.y],
      end: [dst.x + dst.width / 2, dst.y + dst.height],
    };
  } else {
    // Default TB: Source bottom edge -> Target top edge
    return {
      start: [src.x + src.width / 2, src.y + src.height],
      end: [dst.x + dst.width / 2, dst.y],
    };
  }
}

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
      const direction = input.direction || "TB";

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
          direction,
          nodeSpacing: input.nodeSpacing,
          rankSpacing: input.rankSpacing,
        });
      } else {
        layoutResult = computeDagreLayout(layoutNodes, edges, {
          direction,
          nodeSpacing: input.nodeSpacing,
          rankSpacing: input.rankSpacing,
        });
      }

      // Create new position lookup and delta map
      const nodePosMap = new Map<string, { x: number; y: number; width: number; height: number }>();
      const nodeDeltaMap = new Map<string, { dx: number; dy: number }>();

      shapes.forEach((s) => {
        const newPos = layoutResult.positions.get(s.id);
        if (newPos) {
          nodeDeltaMap.set(s.id, { dx: newPos.x - s.x, dy: newPos.y - s.y });
          nodePosMap.set(s.id, { x: newPos.x, y: newPos.y, width: s.width, height: s.height });
        } else {
          nodePosMap.set(s.id, { x: s.x, y: s.y, width: s.width, height: s.height });
        }
      });

      // Apply new coordinates to shapes, bound text elements, and arrows
      const updatedElements = allElements.map((el) => {
        if (el.isDeleted) return el;

        // 1. If shape moved:
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

        // 2. If bound text inside a moving container:
        if (el.type === "text" && (el as any).containerId) {
          const containerId = (el as any).containerId;
          const delta = nodeDeltaMap.get(containerId);
          const containerPos = nodePosMap.get(containerId);

          if (delta && containerPos) {
            // Re-center text inside moved container
            const centeredX = containerPos.x + (containerPos.width - el.width) / 2;
            const centeredY = containerPos.y + (containerPos.height - el.height) / 2;

            return {
              ...el,
              x: Math.round(centeredX),
              y: Math.round(centeredY),
              version: el.version + 1,
              updated: Date.now(),
            };
          }
        }

        // 3. If arrow connecting moved shapes:
        if (el.type === "arrow") {
          const arrow = el as any;
          const srcId = arrow.startBinding?.elementId;
          const dstId = arrow.endBinding?.elementId;

          const srcPos = srcId ? nodePosMap.get(srcId) : null;
          const dstPos = dstId ? nodePosMap.get(dstId) : null;

          if (srcPos && dstPos) {
            const anchors = getAnchorPoints(srcPos, dstPos, direction);
            const startX = Math.round(anchors.start[0]);
            const startY = Math.round(anchors.start[1]);
            const endX = Math.round(anchors.end[0]);
            const endY = Math.round(anchors.end[1]);

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            return {
              ...arrow,
              x: startX,
              y: startY,
              points: [
                [0, 0],
                [deltaX, deltaY],
              ],
              version: arrow.version + 1,
              updated: Date.now(),
            };
          }
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
