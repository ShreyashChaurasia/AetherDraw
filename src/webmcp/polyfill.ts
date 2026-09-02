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

export function bridgeNativeModelContext(nativeMC: any): ModelContext {
  if (nativeMC.__isAetherDrawBridged) {
    return nativeMC;
  }

  const toolDefs = new Map<string, ModelContextTool>();
  const registeredToolObjects = new Map<string, any>();

  const originalRegister = typeof nativeMC.registerTool === "function" ? nativeMC.registerTool.bind(nativeMC) : null;
  const originalUnregister = typeof nativeMC.unregisterTool === "function" ? nativeMC.unregisterTool.bind(nativeMC) : null;
  const originalExecute = typeof nativeMC.executeTool === "function" ? nativeMC.executeTool.bind(nativeMC) : null;

  nativeMC.registerTool = function (tool: ModelContextTool, options?: ModelContextRegisterOptions) {
    toolDefs.set(tool.name, tool);

    // Prevent InvalidStateError: Duplicate tool name in native WebMCP
    if (originalUnregister) {
      try {
        originalUnregister(tool.name);
      } catch (_) {
        // Ignore unregister failures
      }
    }

    let regResult: any = null;
    if (originalRegister) {
      try {
        regResult = originalRegister(tool, options);
      } catch (err: any) {
        console.warn(`[WebMCP] Native registerTool note for "${tool.name}":`, err?.message || err);
      }
    }

    if (regResult) {
      registeredToolObjects.set(tool.name, regResult);
    }

    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        nativeMC.unregisterTool(tool.name);
      });
    }

    try {
      nativeMC.dispatchEvent(new CustomEvent("toolregistered", { detail: tool }));
      nativeMC.dispatchEvent(new Event("change"));
    } catch (_) {}

    return regResult || tool;
  };

  nativeMC.unregisterTool = function (name: string) {
    toolDefs.delete(name);
    registeredToolObjects.delete(name);
    if (originalUnregister) {
      try {
        originalUnregister(name);
      } catch (_) {}
    }
    try {
      nativeMC.dispatchEvent(new CustomEvent("toolunregistered", { detail: { name } }));
      nativeMC.dispatchEvent(new Event("change"));
    } catch (_) {}
  };

  nativeMC.executeTool = async function (toolOrName: any, parameters: any = {}) {
    const toolName = typeof toolOrName === "string" ? toolOrName : (toolOrName?.name || toolOrName?.id || "");
    const registeredObj = registeredToolObjects.get(toolName);

    const logId = webMCPEventManager.startExecution(toolName || "unknown_tool", parameters);
    const startTime = performance.now();
    try {
      nativeMC.dispatchEvent(new CustomEvent("toolactivated", { detail: { name: toolName, parameters } }));
    } catch (_) {}

    try {
      let result: any;

      // 1. Try native executeTool if passed a RegisteredTool object
      if (originalExecute && typeof toolOrName === "object" && toolOrName !== null) {
        try {
          result = await originalExecute(toolOrName, parameters);
        } catch (_) {
          // Fall back to direct execution
        }
      }

      // 2. If passed a string tool name, try native executeTool with the stored RegisteredTool object
      if (result === undefined && originalExecute && registeredObj) {
        try {
          result = await originalExecute(registeredObj, parameters);
        } catch (_) {
          // Fall back to direct execution
        }
      }

      // 3. Fallback: execute JavaScript tool handler directly
      if (result === undefined) {
        const toolDef =
          toolDefs.get(toolName) ||
          (typeof toolOrName === "object" && typeof toolOrName.execute === "function" ? toolOrName : null);
        if (toolDef && typeof toolDef.execute === "function") {
          result = await toolDef.execute(parameters);
        } else {
          throw new Error(`WebMCP Tool "${toolName}" not found or has no execute handler`);
        }
      }

      const duration = Math.round(performance.now() - startTime);
      webMCPEventManager.finishExecution(logId, result, duration);
      try {
        nativeMC.dispatchEvent(new CustomEvent("toolcompleted", { detail: { name: toolName, result, duration } }));
      } catch (_) {}
      return result;
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = err?.message || String(err);
      webMCPEventManager.failExecution(logId, errorMessage, duration);
      try {
        nativeMC.dispatchEvent(new CustomEvent("toolcanceled", { detail: { name: toolName, error: errorMessage } }));
      } catch (_) {}
      throw err;
    }
  };

  nativeMC.__isAetherDrawBridged = true;
  return nativeMC;
}

export async function initializeWebMCP(): Promise<ModelContext> {
  // 1. Check if document.modelContext exists natively
  if (typeof document !== "undefined" && document.modelContext) {
    console.log("[WebMCP] Native document.modelContext detected, applying bridge");
    return bridgeNativeModelContext(document.modelContext);
  }

  // 2. Check legacy navigator.modelContext
  if (typeof navigator !== "undefined" && (navigator as any).modelContext) {
    console.log("[WebMCP] Legacy navigator.modelContext detected, bridging to document");
    document.modelContext = bridgeNativeModelContext((navigator as any).modelContext);
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
