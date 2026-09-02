import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { initializeWebMCP } from "./polyfill";
import type { ModelContext, ModelContextTool } from "./types";
import {
  createGetCanvasStateTool,
  createGetSelectedElementsTool,
  createFindElementsTool,
} from "./tools/canvasState";
import { createDiagramGeneratorTool } from "./tools/diagramGenerator";
import {
  createAddElementsTool,
  createUpdateElementsTool,
  createDeleteElementsTool,
} from "./tools/elementMutation";
import { createConnectElementsTool } from "./tools/connectionManager";
import { createApplyAutoLayoutTool } from "./tools/layoutEngine";
import { createApplyThemeTool } from "./tools/themeManager";
import { createExportCanvasTool } from "./tools/exportManager";

export class WebMCPRegistry {
  private static instance: WebMCPRegistry | null = null;
  private api: ExcalidrawImperativeAPI | null = null;
  private modelContext: ModelContext | null = null;
  private registeredTools: ModelContextTool[] = [];

  private constructor() {}

  public static getInstance(): WebMCPRegistry {
    if (!WebMCPRegistry.instance) {
      WebMCPRegistry.instance = new WebMCPRegistry();
    }
    return WebMCPRegistry.instance;
  }

  public setCanvasAPI(api: ExcalidrawImperativeAPI): void {
    this.api = api;
    this.registerAllTools();
  }

  public getCanvasAPI(): ExcalidrawImperativeAPI | null {
    return this.api;
  }

  public async initialize(): Promise<ModelContext> {
    if (!this.modelContext) {
      this.modelContext = await initializeWebMCP();
    }
    this.registerAllTools();
    return this.modelContext;
  }

  public getRegisteredTools(): ModelContextTool[] {
    return [...this.registeredTools];
  }

  public async executeTool(name: string, parameters: any = {}): Promise<any> {
    if (this.modelContext && typeof this.modelContext.executeTool === "function") {
      return await this.modelContext.executeTool(name, parameters);
    }
    const tool = this.registeredTools.find((t) => t.name === name);
    if (tool && typeof tool.execute === "function") {
      return await tool.execute(parameters);
    }
    throw new Error(`WebMCP Tool "${name}" is not registered`);
  }

  private registeredToolNames: Set<string> = new Set();

  private registerAllTools(): void {
    if (!this.modelContext) return;

    const getAPI = () => this.api;

    const tools: ModelContextTool[] = [
      // Layer A: Inspection & State
      createGetCanvasStateTool(getAPI),
      createGetSelectedElementsTool(getAPI),
      createFindElementsTool(getAPI),

      // Layer B: Generative Generators
      createDiagramGeneratorTool(getAPI),

      // Layer C: Fine-grained Mutation
      createAddElementsTool(getAPI),
      createUpdateElementsTool(getAPI),
      createDeleteElementsTool(getAPI),
      createConnectElementsTool(getAPI),

      // Layer D: Layout & Aesthetics
      createApplyAutoLayoutTool(getAPI),
      createApplyThemeTool(getAPI),
      createExportCanvasTool(getAPI),
    ];

    this.registeredTools = tools;

    for (const tool of tools) {
      if (this.registeredToolNames.has(tool.name)) {
        try {
          this.modelContext.unregisterTool(tool.name);
        } catch (_) {}
      }
      this.modelContext.registerTool(tool);
      this.registeredToolNames.add(tool.name);
    }

    console.log(`[WebMCP] Successfully registered ${tools.length} tools to document.modelContext`);
  }
}

export const webMCPRegistry = WebMCPRegistry.getInstance();
