import type { ToolExecutionLog } from "../types";
import { generateElementId } from "../lib/idGenerator";

type LogListener = (logs: ToolExecutionLog[]) => void;
type ActiveToolListener = (activeTool: string | null) => void;

class WebMCPEventManager {
  private logs: ToolExecutionLog[] = [];
  private logListeners: Set<LogListener> = new Set();
  private activeToolListeners: Set<ActiveToolListener> = new Set();
  private activeTool: string | null = null;

  public subscribeLogs(listener: LogListener): () => void {
    this.logListeners.add(listener);
    listener([...this.logs]);
    return () => this.logListeners.delete(listener);
  }

  public subscribeActiveTool(listener: ActiveToolListener): () => void {
    this.activeToolListeners.add(listener);
    listener(this.activeTool);
    return () => this.activeToolListeners.delete(listener);
  }

  public startExecution(toolName: string, parameters: Record<string, unknown>): string {
    const logId = generateElementId("log");
    const logItem: ToolExecutionLog = {
      id: logId,
      timestamp: Date.now(),
      toolName,
      parameters,
      durationMs: 0,
      status: "pending",
    };

    this.logs.unshift(logItem);
    if (this.logs.length > 100) this.logs.pop();

    this.activeTool = toolName;
    this.notifyActiveTool();
    this.notifyLogs();
    return logId;
  }

  public finishExecution(logId: string, result: unknown, durationMs: number): void {
    const log = this.logs.find((l) => l.id === logId);
    if (log) {
      log.result = result;
      log.durationMs = durationMs;
      log.status = "success";
    }
    this.activeTool = null;
    this.notifyActiveTool();
    this.notifyLogs();
  }

  public failExecution(logId: string, error: string, durationMs: number): void {
    const log = this.logs.find((l) => l.id === logId);
    if (log) {
      log.error = error;
      log.durationMs = durationMs;
      log.status = "error";
    }
    this.activeTool = null;
    this.notifyActiveTool();
    this.notifyLogs();
  }

  public cancelExecution(logId: string): void {
    const log = this.logs.find((l) => l.id === logId);
    if (log) {
      log.status = "cancelled";
      log.error = "Operation cancelled by user";
    }
    this.activeTool = null;
    this.notifyActiveTool();
    this.notifyLogs();
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyLogs();
  }

  private notifyLogs(): void {
    const snapshot = [...this.logs];
    this.logListeners.forEach((fn) => fn(snapshot));
  }

  private notifyActiveTool(): void {
    this.activeToolListeners.forEach((fn) => fn(this.activeTool));
  }
}

export const webMCPEventManager = new WebMCPEventManager();
