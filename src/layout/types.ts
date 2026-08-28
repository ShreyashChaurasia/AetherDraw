import type { LayoutDirection } from "../types";

export interface LayoutNodeInput {
  id: string;
  width: number;
  height: number;
}

export interface LayoutEdgeInput {
  source: string;
  target: string;
}

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeSpacing?: number;
  rankSpacing?: number;
  engine?: "dagre" | "elk";
  edgeRouting?: "ORTHOGONAL" | "POLYLINE" | "SPLINES" | "DIRECT";
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
}
