import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

export interface ZoomToFitOptions {
  topOffset?: number;
  bottomOffset?: number;
  horizontalOffset?: number;
  maxZoom?: number;
  minZoom?: number;
}

/**
 * Fits the diagram elements onto the screen with comfortable clearance
 * for top navigation toolbars and bottom status docks.
 */
export function zoomToFitCanvas(
  api: ExcalidrawImperativeAPI,
  elements?: readonly ExcalidrawElement[],
  options: ZoomToFitOptions = {}
): void {
  const targetElements = (elements || api.getSceneElements()).filter((el) => !el.isDeleted);
  if (!targetElements || targetElements.length === 0) return;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of targetElements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  const contentWidth = Math.max(maxX - minX, 10);
  const contentHeight = Math.max(maxY - minY, 10);

  const appState = api.getAppState();
  const vw = appState.width || (typeof window !== "undefined" ? window.innerWidth : 1200);
  const vh = appState.height || (typeof window !== "undefined" ? window.innerHeight : 800);

  // Clearance for top navigation toolbar (105px) and bottom dock (60px)
  const topOffset = options.topOffset ?? 105;
  const bottomOffset = options.bottomOffset ?? 60;
  const horizOffset = options.horizontalOffset ?? 50;

  const availableWidth = Math.max(vw - horizOffset * 2, 100);
  const availableHeight = Math.max(vh - topOffset - bottomOffset, 100);

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;

  // Fit screen comfortably without over-zooming on small graphs
  const maxZoom = options.maxZoom ?? 1.0;
  const minZoom = options.minZoom ?? 0.1;
  const targetZoom = Math.max(Math.min(scaleX, scaleY, maxZoom), minZoom);

  // Center diagram in viewport (in scene space)
  const centerX = minX + contentWidth / 2;
  const centerY = minY + contentHeight / 2;

  const scrollX = vw / (2 * targetZoom) - centerX;
  const scrollY = (vh - bottomOffset + topOffset) / (2 * targetZoom) - centerY;

  api.updateScene({
    appState: {
      zoom: { value: targetZoom as any },
      scrollX,
      scrollY,
    },
  });
}
