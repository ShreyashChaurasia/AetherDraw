import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  DiagramSpec,
  ShapeType,
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
import { computeSmartRoutes, type NodeRect, type EdgeSpec } from "../layout/router";

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

export function getDimensionsForNode(label?: string, type?: string): { width: number; height: number } {
  const lines = (label || "").split("\n");
  const maxLineLen = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const lineCount = lines.length;

  let baseWidth = Math.max(DEFAULT_NODE_WIDTH, maxLineLen * 10 + 48);
  let baseHeight = Math.max(DEFAULT_NODE_HEIGHT, lineCount * 24 + 36);

  if (type === "diamond") {
    const side = Math.max(baseWidth, baseHeight) * 1.25;
    return {
      width: Math.max(DEFAULT_DECISION_WIDTH, Math.round(side)),
      height: Math.max(DEFAULT_DECISION_HEIGHT, Math.round(side)),
    };
  } else if (type === "cylinder" || type === "ellipse" || (type as string) === "database") {
    return {
      width: Math.max(DEFAULT_DATABASE_WIDTH, baseWidth + 24),
      height: Math.max(DEFAULT_DATABASE_HEIGHT, baseHeight + 16),
    };
  } else if (type === "cloud") {
    return {
      width: Math.max(DEFAULT_CLOUD_WIDTH, baseWidth + 40),
      height: Math.max(DEFAULT_CLOUD_HEIGHT, baseHeight + 24),
    };
  }

  return { width: Math.round(baseWidth), height: Math.round(baseHeight) };
}

export function mapShapeTypeToExcalidraw(type?: string): "rectangle" | "diamond" | "ellipse" | "text" {
  switch (type) {
    case "diamond":
      return "diamond";
    case "ellipse":
    case "cylinder":
    case "database":
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
  const direction = spec.layoutDirection || "TB";
  const nodes = spec.nodes || [];
  const connections = spec.connections || spec.edges || [];

  // 1. Prepare layout nodes with dynamic label sizing
  const layoutNodes = nodes.map((node) => {
    const rawType = (node.type || node.shape || "rectangle") as string;
    const nodeType: ShapeType = rawType === "database" ? "cylinder" : (rawType as ShapeType);
    const dims = getDimensionsForNode(node.label, nodeType);
    return {
      id: node.id,
      width: node.width || dims.width,
      height: node.height || dims.height,
    };
  });

  const layoutEdges = connections.map((conn) => ({
    source: conn.from,
    target: conn.to,
  }));

  // 2. Compute positions via layout engine
  let layoutResult;
  if (spec.nodes.length > 0) {
    layoutResult = computeDagreLayout(layoutNodes, layoutEdges, {
      direction,
      nodeSpacing: direction === "LR" ? 75 : 70,
      rankSpacing: direction === "LR" ? 130 : 90,
    });
  } else {
    layoutResult = { positions: new Map(), width: 0, height: 0 };
  }

  const skeletons: any[] = [];
  const nodeRects: NodeRect[] = [];
  const yOffset = spec.title ? 75 : 20;

  // 3. Build shape skeletons
  nodes.forEach((node, idx) => {
    const rawType = (node.type || node.shape || "rectangle") as string;
    const nodeType: ShapeType = rawType === "database" ? "cylinder" : (rawType as ShapeType);
    const pos = layoutResult.positions.get(node.id) || { x: node.x ?? 100, y: node.y ?? 100 };
    const dims = getDimensionsForNode(node.label, nodeType);
    const width = node.width || dims.width;
    const height = node.height || dims.height;

    const x = pos.x + 20;
    const y = pos.y + yOffset;

    nodeRects.push({ id: node.id, x, y, width, height });

    const strokeColor = node.strokeColor || theme.nodeStrokes[idx % theme.nodeStrokes.length];
    const backgroundColor = node.backgroundColor || theme.nodeFills[idx % theme.nodeFills.length];
    const fillStyle = node.fillStyle || theme.fillStyle;

    skeletons.push({
      id: node.id,
      type: mapShapeTypeToExcalidraw(nodeType),
      x,
      y,
      width,
      height,
      strokeColor,
      backgroundColor,
      fillStyle,
      roughness: theme.roughness,
      roundness: { type: 2 },
      label: {
        text: node.label,
        fontSize: 14,
        fontFamily: EXCALIDRAW_FONTS.NORMAL,
        strokeColor: theme.textColor,
      },
    });
  });

  // Optional Title banner centered above the diagram nodes
  if (spec.title) {
    let minNodeX = Infinity;
    let maxNodeX = -Infinity;
    nodeRects.forEach((nr) => {
      minNodeX = Math.min(minNodeX, nr.x);
      maxNodeX = Math.max(maxNodeX, nr.x + nr.width);
    });
    const diagramCenterX = nodeRects.length > 0 ? (minNodeX + maxNodeX) / 2 : 200;
    const estTitleWidth = spec.title.length * 11;

    skeletons.unshift({
      id: generateElementId("title"),
      type: "text",
      x: Math.round(diagramCenterX - estTitleWidth / 2),
      y: 20,
      text: spec.title,
      fontSize: 22,
      fontFamily: EXCALIDRAW_FONTS.NORMAL,
      strokeColor: theme.textColor,
    });
  }

  // 4. Compute organic smooth cubic Bezier & obstacle-avoiding routes
  const edgeSpecs: EdgeSpec[] = connections.map((conn, idx) => ({
    id: generateElementId(`arrow_${idx}`),
    from: conn.from,
    to: conn.to,
    label: conn.label,
    style: conn.style,
  }));

  const routeMap = computeSmartRoutes(nodeRects, edgeSpecs, direction);

  edgeSpecs.forEach((edge, idx) => {
    const route = routeMap.get(edge.id);
    const conn = connections[idx];

    if (route) {
      skeletons.push({
        id: edge.id,
        type: "arrow",
        x: route.startX,
        y: route.startY,
        width: route.width,
        height: route.height,
        points: route.points,
        strokeColor: theme.arrowColor,
        strokeWidth: 2,
        strokeStyle: conn.style || "solid",
        roughness: theme.roughness,
        roundness: { type: 2 },
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
                fontSize: 12,
                fontFamily: EXCALIDRAW_FONTS.NORMAL,
                strokeColor: theme.textColor,
              },
            }
          : {}),
      });
    }
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
    const x = typeof el.x === "number" ? el.x : 0;
    const y = typeof el.y === "number" ? el.y : 0;
    const w = typeof el.width === "number" ? el.width : 0;
    const h = typeof el.height === "number" ? el.height : 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  if (minX === Infinity || isNaN(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const roundedMinX = Math.round(minX);
  const roundedMinY = Math.round(minY);
  const roundedMaxX = Math.round(maxX);
  const roundedMaxY = Math.round(maxY);

  return {
    minX: roundedMinX,
    minY: roundedMinY,
    maxX: roundedMaxX,
    maxY: roundedMaxY,
    width: Math.max(0, roundedMaxX - roundedMinX),
    height: Math.max(0, roundedMaxY - roundedMinY),
  };
}

export function toSemanticElement(
  el: ExcalidrawElement,
  allElements: readonly ExcalidrawElement[]
): SemanticCanvasElement {
  let textContent: string | undefined;

  if (el.type === "text") {
    textContent = (el as any).text;
  }

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
