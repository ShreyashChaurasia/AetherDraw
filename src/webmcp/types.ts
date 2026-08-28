export interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  destructiveHint?: boolean;
  requiresConfirmation?: boolean;
  category?: "inspection" | "generation" | "mutation" | "layout" | "styling" | "export";
}

export interface ModelContextExecutionContext {
  signal?: AbortSignal;
  callerOrigin?: string;
  isAutomated?: boolean;
}

export type ModelContextExecuteCallback = (
  input: any,
  context?: ModelContextExecutionContext
) => Promise<any> | any;

export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: ToolAnnotations;
  execute: ModelContextExecuteCallback;
}

export interface ModelContextToolDescription {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: ToolAnnotations;
}

export interface ModelContextRegisterOptions {
  signal?: AbortSignal;
}

export interface ModelContext {
  registerTool(tool: ModelContextTool, options?: ModelContextRegisterOptions): void;
  unregisterTool(name: string): void;
  getTools(): ModelContextToolDescription[];
  executeTool(name: string, parameters?: any): Promise<any>;
  provideContext?(payload: any): void;
  clearContext?(): void;
  addEventListener?(type: string, listener: (event: any) => void): void;
  removeEventListener?(type: string, listener: (event: any) => void): void;
  dispatchEvent?(event: any): boolean;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
  interface Window {
    modelContext?: ModelContext;
  }
}
