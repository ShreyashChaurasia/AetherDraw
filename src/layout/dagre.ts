import dagre from "@dagrejs/dagre";
import type { LayoutNodeInput, LayoutEdgeInput, LayoutOptions, LayoutResult } from "./types";
import { DEFAULT_NODE_SEP, DEFAULT_RANK_SEP } from "../lib/constants";

export function computeDagreLayout(
  nodes: LayoutNodeInput[],
  edges: LayoutEdgeInput[],
  options: LayoutOptions = {}
): LayoutResult {
  const g = new dagre.graphlib.Graph({ directed: true });

  const rankdir = options.direction || "TB";
  const nodesep = options.nodeSpacing ?? DEFAULT_NODE_SEP;
  const ranksep = options.rankSpacing ?? DEFAULT_RANK_SEP;

  g.setGraph({
    rankdir,
    nodesep,
    ranksep,
    marginx: 40,
    marginy: 40,
  });

  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, {
      width: Math.max(node.width, 50),
      height: Math.max(node.height, 30),
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const nodeId of g.nodes()) {
    const node = g.node(nodeId);
    if (node) {
      // Dagre returns center coordinates -> convert to top-left for Excalidraw
      positions.set(nodeId, {
        x: Math.round(node.x - node.width / 2),
        y: Math.round(node.y - node.height / 2),
      });
    }
  }

  const graphBounds = g.graph();
  return {
    positions,
    width: graphBounds.width || 0,
    height: graphBounds.height || 0,
  };
}
