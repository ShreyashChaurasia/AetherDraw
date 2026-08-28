import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Key, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  toolCall?: {
    name: string;
    params: any;
    result?: any;
  };
  timestamp: number;
}

export const CopilotPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "Hello! I am your AetherDraw copilot. Ask me to generate architecture diagrams, reorganize layouts, change themes, or connect elements.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("aetherdraw_gemini_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("aetherdraw_gemini_key", key);
    setShowKeyInput(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const modelContext = (document as any).modelContext;
      const lower = prompt.toLowerCase();

      // Rule-based heuristic generator if no Gemini key, or call Gemini API if key is present
      if (apiKey.trim()) {
        await executeWithGemini(prompt, modelContext);
      } else {
        await executeWithHeuristic(prompt, lower, modelContext);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "copilot",
          text: `Failed to process: ${err?.message || String(err)}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeWithHeuristic = async (_prompt: string, lower: string, modelContext: any) => {
    await new Promise((r) => setTimeout(r, 400));

    if (lower.includes("theme") || lower.includes("color")) {
      const themeMatch = ["nord", "cyberpunk", "pastel", "blueprint", "minimal_dark", "solarized", "default"].find(
        (t) => lower.includes(t)
      ) || "nord";

      const res = await modelContext.executeTool("apply_theme", { theme: themeMatch });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "copilot",
          text: `Applied the ${themeMatch} color theme across the canvas.`,
          toolCall: { name: "apply_theme", params: { theme: themeMatch }, result: res },
          timestamp: Date.now(),
        },
      ]);
    } else if (lower.includes("layout") || lower.includes("arrange") || lower.includes("align")) {
      const direction = lower.includes("left") || lower.includes("horizontal") || lower.includes("lr") ? "LR" : "TB";
      const engine = lower.includes("elk") ? "elk" : "dagre";

      const res = await modelContext.executeTool("apply_auto_layout", { direction, engine });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "copilot",
          text: `Organized diagram layout in ${direction === "LR" ? "Left-to-Right" : "Top-to-Bottom"} orientation using ${engine}.`,
          toolCall: { name: "apply_auto_layout", params: { direction, engine }, result: res },
          timestamp: Date.now(),
        },
      ]);
    } else if (lower.includes("export")) {
      const format = lower.includes("svg") ? "svg" : "png";
      const res = await modelContext.executeTool("export_canvas", { format });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "copilot",
          text: `Exported canvas as ${format.toUpperCase()}.`,
          toolCall: { name: "export_canvas", params: { format }, result: res },
          timestamp: Date.now(),
        },
      ]);
    } else {
      // Default: create an architecture / system diagram
      const isMicroservices = lower.includes("microservice") || lower.includes("cloud") || lower.includes("system");
      const title = isMicroservices ? "Cloud Microservices Architecture" : "System Workflow Diagram";

      const params = {
        title,
        diagramType: "architecture",
        layoutDirection: lower.includes("horizontal") ? "LR" : "TB",
        theme: "nord",
        nodes: [
          { id: "client", label: "Client Application", type: "rectangle" },
          { id: "gateway", label: "API Gateway", type: "rectangle" },
          { id: "auth", label: "Auth Service", type: "rectangle" },
          { id: "backend", label: "Core Service", type: "rectangle" },
          { id: "db", label: "Primary Database", type: "cylinder" },
          { id: "cache", label: "Cache Layer", type: "cylinder" },
        ],
        connections: [
          { from: "client", to: "gateway", label: "HTTPS / REST" },
          { from: "gateway", to: "auth", label: "Validate Token" },
          { from: "gateway", to: "backend", label: "Forward Request" },
          { from: "backend", to: "cache", label: "Check Cache" },
          { from: "backend", to: "db", label: "SQL Query" },
        ],
      };

      const res = await modelContext.executeTool("create_diagram", params);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "copilot",
          text: `Generated diagram "${title}" with 6 nodes and 5 connections.`,
          toolCall: { name: "create_diagram", params, result: res },
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const executeWithGemini = async (prompt: string, modelContext: any) => {
    const tools = modelContext.getTools();
    const systemInstruction = `You are the AI assistant for AetherDraw, a WebMCP-enabled infinite canvas.
Convert the user request into an appropriate WebMCP tool call from the list: ${JSON.stringify(tools.map((t: any) => ({ name: t.name, description: t.description, schema: t.inputSchema })))}.
Respond ONLY with a JSON object in this exact format:
{ "tool": "<tool_name>", "parameters": { ... } }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nUser request: ${prompt}` }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    if (parsed.tool && parsed.parameters) {
      const res = await modelContext.executeTool(parsed.tool, parsed.parameters);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "copilot",
          text: `Executed tool "${parsed.tool}".`,
          toolCall: { name: parsed.tool, params: parsed.parameters, result: res },
          timestamp: Date.now(),
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "copilot",
          text: rawText || "Processed your request.",
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            AetherDraw Copilot
          </span>
        </div>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
            apiKey ? "text-emerald-400 bg-emerald-950/40" : "text-neutral-400 hover:text-neutral-200"
          }`}
          title="Configure Gemini API Key"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="text-[10px]">{apiKey ? "Key Active" : "Add Key"}</span>
        </button>
      </div>

      {/* Key Configuration Drawer */}
      {showKeyInput && (
        <div className="p-3 bg-neutral-900 border-b border-neutral-800 space-y-2">
          <div className="text-xs text-neutral-400 font-medium">Gemini API Key (Optional):</div>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleSaveKey(apiKey)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium cursor-pointer"
            >
              Save
            </button>
          </div>
          <p className="text-[10px] text-neutral-500">
            Without a key, built-in heuristic generators are used to demonstrate WebMCP tools.
          </p>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-6 h-6 rounded bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-300" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg p-2.5 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-200"
                }`}
              >
                <div>{msg.text}</div>
                {msg.toolCall && (
                  <div className="mt-1 pt-1.5 border-t border-neutral-800 font-mono text-[10px] text-indigo-300">
                    <div className="font-semibold text-neutral-400">WebMCP Tool Executed:</div>
                    <span className="text-emerald-400">{msg.toolCall.name}</span>
                  </div>
                )}
              </div>
              {isUser && (
                <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Analyzing prompt and invoking WebMCP tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask copilot: 'Draw microservices cloud architecture'..."
            className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
