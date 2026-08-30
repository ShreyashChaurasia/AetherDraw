import type { LayoutDirection } from "../types";

export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OrthogonalRoute {
  startX: number;
  startY: number;
  width: number;
  height: number;
  points: [number, number][];
}

function createRoute(startX: number, startY: number, points: [number, number][]): OrthogonalRoute {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    startX: Math.round(startX),
    startY: Math.round(startY),
    width: Math.max(1, Math.round(maxX - minX)),
    height: Math.max(1, Math.round(maxY - minY)),
    points,
  };
}

export function computeOrthogonalRoute(
  src: NodeRect,
  dst: NodeRect,
  direction: LayoutDirection = "TB",
  _obstacles: NodeRect[] = []
): OrthogonalRoute {
  const srcCenterX = src.x + src.width / 2;
  const srcCenterY = src.y + src.height / 2;
  const dstCenterX = dst.x + dst.width / 2;
  const dstCenterY = dst.y + dst.height / 2;

  // Case 1: Target is BELOW Source (Primary downward flow for TB)
  if (direction === "TB" && dst.y >= src.y + src.height - 10) {
    const startX = srcCenterX;
    const startY = src.y + src.height;
    const endX = dstCenterX;
    const endY = dst.y;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) < 15) {
      return createRoute(startX, startY, [
        [0, 0],
        [0, Math.round(deltaY)],
      ]);
    }

    const midY = (endY - startY) / 2;
    return createRoute(startX, startY, [
      [0, 0],
      [0, Math.round(midY)],
      [Math.round(deltaX), Math.round(midY)],
      [Math.round(deltaX), Math.round(deltaY)],
    ]);
  }

  // Case 2: Target is to the RIGHT of Source (Primary horizontal flow for LR)
  if (direction === "LR" && dst.x >= src.x + src.width - 10) {
    const startX = src.x + src.width;
    const startY = srcCenterY;
    const endX = dst.x;
    const endY = dstCenterY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaY) < 15) {
      return createRoute(startX, startY, [
        [0, 0],
        [Math.round(deltaX), 0],
      ]);
    }

    const midX = (endX - startX) / 2;
    return createRoute(startX, startY, [
      [0, 0],
      [Math.round(midX), 0],
      [Math.round(midX), Math.round(deltaY)],
      [Math.round(deltaX), Math.round(deltaY)],
    ]);
  }

  // Case 3: Target is to the LEFT of Source (Leftward branch in LR)
  if (src.x >= dst.x + dst.width - 10) {
    const startX = src.x;
    const startY = srcCenterY;
    const endX = dst.x + dst.width;
    const endY = dstCenterY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaY) < 15) {
      return createRoute(startX, startY, [
        [0, 0],
        [Math.round(deltaX), 0],
      ]);
    }

    const midX = (endX - startX) / 2;
    return createRoute(startX, startY, [
      [0, 0],
      [Math.round(midX), 0],
      [Math.round(midX), Math.round(deltaY)],
      [Math.round(deltaX), Math.round(deltaY)],
    ]);
  }

  // Case 4: Target is ABOVE Source (Backward feedback / loop edge)
  if (src.y >= dst.y + dst.height) {
    // Route cleanly around the outer right boundary to avoid all center boxes
    const clearanceX = Math.max(src.x + src.width, dst.x + dst.width) + 60;
    const startX = src.x + src.width;
    const startY = srcCenterY;
    const endX = dst.x + dst.width;
    const endY = dstCenterY;

    const arm1X = clearanceX - startX;
    const arm2Y = endY - startY;
    const arm3X = endX - startX;

    return createRoute(startX, startY, [
      [0, 0],
      [Math.round(arm1X), 0],
      [Math.round(arm1X), Math.round(arm2Y)],
      [Math.round(arm3X), Math.round(arm2Y)],
    ]);
  }

  // Case 5: Adjacent or Same-Level in TB (Side-to-Side connection)
  if (direction === "TB" && Math.abs(srcCenterY - dstCenterY) < 80) {
    if (dstCenterX > srcCenterX) {
      // Connect Right to Left
      const startX = src.x + src.width;
      const startY = srcCenterY;
      const endX = dst.x;
      const endY = dstCenterY;
      return createRoute(startX, startY, [
        [0, 0],
        [Math.round(endX - startX), Math.round(endY - startY)],
      ]);
    } else {
      // Connect Left to Right
      const startX = src.x;
      const startY = srcCenterY;
      const endX = dst.x + dst.width;
      const endY = dstCenterY;
      return createRoute(startX, startY, [
        [0, 0],
        [Math.round(endX - startX), Math.round(endY - startY)],
      ]);
    }
  }

  // Fallback
  const startX = direction === "LR" ? src.x + src.width : srcCenterX;
  const startY = direction === "LR" ? srcCenterY : src.y + src.height;
  const endX = direction === "LR" ? dst.x : dstCenterX;
  const endY = direction === "LR" ? dstCenterY : dst.y;

  return createRoute(startX, startY, [
    [0, 0],
    [Math.round(endX - startX), Math.round(endY - startY)],
  ]);
}
