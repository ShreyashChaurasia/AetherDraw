import React, { useEffect, useState } from "react";
import { webMCPEventManager } from "../../webmcp/events";
import type { ToolExecutionLog } from "../../types";
import { CheckCircle2, XCircle, Clock, Trash2, ChevronRight, ChevronDown } from "lucide-react";

export const ToolLog: React.FC = () => {
  const [logs, setLogs] = useState<ToolExecutionLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = webMCPEventManager.subscribeLogs((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-t border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Live WebMCP Execution Stream
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 rounded">
            {logs.length}
          </span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => webMCPEventManager.clearLogs()}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 italic">
            No WebMCP tools executed yet. Call tools via ChatGPT, Console, or Inspector to see live telemetry.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const timeStr = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div
                key={log.id}
                className="border border-neutral-800 rounded bg-neutral-950/60 overflow-hidden hover:border-neutral-700 transition-colors"
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                    )}

                    {log.status === "success" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {log.status === "error" && (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    {log.status === "pending" && (
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    )}

                    <span className="font-semibold text-indigo-300">{log.toolName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    {log.durationMs > 0 && <span>{log.durationMs}ms</span>}
                    <span>{timeStr}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-neutral-900 bg-neutral-950 text-neutral-300 space-y-2 text-[11px]">
                    <div>
                      <div className="text-neutral-500 font-semibold mb-1">Parameters:</div>
                      <pre className="p-2 bg-neutral-900/80 rounded border border-neutral-800 overflow-x-auto text-amber-200/90">
                        {JSON.stringify(log.parameters, null, 2)}
                      </pre>
                    </div>

                    {log.result !== undefined && (
                      <div>
                        <div className="text-neutral-500 font-semibold mb-1">Result:</div>
                        <pre className="p-2 bg-neutral-900/80 rounded border border-neutral-800 overflow-x-auto text-emerald-300/90 max-h-48">
                          {JSON.stringify(log.result, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.error && (
                      <div>
                        <div className="text-rose-400 font-semibold mb-1">Error:</div>
                        <pre className="p-2 bg-rose-950/40 border border-rose-900/60 rounded text-rose-300 overflow-x-auto">
                          {log.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
