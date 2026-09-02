import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";
import type { DiagramSpec } from "../../types";
import { buildDiagramElements } from "../../lib/elementFactory";
import { getTheme } from "../../themes/palettes";

export function createDiagramGeneratorTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "create_diagram",
    description:
      "Generates a complete, beautifully organized diagram on the canvas in one shot. " +
      "Supports system architectures, flowcharts, ERDs, mindmaps, and sequence diagrams. " +
      "Automatically applies graph layout algorithms (Dagre) to avoid overlapping boxes and binds connecting arrows. " +
      "The canvas automatically centers and zooms to fit the generated diagram.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Optional diagram title shown at the top",
        },
        diagramType: {
          type: "string",
          enum: ["architecture", "flowchart", "mindmap", "erd", "sequence", "user_journey"],
          description: "Type of diagram to generate",
          default: "architecture",
        },
        nodes: {
          type: "array",
          description: "List of nodes/boxes to generate",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique node ID for connection targeting (e.g. 'api_gateway', 'db')" },
              label: { type: "string", description: "Visible text inside the node" },
              type: {
                type: "string",
                enum: ["rectangle", "diamond", "ellipse", "cylinder", "cloud", "hexagon"],
                description: "Shape type: rectangle for services, diamond for decisions, ellipse/cylinder for databases, cloud for external APIs",
                default: "rectangle",
              },
              role: {
                type: "string",
                description: "Semantic role (e.g. 'frontend', 'service', 'database', 'cache', 'queue')",
              },
            },
            required: ["id", "label"],
          },
        },
        connections: {
          type: "array",
          description: "List of directed arrows between nodes",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "Source node ID" },
              to: { type: "string", description: "Target node ID" },
              label: { type: "string", description: "Optional text label on the arrow" },
              style: {
                type: "string",
                enum: ["solid", "dashed", "dotted"],
                default: "solid",
              },
            },
            required: ["from", "to"],
          },
        },
        edges: {
          type: "array",
          description: "Alias for connections: list of directed arrows between nodes",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "Source node ID" },
              to: { type: "string", description: "Target node ID" },
              label: { type: "string", description: "Optional text label on the arrow" },
              style: {
                type: "string",
                enum: ["solid", "dashed", "dotted"],
                default: "solid",
              },
            },
            required: ["from", "to"],
          },
        },
        layoutDirection: {
          type: "string",
          enum: ["TB", "LR", "BT", "RL"],
          description: "Layout flow direction: TB=top-to-bottom, LR=left-to-right",
          default: "TB",
        },
        theme: {
          type: "string",
          enum: ["default", "nord", "cyberpunk", "pastel", "blueprint", "minimal_dark", "solarized"],
          description: "Color theme palette to apply",
        },
        clearExisting: {
          type: "boolean",
          description: "Whether to replace existing elements or append to the current canvas",
          default: false,
        },
      },
      required: ["nodes"],
    },
    annotations: {
      category: "generation",
    },
    async execute(input: DiagramSpec & { clearExisting?: boolean }) {
      const api = getAPI();
      if (!api) {
        throw new Error("AetherDraw canvas is not yet initialized");
      }

      const normalizedInput: DiagramSpec = {
        ...input,
        connections: input.connections || input.edges || [],
        nodes: (input.nodes || []).map((node) => ({
          ...node,
          type: (node.type || (node as any).shape || "rectangle") as any,
          role: node.role || (node as any).category,
        })),
      };

      const newElements = await buildDiagramElements(normalizedInput);
      const currentElements = input.clearExisting ? [] : api.getSceneElements();

      const combined = [...currentElements, ...newElements];

      const updateAppState: any = {};
      if (input.theme) {
        const theme = getTheme(input.theme);
        updateAppState.viewBackgroundColor = theme.canvasBackground;
      }

      api.updateScene({
        elements: combined,
        ...(Object.keys(updateAppState).length > 0 ? { appState: updateAppState } : {}),
      });

      // Smooth zoom to fit newly created diagram with top clearance for the toolbar
      setTimeout(() => {
        api.scrollToContent(newElements, {
          fitToViewport: true,
          viewportZoomFactor: 0.8,
          canvasOffsets: { top: 100, bottom: 60, left: 40, right: 40 },
          animate: true,
          duration: 400,
        });
      }, 50);

      return {
        success: true,
        createdNodeCount: normalizedInput.nodes.length,
        createdConnectionCount: (normalizedInput.connections || []).length,
        totalElements: newElements.length,
        nodeIds: normalizedInput.nodes.map((n) => n.id),
      };
    },
  };
}
