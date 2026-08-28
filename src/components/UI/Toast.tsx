import React, { useEffect, useState } from "react";
import { webMCPEventManager } from "../../webmcp/events";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ToastMessage {
  id: string;
  toolName: string;
  type: "active" | "completed";
  text: string;
}

export const Toast: React.FC = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const unsubActive = webMCPEventManager.subscribeActiveTool((activeTool) => {
      if (activeTool) {
        setToast({
          id: `t_${Date.now()}`,
          toolName: activeTool,
          type: "active",
          text: `Executing WebMCP tool: ${activeTool}...`,
        });
      }
    });

    const unsubLogs = webMCPEventManager.subscribeLogs((logs) => {
      const latest = logs[0];
      if (latest && latest.status === "success" && latest.durationMs > 0) {
        setToast({
          id: `t_${Date.now()}`,
          toolName: latest.toolName,
          type: "completed",
          text: `WebMCP tool "${latest.toolName}" completed in ${latest.durationMs}ms`,
        });
        setTimeout(() => setToast(null), 3200);
      }
    });

    return () => {
      unsubActive();
      unsubLogs();
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-neutral-900/95 border border-neutral-700/80 shadow-2xl text-xs backdrop-blur font-mono">
        {toast.type === "active" ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className={toast.type === "active" ? "text-indigo-200" : "text-emerald-200"}>
          {toast.text}
        </span>
      </div>
    </div>
  );
};
