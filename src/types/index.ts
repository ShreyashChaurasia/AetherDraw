export type ShapeType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "cylinder"
  | "cloud"
  | "hexagon"
  | "text"
  | "arrow"
  | "line";

export type DiagramType =
  | "architecture"
  | "flowchart"
  | "mindmap"
  | "erd"
  | "sequence"
  | "user_journey";

export type LayoutDirection = "TB" | "LR" | "BT" | "RL";

export type ThemeName =
  | "default"
  | "nord"
  | "cyberpunk"
  | "pastel"
  | "blueprint"
  | "minimal_dark"
  | "solarized";

export interface DiagramNodeInput {
  id: string;
  label: string;
  type?: ShapeType;
  shape?: ShapeType | string;
  category?: string;
  role?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: "solid" | "hachure" | "cross-hatch" | "zigzag";
}

export interface DiagramConnectionInput {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed" | "dotted";
  startArrowhead?: "arrow" | "bar" | "dot" | "triangle" | "none";
  endArrowhead?: "arrow" | "bar" | "dot" | "triangle" | "none";
}

export interface DiagramSpec {
  title?: string;
  diagramType?: DiagramType;
  nodes: DiagramNodeInput[];
  connections?: DiagramConnectionInput[];
  edges?: DiagramConnectionInput[];
  layoutDirection?: LayoutDirection;
  theme?: ThemeName;
}

export interface ToolExecutionLog {
  id: string;
  timestamp: number;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  durationMs: number;
  status: "pending" | "success" | "error" | "cancelled";
}

export interface CanvasBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface SemanticCanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  connectedTo: string[];
  groupIds: string[];
}

export interface SemanticCanvasState {
  elementCount: number;
  canvasBounds: CanvasBoundingBox;
  elements: SemanticCanvasElement[];
  selectedElementIds: string[];
}

export interface ColorThemeDefinition {
  name: string;
  description: string;
  canvasBackground: string;
  nodeStrokes: string[];
  nodeFills: string[];
  arrowColor: string;
  textColor: string;
  roughness: number;
  fillStyle: "solid" | "hachure" | "cross-hatch" | "zigzag";
}
