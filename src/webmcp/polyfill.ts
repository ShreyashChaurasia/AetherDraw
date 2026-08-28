import type { ModelContext, ModelContextTool, ModelContextRegisterOptions } from "./types";
import { webMCPEventManager } from "./events";

export class InMemoryModelContext implements ModelContext {
  private tools: Map<string, ModelContextTool> = new Map();
  private eventTarget: EventTarget = new EventTarget();

  public registerTool(tool: ModelContextTool, options?: ModelContextRegisterOptions): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[WebMCP] Overwriting existing tool: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);

    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        this.unregisterTool(tool.name);
      });
    }

    this.dispatchEvent(new CustomEvent("toolregistered", { detail: tool }));
    this.dispatchEvent(new Event("change"));
  }

  public unregisterTool(name: string): void {
    if (this.tools.has(name)) {
      this.tools.delete(name);
      this.dispatchEvent(new CustomEvent("toolunregistered", { detail: { name } }));
      this.dispatchEvent(new Event("change"));
    }
  }

  public getTools() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      outputSchema: t.outputSchema,
      annotations: t.annotations,
    }));
  }

  public async executeTool(name: string, parameters: any = {}): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      const errorMsg = `WebMCP Tool "${name}" not found. Available tools: ${Array.from(this.tools.keys()).join(", ")}`;
      console.error(`[WebMCP] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const logId = webMCPEventManager.startExecution(name, parameters);
    const startTime = performance.now();

    this.dispatchEvent(new CustomEvent("toolactivated", { detail: { name, parameters } }));

    try {
      const result = await tool.execute(parameters);
      const duration = Math.round(performance.now() - startTime);

      webMCPEventManager.finishExecution(logId, result, duration);
      this.dispatchEvent(new CustomEvent("toolcompleted", { detail: { name, result, duration } }));
      return result;
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = err?.message || String(err);

      webMCPEventManager.failExecution(logId, errorMessage, duration);
      this.dispatchEvent(new CustomEvent("toolcanceled", { detail: { name, error: errorMessage } }));
      throw err;
    }
  }

  public provideContext(payload: any): void {
    if (payload?.tools && Array.isArray(payload.tools)) {
      for (const t of payload.tools) {
        this.registerTool(t);
      }
    }
  }

  public clearContext(): void {
    this.tools.clear();
    this.dispatchEvent(new Event("change"));
  }

  public addEventListener(type: string, listener: any): void {
    this.eventTarget.addEventListener(type, listener);
  }

  public removeEventListener(type: string, listener: any): void {
    this.eventTarget.removeEventListener(type, listener);
  }

  public dispatchEvent(event: Event): boolean {
    return this.eventTarget.dispatchEvent(event);
  }
}

export async function initializeWebMCP(): Promise<ModelContext> {
  // 1. Check if document.modelContext exists natively
  if (typeof document !== "undefined" && document.modelContext) {
    console.log("[WebMCP] Native document.modelContext detected");
    return document.modelContext;
  }

  // 2. Check legacy navigator.modelContext
  if (typeof navigator !== "undefined" && (navigator as any).modelContext) {
    console.log("[WebMCP] Legacy navigator.modelContext detected, aliasing to document");
    document.modelContext = (navigator as any).modelContext;
    return document.modelContext as ModelContext;
  }

  // 3. Fallback to resilient InMemoryModelContext polyfill
  console.log("[WebMCP] Initializing WebMCP polyfill & bridge");
  const polyfillInstance = new InMemoryModelContext();

  if (typeof document !== "undefined") {
    document.modelContext = polyfillInstance;
  }
  if (typeof navigator !== "undefined") {
    (navigator as any).modelContext = polyfillInstance;
  }
  if (typeof window !== "undefined") {
    (window as any).modelContext = polyfillInstance;
  }

  return polyfillInstance;
}
