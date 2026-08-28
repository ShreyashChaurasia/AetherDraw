import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  DiagramSpec,
  SemanticCanvasElement,
  SemanticCanvasState,
  CanvasBoundingBox,
} from "../types";
import {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_DATABASE_WIDTH,
  DEFAULT_DATABASE_HEIGHT,
  DEFAULT_DECISION_WIDTH,
  DEFAULT_DECISION_HEIGHT,
  DEFAULT_CLOUD_WIDTH,
  DEFAULT_CLOUD_HEIGHT,
  EXCALIDRAW_FONTS,
} from "./constants";
import { generateElementId } from "./idGenerator";
import { getTheme } from "../themes/palettes";
import { computeDagreLayout } from "../layout/dagre";

export function getDimensionsForShape(type?: string): { width: number; height: number } {
  switch (type) {
    case "diamond":
      return { width: DEFAULT_DECISION_WIDTH, height: DEFAULT_DECISION_HEIGHT };
    case "ellipse":
    case "cylinder":
      return { width: DEFAULT_DATABASE_WIDTH, height: DEFAULT_DATABASE_HEIGHT };
    case "cloud":
      return { width: DEFAULT_CLOUD_WIDTH, height: DEFAULT_CLOUD_HEIGHT };
    default:
      return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
  }
}

export function mapShapeTypeToExcalidraw(type?: string): "rectangle" | "diamond" | "ellipse" | "text" {
  switch (type) {
    case "diamond":
      return "diamond";
    case "ellipse":
    case "cylinder":
    case "cloud":
    case "hexagon":
      return "ellipse";
    case "text":
      return "text";
    default:
      return "rectangle";
  }
}

export async function buildDiagramElements(spec: DiagramSpec): Promise<NonDeletedExcalidrawElement[]> {
  const theme = getTheme(spec.theme);

  // 1. Prepare layout nodes
  const layoutNodes = spec.nodes.map((node) => {
    const dims = getDimensionsForShape(node.type);
    return {
      id: node.id,
      width: node.width || dims.width,
      height: node.height || dims.height,
    };
  });

  const layoutEdges = spec.connections.map((conn) => ({
    source: conn.from,
    target: conn.to,
  }));

  // 2. Compute positions via layout engine
  let layoutResult;
  if (spec.nodes.length > 0) {
    layoutResult = computeDagreLayout(layoutNodes, layoutEdges, {
      direction: spec.layoutDirection || "TB",
    });
  } else {
    layoutResult = { positions: new Map(), width: 0, height: 0 };
  }

  const skeletons: any[] = [];

  // Optional Title banner
  if (spec.title) {
    skeletons.push({
      id: generateElementId("title"),
      type: "text",
      x: 40,
      y: 10,
      text: spec.title,
      fontSize: 24,
      fontFamily: EXCALIDRAW_FONTS.NORMAL,
      strokeColor: theme.textColor,
    });
  }

  // 3. Build shape skeletons
  spec.nodes.forEach((node, idx) => {
    const pos = layoutResult.positions.get(node.id) || { x: node.x ?? 100, y: node.y ?? 100 };
    const dims = getDimensionsForShape(node.type);
    const width = node.width || dims.width;
    const height = node.height || dims.height;

    const strokeColor = node.strokeColor || theme.nodeStrokes[idx % theme.nodeStrokes.length];
    const backgroundColor = node.backgroundColor || theme.nodeFills[idx % theme.nodeFills.length];
    const fillStyle = node.fillStyle || theme.fillStyle;

    skeletons.push({
      id: node.id,
      type: mapShapeTypeToExcalidraw(node.type),
      x: pos.x,
      y: pos.y + (spec.title ? 60 : 0),
      width,
      height,
      strokeColor,
      backgroundColor,
      fillStyle,
      roughness: theme.roughness,
      roundness: { type: 2 },
      label: {
        text: node.label,
        fontSize: 16,
        fontFamily: EXCALIDRAW_FONTS.NORMAL,
        strokeColor: theme.textColor,
      },
    });
  });

  // 4. Build arrow connection skeletons
  spec.connections.forEach((conn, idx) => {
    skeletons.push({
      id: generateElementId(`arrow_${idx}`),
      type: "arrow",
      strokeColor: theme.arrowColor,
      strokeWidth: 2,
      strokeStyle: conn.style || "solid",
      roughness: theme.roughness,
      start: {
        id: conn.from,
      },
      end: {
        id: conn.to,
      },
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
  });

  return convertToExcalidrawElements(skeletons, { regenerateIds: false });
}

export function calculateCanvasBounds(elements: readonly ExcalidrawElement[]): CanvasBoundingBox {
  const nonDeleted = elements.filter((el) => !el.isDeleted);
  if (nonDeleted.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of nonDeleted) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    minX: Math.round(minX),
    minY: Math.round(minY),
    maxX: Math.round(maxX),
    maxY: Math.round(maxY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

export function toSemanticElement(
  el: ExcalidrawElement,
  allElements: readonly ExcalidrawElement[]
): SemanticCanvasElement {
  let textContent: string | undefined;

  // If text element directly
  if (el.type === "text") {
    textContent = (el as any).text;
  }

  // If container shape with bound text
  if (el.boundElements) {
    for (const bound of el.boundElements) {
      if (bound.type === "text") {
        const textEl = allElements.find((item) => item.id === bound.id);
        if (textEl && (textEl as any).text) {
          textContent = (textEl as any).text;
          break;
        }
      }
    }
  }

  // Find connections
  const connectedTo: string[] = [];
  if (el.type === "arrow") {
    const arrow = el as any;
    if (arrow.startBinding?.elementId) connectedTo.push(arrow.startBinding.elementId);
    if (arrow.endBinding?.elementId) connectedTo.push(arrow.endBinding.elementId);
  } else if (el.boundElements) {
    for (const bound of el.boundElements) {
      if (bound.type === "arrow") {
        const arrowEl = allElements.find((item) => item.id === bound.id) as any;
        if (arrowEl) {
          if (arrowEl.startBinding?.elementId && arrowEl.startBinding.elementId !== el.id) {
            connectedTo.push(arrowEl.startBinding.elementId);
          }
          if (arrowEl.endBinding?.elementId && arrowEl.endBinding.elementId !== el.id) {
            connectedTo.push(arrowEl.endBinding.elementId);
          }
        }
      }
    }
  }

  return {
    id: el.id,
    type: el.type,
    x: Math.round(el.x),
    y: Math.round(el.y),
    width: Math.round(el.width),
    height: Math.round(el.height),
    text: textContent,
    strokeColor: el.strokeColor,
    backgroundColor: el.backgroundColor,
    fillStyle: el.fillStyle,
    connectedTo: [...new Set(connectedTo)],
    groupIds: [...(el.groupIds || [])],
  };
}

export function extractSemanticCanvasState(
  elements: readonly ExcalidrawElement[],
  selectedElementIds: Record<string, boolean> = {}
): SemanticCanvasState {
  const activeElements = elements.filter((el) => !el.isDeleted);
  const semanticElements = activeElements
    // filter out internal bound text elements to avoid duplicate reporting in semantic AST
    .filter((el) => !(el.type === "text" && (el as any).containerId))
    .map((el) => toSemanticElement(el, activeElements));

  const bounds = calculateCanvasBounds(activeElements);
  const selectedIds = Object.keys(selectedElementIds).filter((id) => selectedElementIds[id]);

  return {
    elementCount: semanticElements.length,
    canvasBounds: bounds,
    elements: semanticElements,
    selectedElementIds: selectedIds,
  };
}
