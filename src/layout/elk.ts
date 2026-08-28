import type { LayoutNodeInput, LayoutEdgeInput, LayoutOptions, LayoutResult } from "./types";
import { DEFAULT_NODE_SEP, DEFAULT_RANK_SEP } from "../lib/constants";

let elkInstance: any = null;

async function getElk() {
  if (!elkInstance) {
    const ELK = (await import("elkjs")).default;
    elkInstance = new ELK();
  }
  return elkInstance;
}

export async function computeElkLayout(
  nodes: LayoutNodeInput[],
  edges: LayoutEdgeInput[],
  options: LayoutOptions = {}
): Promise<LayoutResult> {
  const elk = await getElk();

  const directionMap: Record<string, string> = {
    TB: "DOWN",
    BT: "UP",
    LR: "RIGHT",
    RL: "LEFT",
  };

  const direction = directionMap[options.direction || "TB"] || "DOWN";
  const nodeSpacing = String(options.nodeSpacing ?? DEFAULT_NODE_SEP);
  const rankSpacing = String(options.rankSpacing ?? DEFAULT_RANK_SEP);
  const edgeRouting = options.edgeRouting || "ORTHOGONAL";

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": nodeSpacing,
      "elk.layered.spacing.nodeNodeBetweenLayers": rankSpacing,
      "elk.edgeRouting": edgeRouting,
      "elk.padding": "[top=40,left=40,bottom=40,right=40]",
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: Math.max(n.width, 50),
      height: Math.max(n.height, 30),
    })),
    edges: edges.map((e, idx) => ({
      id: `e_${idx}_${e.source}_${e.target}`,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layouted = await elk.layout(graph);
  const positions = new Map<string, { x: number; y: number }>();

  if (layouted.children) {
    for (const child of layouted.children) {
      positions.set(child.id, {
        x: Math.round(child.x || 0),
        y: Math.round(child.y || 0),
      });
    }
  }

  return {
    positions,
    width: Math.round(layouted.width || 0),
    height: Math.round(layouted.height || 0),
  };
}
