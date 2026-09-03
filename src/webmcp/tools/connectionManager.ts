import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import { generateElementId } from "../../lib/idGenerator";
import { EXCALIDRAW_FONTS } from "../../lib/constants";
import { computeSmartRoutes, type NodeRect, type EdgeSpec } from "../../layout/router";

function resolveElement(query: string, elements: readonly any[]): any | null {
  if (!query) return null;
  const qClean = query.trim().toLowerCase();
  const qNorm = qClean.replace(/[-_\s]+/g, "");

  // 1. Direct ID match
  const direct = elements.find((el) => !el.isDeleted && el.id === query);
  if (direct) return direct;

  // 2. Exact or normalized text match
  const activeElements = elements.filter((el) => !el.isDeleted);
  const textElements = activeElements.filter((el) => el.type === "text" && el.text);

  for (const tEl of textElements) {
    const tClean = (tEl.text || "").trim().toLowerCase();
    const tNorm = tClean.replace(/[-_\s]+/g, "");
    if (tClean === qClean || tNorm === qNorm || tClean.includes(qClean) || qClean.includes(tClean)) {
      // If bound to a container, return container
      if (tEl.containerId) {
        const container = activeElements.find((el) => el.id === tEl.containerId);
        if (container) return container;
      }
      // If a shape physically encloses or is immediately near this text, prefer the shape
      const containingShape = activeElements.find((el) => {
        if (el.type === "text" || el.type === "arrow" || el.type === "line") return false;
        const tCenterX = tEl.x + tEl.width / 2;
        const tCenterY = tEl.y + tEl.height / 2;
        return (
          tCenterX >= el.x - 40 &&
          tCenterX <= el.x + el.width + 40 &&
          tCenterY >= el.y - 60 &&
          tCenterY <= el.y + el.height + 60
        );
      });
      if (containingShape) return containingShape;
      return tEl;
    }
  }

  // 3. Fallback: match any shape whose customData or role matches
  for (const el of activeElements) {
    if (el.customData?.role) {
      const role = String(el.customData.role).toLowerCase();
      if (role === qClean || role.includes(qClean)) return el;
    }
  }

  return null;
}

export function createConnectElementsTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "connect_elements",
    description:
      "Draws smart connecting arrows between existing elements by ID or text label with automatic anchor attachment and smooth Bezier curve routing.",
    inputSchema: {
      type: "object",
      properties: {
        connections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fromId: { type: "string", description: "Source element ID or label (e.g. 'gateway', 'API Gateway')" },
              toId: { type: "string", description: "Target element ID or label (e.g. 'auth_service', 'Auth Service')" },
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

      const nodeRects: NodeRect[] = [];
      const edgeSpecs: EdgeSpec[] = [];
      const skeletons: any[] = [];

      for (const el of elements) {
        if (!el.isDeleted && el.type !== "arrow" && el.type !== "line") {
          nodeRects.push({
            id: el.id,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          });
        }
      }

      for (const conn of input.connections) {
        const fromEl = resolveElement(conn.fromId, elements);
        const toEl = resolveElement(conn.toId, elements);

        if (!fromEl || !toEl) {
          const available = elements
            .filter((el) => !el.isDeleted && (el.type === "rectangle" || el.type === "diamond" || el.type === "ellipse" || el.type === "text"))
            .map((el) => (el as any).text || el.id)
            .slice(0, 10);
          throw new Error(
            `Cannot connect elements: fromId '${conn.fromId}' (${!!fromEl}) or toId '${conn.toId}' (${!!toEl}) not found. ` +
            `Make sure both nodes exist on the canvas. Available elements: [${available.join(", ")}]`
          );
        }

        const edgeId = generateElementId("arrow");
        edgeSpecs.push({
          id: edgeId,
          from: fromEl.id,
          to: toEl.id,
          label: conn.label,
          style: conn.strokeStyle,
        });
      }

      const routeMap = computeSmartRoutes(nodeRects, edgeSpecs, "TB");

      edgeSpecs.forEach((edge, idx) => {
        const route = routeMap.get(edge.id);
        const conn = input.connections[idx];

        if (route) {
          skeletons.push({
            id: edge.id,
            type: "arrow",
            x: route.startX,
            y: route.startY,
            width: route.width,
            height: route.height,
            points: route.points,
            strokeColor: conn.strokeColor || "#475569",
            strokeWidth: 2,
            strokeStyle: conn.strokeStyle || "solid",
            roughness: 1,
            roundness: { type: 2 },
            start: { id: edge.from },
            end: { id: edge.to },
            startArrowhead: conn.startArrowhead && conn.startArrowhead !== "none" ? conn.startArrowhead : null,
            endArrowhead: conn.endArrowhead && conn.endArrowhead !== "none" ? conn.endArrowhead : "arrow",
            ...(conn.label
              ? {
                  label: {
                    text: conn.label,
                    fontSize: 12,
                    fontFamily: EXCALIDRAW_FONTS.NORMAL,
                  },
                }
              : {}),
          });
        }
      });

      const arrows = convertToExcalidrawElements(skeletons, { regenerateIds: false });
      api.updateScene({ elements: [...elements, ...arrows] });

      return {
        success: true,
        connectedCount: arrows.length,
      };
    },
  };
}
