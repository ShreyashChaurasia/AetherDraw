import React from "react";
import {
  X,
  BookOpen,
  Bug,
  ExternalLink,
  Layers,
  Sparkles,
  Terminal,
  Video,
} from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GithubIcon: React.FC = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AetherDraw
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                  WebMCP Powered
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Agent-Native Infinite Whiteboard for Visual Thinking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-neutral-300 leading-relaxed">
          {/* Project Summary */}
          <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              What is AetherDraw?
            </div>
            <p>
              AetherDraw is an agent-native infinite whiteboard built for the <strong>DevPost WebMCP Challenge 2026</strong>.
              Instead of fragile screenshot-based computer vision or imprecise mouse clicks, AI agents (ChatGPT, Chrome Built-in AI)
              interact with the canvas through structured W3C Web Model Context Protocol (WebMCP) tool calls.
            </p>
          </div>

          {/* Attribution & Extension of Excalidraw */}
          <div className="p-4 rounded-lg bg-neutral-950/40 border border-neutral-800/80 space-y-2">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Attribution & Architecture Citation
            </div>
            <p>
              AetherDraw is proudly built upon and extends the open-source{" "}
              <a
                href="https://github.com/excalidraw/excalidraw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline font-semibold"
              >
                Excalidraw
              </a>{" "}
              rendering engine.
            </p>
            <p className="text-neutral-400">
              AetherDraw extends Excalidraw with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
              <li>Full 11-tool W3C WebMCP protocol surface on <code className="text-neutral-300">document.modelContext</code>.</li>
              <li>Automated graph layout computation via Dagre and ELK.js (Sugiyama layered DAG & orthogonal edge routing).</li>
              <li>Semantic Canvas AST extraction (shapes, connections, bounds, and text bindings).</li>
              <li>Live WebMCP Inspector, execution stream logging, and theme styling engines.</li>
            </ul>
          </div>

          {/* Useful Project Links */}
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Official Project Resources
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="https://github.com/ShreyashChaurasia/AetherDraw#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-800/40 transition-all text-neutral-200"
              >
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Documentation</div>
                  <div className="text-[10px] text-neutral-400">Read README & Guide</div>
                </div>
              </a>

              <a
                href="https://github.com/ShreyashChaurasia/AetherDraw/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 hover:bg-neutral-800/40 transition-all text-neutral-200"
              >
                <Bug className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Report Issues</div>
                  <div className="text-[10px] text-neutral-400">GitHub Issue Tracker</div>
                </div>
              </a>

              <a
                href="https://github.com/ShreyashChaurasia/AetherDraw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-800/40 transition-all text-neutral-200"
              >
                <GithubIcon />
                <div>
                  <div className="font-semibold text-xs">GitHub Repository</div>
                  <div className="text-[10px] text-neutral-400">Source Code & License</div>
                </div>
              </a>

              <a
                href="https://webmcp.devpost.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800/40 transition-all text-neutral-200"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">DevPost WebMCP</div>
                  <div className="text-[10px] text-neutral-400">Hackathon Challenge</div>
                </div>
              </a>

              <a
                href="https://github.com/excalidraw/excalidraw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/40 transition-all text-neutral-200"
              >
                <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Excalidraw Core</div>
                  <div className="text-[10px] text-neutral-400">Original Canvas Repo</div>
                </div>
              </a>

              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-500/50 hover:bg-neutral-800/40 transition-all text-neutral-200"
              >
                <Video className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Video Demo</div>
                  <div className="text-[10px] text-neutral-400">YouTube Walkthrough</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <span>AetherDraw v1.0.0 (MIT License)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
