import React, { useState, useEffect } from "react";
import { webMCPRegistry } from "../../webmcp/registry";
import type { ModelContextTool } from "../../webmcp/types";
import { Play, Code } from "lucide-react";

const DEMO_PAYLOADS: Record<string, Record<string, unknown>> = {
  create_diagram: {
    title: "E-Commerce Cloud Architecture",
    diagramType: "architecture",
    layoutDirection: "TB",
    theme: "nord",
    nodes: [
      { id: "client", label: "Web Client", type: "rectangle" },
      { id: "cdn", label: "Cloudflare CDN", type: "cloud" },
      { id: "gateway", label: "API Gateway", type: "rectangle" },
      { id: "auth_svc", label: "Auth Service", type: "rectangle" },
      { id: "order_svc", label: "Order Service", type: "rectangle" },
      { id: "db", label: "PostgreSQL DB", type: "cylinder" },
      { id: "cache", label: "Redis Cache", type: "cylinder" },
    ],
    connections: [
      { from: "client", to: "cdn", label: "HTTPS" },
      { from: "cdn", to: "gateway", label: "Forward" },
      { from: "gateway", to: "auth_svc", label: "Verify JWT" },
      { from: "gateway", to: "order_svc", label: "Place Order" },
      { from: "order_svc", to: "db", label: "Read/Write" },
      { from: "auth_svc", to: "cache", label: "Session Token" },
    ],
  },
  get_canvas_state: {
    includeDeleted: false,
  },
  get_selected_elements: {},
  find_elements: {
    query: "Service",
  },
  apply_auto_layout: {
    direction: "LR",
    engine: "dagre",
    nodeSpacing: 60,
    rankSpacing: 90,
  },
  apply_theme: {
    theme: "cyberpunk",
  },
  export_canvas: {
    format: "png",
    darkMode: true,
  },
  add_elements: {
    elements: [
      { type: "diamond", label: "Is Authenticated?", x: 300, y: 150 },
      { type: "rectangle", label: "Render Dashboard", x: 550, y: 150 },
    ],
  },
  connect_elements: {
    connections: [],
  },
  update_elements: {
    updates: [],
  },
  delete_elements: {
    elementIds: [],
  },
};

export const ToolInspector: React.FC = () => {
  const [tools, setTools] = useState<ModelContextTool[]>(() => webMCPRegistry.getRegisteredTools());
  const [selectedToolName, setSelectedToolName] = useState<string>("create_diagram");
  const [customParams, setCustomParams] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"schema" | "execute">("execute");
  const [executing, setExecuting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const list = webMCPRegistry.getRegisteredTools();
      if (list.length > 0) {
        setTools(list);
        setSelectedToolName((prev) => (prev ? prev : list[0].name));
      }
    };

    update();

    const timer = setInterval(update, 250);
    const clearTimer = setTimeout(() => clearInterval(timer), 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(clearTimer);
    };
  }, []);

  const selectedTool = tools.find((t) => t.name === selectedToolName) || tools[0];

  const handleSelectTool = (tool: ModelContextTool) => {
    setSelectedToolName(tool.name);
    const demo = DEMO_PAYLOADS[tool.name] || {};
    setCustomParams(JSON.stringify(demo, null, 2));
    setLastResult(null);
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    setExecuting(true);
    setLastResult(null);

    try {
      let parsed = {};
      if (customParams.trim()) {
        parsed = JSON.parse(customParams);
      }
      const modelContext = (document as any).modelContext;
      const res = await modelContext.executeTool(selectedTool.name, parsed);
      setLastResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setLastResult(JSON.stringify({ error: err?.message || String(err) }, null, 2));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      {/* Tool selector list */}
      <div className="p-3 border-b border-neutral-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          Registered WebMCP Tools ({tools.length})
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-neutral-900/60 rounded border border-neutral-800">
          {tools.map((tool) => {
            const isSelected = tool.name === (selectedTool?.name || selectedToolName);
            return (
              <button
                key={tool.name}
                onClick={() => handleSelectTool(tool)}
                className={`text-left px-2.5 py-1.5 rounded text-xs font-mono truncate transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800"
                }`}
                title={tool.name}
              >
                {tool.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Tool Details */}
      {selectedTool && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/40">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold font-mono text-indigo-300">{selectedTool.name}</h3>
              {selectedTool.annotations?.category && (
                <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                  {selectedTool.annotations.category}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">{selectedTool.description}</p>
          </div>

          {/* Sub-tabs: Execute / Schema */}
          <div className="flex border-b border-neutral-800 bg-neutral-900/60">
            <button
              onClick={() => setActiveTab("execute")}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "execute"
                  ? "border-indigo-500 text-indigo-300 bg-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Manual Tester
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "schema"
                  ? "border-indigo-500 text-indigo-300 bg-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JSON Schema
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === "execute" ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span>Input Parameters (JSON):</span>
                    <button
                      onClick={() => {
                        const demo = DEMO_PAYLOADS[selectedTool.name] || {};
                        setCustomParams(JSON.stringify(demo, null, 2));
                      }}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Reset Payload
                    </button>
                  </div>
                  <textarea
                    value={customParams || JSON.stringify(DEMO_PAYLOADS[selectedTool.name] || {}, null, 2)}
                    onChange={(e) => setCustomParams(e.target.value)}
                    rows={7}
                    className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-amber-200/90 focus:outline-none focus:border-indigo-500 resize-y"
                    spellCheck={false}
                  />
                </div>

                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="w-full py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Play className={`w-3.5 h-3.5 ${executing ? "animate-spin" : ""}`} />
                  {executing ? "Executing Tool..." : `Execute ${selectedTool.name}`}
                </button>

                {lastResult && (
                  <div>
                    <div className="text-xs font-semibold text-neutral-400 mb-1">Execution Output:</div>
                    <pre className="p-2.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-44">
                      {lastResult}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-400">W3C WebMCP Input Schema:</div>
                <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-neutral-300 overflow-x-auto">
                  {JSON.stringify(selectedTool.inputSchema, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
