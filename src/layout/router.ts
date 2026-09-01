import type { LayoutDirection } from "../types";

export interface NodeRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeSpec {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface SmoothRoute {
  startX: number;
  startY: number;
  width: number;
  height: number;
  points: [number, number][];
}

/**
 * Evaluates a cubic Bezier curve at parameter t (0 <= t <= 1)
 */
function cubicBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0];
  const y = mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1];

  return [Math.round(x), Math.round(y)];
}

/**
 * Generates an array of smooth points approximating a cubic Bezier curve
 */
function sampleCubicBezier(
  start: [number, number],
  ctrl1: [number, number],
  ctrl2: [number, number],
  end: [number, number],
  steps: number = 8
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = cubicBezier(start, ctrl1, ctrl2, end, t);
    points.push([pt[0] - start[0], pt[1] - start[1]]);
  }
  return points;
}

/**
 * Packages route coordinates into a normalized relative points array
 */
function packageRoute(startX: number, startY: number, rawPoints: [number, number][]): SmoothRoute {
  const xs = rawPoints.map((p) => p[0]);
  const ys = rawPoints.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    startX: Math.round(startX),
    startY: Math.round(startY),
    width: Math.max(1, Math.round(maxX - minX)),
    height: Math.max(1, Math.round(maxY - minY)),
    points: rawPoints,
  };
}

/**
 * Detects if there are any intervening obstacle nodes between source and target
 */
function checkObstaclesInCorridor(
  src: NodeRect,
  dst: NodeRect,
  allNodes: NodeRect[]
): { hasObstacle: boolean; minX: number; maxX: number; minY: number; maxY: number } {
  const pad = 15;
  const minX = Math.min(src.x, dst.x) - pad;
  const maxX = Math.max(src.x + src.width, dst.x + dst.width) + pad;
  const minY = Math.min(src.y + src.height, dst.y) + 10;
  const maxY = Math.max(src.y + src.height, dst.y) - 10;

  let hasObstacle = false;
  let obsMinX = Infinity;
  let obsMaxX = -Infinity;
  let obsMinY = Infinity;
  let obsMaxY = -Infinity;

  for (const n of allNodes) {
    if (n.id === src.id || n.id === dst.id) continue;
    if (
      n.x < maxX &&
      n.x + n.width > minX &&
      n.y < maxY &&
      n.y + n.height > minY
    ) {
      hasObstacle = true;
      obsMinX = Math.min(obsMinX, n.x);
      obsMaxX = Math.max(obsMaxX, n.x + n.width);
      obsMinY = Math.min(obsMinY, n.y);
      obsMaxY = Math.max(obsMaxY, n.y + n.height);
    }
  }

  return {
    hasObstacle,
    minX: obsMinX === Infinity ? minX : obsMinX,
    maxX: obsMaxX === -Infinity ? maxX : obsMaxX,
    minY: obsMinY === Infinity ? minY : obsMinY,
    maxY: obsMaxY === -Infinity ? maxY : obsMaxY,
  };
}

/**
 * Computes smooth, obstacle-avoiding, organic Bezier curves between diagram nodes.
 */
export function computeSmartRoutes(
  nodes: NodeRect[],
  edges: EdgeSpec[],
  direction: LayoutDirection = "TB"
): Map<string, SmoothRoute> {
  const nodeMap = new Map<string, NodeRect>(nodes.map((n) => [n.id, n]));
  const routes = new Map<string, SmoothRoute>();

  // 1. Calculate global canvas bounds for gutter routing
  let globalMinX = Infinity;
  let globalMaxX = -Infinity;
  for (const n of nodes) {
    globalMinX = Math.min(globalMinX, n.x);
    globalMaxX = Math.max(globalMaxX, n.x + n.width);
  }
  if (globalMinX === Infinity) {
    globalMinX = 0;
    globalMaxX = 800;
  }

  // 2. Group outgoing and incoming edges per node
  const outgoingMap = new Map<string, EdgeSpec[]>();
  const incomingMap = new Map<string, EdgeSpec[]>();

  for (const edge of edges) {
    if (!outgoingMap.has(edge.from)) outgoingMap.set(edge.from, []);
    outgoingMap.get(edge.from)!.push(edge);

    if (!incomingMap.has(edge.to)) incomingMap.set(edge.to, []);
    incomingMap.get(edge.to)!.push(edge);
  }

  // 3. Sort outgoing edges by target X/Y so outgoing branch lines NEVER cross each other!
  for (const [, outList] of outgoingMap.entries()) {
    outList.sort((a, b) => {
      const dstA = nodeMap.get(a.to);
      const dstB = nodeMap.get(b.to);
      if (!dstA || !dstB) return 0;
      if (direction === "TB") {
        return (dstA.x + dstA.width / 2) - (dstB.x + dstB.width / 2);
      } else {
        return (dstA.y + dstA.height / 2) - (dstB.y + dstB.height / 2);
      }
    });
  }

  // 4. Sort incoming edges by source X/Y so incoming branches NEVER cross each other!
  for (const [, inList] of incomingMap.entries()) {
    inList.sort((a, b) => {
      const srcA = nodeMap.get(a.from);
      const srcB = nodeMap.get(b.from);
      if (!srcA || !srcB) return 0;
      if (direction === "TB") {
        return (srcA.x + srcA.width / 2) - (srcB.x + srcB.width / 2);
      } else {
        return (srcA.y + srcA.height / 2) - (srcB.y + srcB.height / 2);
      }
    });
  }

  // Gutter track offsets
  let leftGutterOffset = 0;
  let rightGutterOffset = 0;
  let leftChannelOffset = 0;
  let rightChannelOffset = 0;

  for (const edge of edges) {
    const src = nodeMap.get(edge.from);
    const dst = nodeMap.get(edge.to);

    if (!src || !dst) continue;

    const outEdges = outgoingMap.get(edge.from) || [];
    const inEdges = incomingMap.get(edge.to) || [];
    const outIdx = outEdges.findIndex((e) => e.id === edge.id);
    const inIdx = inEdges.findIndex((e) => e.id === edge.id);

    const outCount = outEdges.length;
    const inCount = inEdges.length;

    // Fractional offset along shape edge (0.2 to 0.8)
    const outFraction = outCount > 1 ? (outIdx + 1) / (outCount + 1) : 0.5;
    const inFraction = inCount > 1 ? (inIdx + 1) / (inCount + 1) : 0.5;

    // ----------------------------------------------------
    // CASE A: BACKWARD / FEEDBACK LOOP (Target is ABOVE Source)
    // ----------------------------------------------------
    if (dst.y + dst.height <= src.y) {
      const srcCenterX = src.x + src.width / 2;
      const useLeftGutter = srcCenterX <= (globalMinX + globalMaxX) / 2;

      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;
      let gutterX: number;

      if (useLeftGutter) {
        leftGutterOffset += 45;
        gutterX = globalMinX - leftGutterOffset;
        startX = src.x;
        startY = src.y + src.height * outFraction;
        endX = dst.x;
        endY = dst.y + dst.height * inFraction;

        const p1: [number, number] = [gutterX, startY];
        const p2: [number, number] = [gutterX, endY];
        const p3: [number, number] = [endX, endY];

        const rawPoints: [number, number][] = [
          [0, 0],
          [Math.round(p1[0] - startX), 0],
          [Math.round(p2[0] - startX), Math.round(p2[1] - startY)],
          [Math.round(p3[0] - startX), Math.round(p3[1] - startY)],
        ];

        routes.set(edge.id, packageRoute(startX, startY, rawPoints));
      } else {
        rightGutterOffset += 45;
        gutterX = globalMaxX + rightGutterOffset;
        startX = src.x + src.width;
        startY = src.y + src.height * outFraction;
        endX = dst.x + dst.width;
        endY = dst.y + dst.height * inFraction;

        const p1: [number, number] = [gutterX, startY];
        const p2: [number, number] = [gutterX, endY];
        const p3: [number, number] = [endX, endY];

        const rawPoints: [number, number][] = [
          [0, 0],
          [Math.round(p1[0] - startX), 0],
          [Math.round(p2[0] - startX), Math.round(p2[1] - startY)],
          [Math.round(p3[0] - startX), Math.round(p3[1] - startY)],
        ];

        routes.set(edge.id, packageRoute(startX, startY, rawPoints));
      }
      continue;
    }

    // ----------------------------------------------------
    // CASE B: TOP-TO-BOTTOM (TB) HIERARCHY FLOW
    // ----------------------------------------------------
    if (direction === "TB") {
      const obstacleCheck = checkObstaclesInCorridor(src, dst, nodes);

      // If intermediate obstacles exist between source and target, route through side corridor!
      if (obstacleCheck.hasObstacle) {
        const useRight = dst.x + dst.width / 2 >= src.x + src.width / 2;

        if (useRight) {
          rightChannelOffset += 35;
          const channelX = Math.max(src.x + src.width, obstacleCheck.maxX) + 35 + rightChannelOffset;
          const startX = src.x + src.width;
          const startY = src.y + src.height * outFraction;
          const endX = dst.x + dst.width;
          const endY = dst.y + dst.height * inFraction;

          const p1: [number, number] = [channelX, startY];
          const p2: [number, number] = [channelX, endY];
          const p3: [number, number] = [endX, endY];

          const rawPoints: [number, number][] = [
            [0, 0],
            [Math.round(p1[0] - startX), 0],
            [Math.round(p2[0] - startX), Math.round(p2[1] - startY)],
            [Math.round(p3[0] - startX), Math.round(p3[1] - startY)],
          ];

          routes.set(edge.id, packageRoute(startX, startY, rawPoints));
        } else {
          leftChannelOffset += 35;
          const channelX = Math.min(src.x, obstacleCheck.minX) - 35 - leftChannelOffset;
          const startX = src.x;
          const startY = src.y + src.height * outFraction;
          const endX = dst.x;
          const endY = dst.y + dst.height * inFraction;

          const p1: [number, number] = [channelX, startY];
          const p2: [number, number] = [channelX, endY];
          const p3: [number, number] = [endX, endY];

          const rawPoints: [number, number][] = [
            [0, 0],
            [Math.round(p1[0] - startX), 0],
            [Math.round(p2[0] - startX), Math.round(p2[1] - startY)],
            [Math.round(p3[0] - startX), Math.round(p3[1] - startY)],
          ];

          routes.set(edge.id, packageRoute(startX, startY, rawPoints));
        }
        continue;
      }

      // Direct adjacent rank: Smooth vertical Bezier S-curve
      const startX = src.x + src.width * outFraction;
      const startY = src.y + src.height;
      const endX = dst.x + dst.width * inFraction;
      const endY = dst.y;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) < 12) {
        routes.set(edge.id, packageRoute(startX, startY, [
          [0, 0],
          [0, Math.round(deltaY)],
        ]));
        continue;
      }

      const ctrl1: [number, number] = [startX, startY + deltaY * 0.45];
      const ctrl2: [number, number] = [endX, endY - deltaY * 0.45];

      const smoothPoints = sampleCubicBezier(
        [startX, startY],
        ctrl1,
        ctrl2,
        [endX, endY],
        8
      );

      routes.set(edge.id, packageRoute(startX, startY, smoothPoints));
      continue;
    }

    // ----------------------------------------------------
    // CASE C: LEFT-TO-RIGHT (LR) HIERARCHY FLOW
    // ----------------------------------------------------
    if (direction === "LR") {
      const startX = src.x + src.width;
      const startY = src.y + src.height * outFraction;
      const endX = dst.x;
      const endY = dst.y + dst.height * inFraction;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaY) < 12) {
        routes.set(edge.id, packageRoute(startX, startY, [
          [0, 0],
          [Math.round(deltaX), 0],
        ]));
        continue;
      }

      const ctrl1: [number, number] = [startX + deltaX * 0.45, startY];
      const ctrl2: [number, number] = [endX - deltaX * 0.45, endY];

      const smoothPoints = sampleCubicBezier(
        [startX, startY],
        ctrl1,
        ctrl2,
        [endX, endY],
        8
      );

      routes.set(edge.id, packageRoute(startX, startY, smoothPoints));
      continue;
    }

    // ----------------------------------------------------
    // CASE D: FALLBACK (Direct Center-to-Center)
    // ----------------------------------------------------
    const startX = src.x + src.width / 2;
    const startY = src.y + src.height / 2;
    const endX = dst.x + dst.width / 2;
    const endY = dst.y + dst.height / 2;

    routes.set(edge.id, packageRoute(startX, startY, [
      [0, 0],
      [Math.round(endX - startX), Math.round(endY - startY)],
    ]));
  }

  return routes;
}
