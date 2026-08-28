import React, { useState } from "react";
import {
  Palette,
  LayoutGrid,
  Download,
  Terminal,
  Sparkles,
  Layers,
  ChevronDown,
} from "lucide-react";
import type { ThemeName } from "../../types";
import { THEMES } from "../../themes/palettes";

interface HeaderProps {
  activeTab: "inspector" | "copilot" | null;
  onToggleTab: (tab: "inspector" | "copilot") => void;
  onThemeSelect: (theme: ThemeName) => void;
  onLayoutTrigger: (direction: "TB" | "LR") => void;
  onExportTrigger: (format: "svg" | "png") => void;
  onTemplateSelect: (template: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleTab,
  onThemeSelect,
  onLayoutTrigger,
  onExportTrigger,
  onTemplateSelect,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-inner">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              AetherDraw
              <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                WebMCP Active
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">Agent-Native Infinite Whiteboard</div>
          </div>
        </div>
      </div>

      {/* Middle: Canvas Quick Actions */}
      <div className="flex items-center gap-1.5">
        {/* Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTemplateMenu(!showTemplateMenu);
              setShowThemeMenu(false);
            }}
            className="px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Templates</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showTemplateMenu && (
            <div className="absolute top-full mt-1.5 left-0 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  onTemplateSelect("architecture");
                  setShowTemplateMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex flex-col"
              >
                <span className="font-medium">Cloud Architecture</span>
                <span className="text-[10px] text-neutral-500">Gateway, Microservices & DB</span>
              </button>
              <button
                onClick={() => {
                  onTemplateSelect("flowchart");
                  setShowTemplateMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex flex-col"
              >
                <span className="font-medium">User Authentication Flow</span>
                <span className="text-[10px] text-neutral-500">Decisions & State branches</span>
              </button>
              <button
                onClick={() => {
                  onTemplateSelect("erd");
                  setShowTemplateMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex flex-col"
              >
                <span className="font-medium">Database ERD</span>
                <span className="text-[10px] text-neutral-500">Users, Orders & Payments</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowTemplateMenu(false);
            }}
            className="px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Themes</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showThemeMenu && (
            <div className="absolute top-full mt-1.5 left-0 w-44 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50 text-xs">
              {Object.entries(THEMES).map(([key, def]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeSelect(key as ThemeName);
                    setShowThemeMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
                >
                  <span>{def.name}</span>
                  <div
                    className="w-3 h-3 rounded-full border border-neutral-700"
                    style={{ backgroundColor: def.nodeStrokes[0] }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auto Layout TB / LR */}
        <button
          onClick={() => onLayoutTrigger("TB")}
          className="px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Auto Layout Top-to-Bottom"
        >
          <span>Layout (TB)</span>
        </button>
        <button
          onClick={() => onLayoutTrigger("LR")}
          className="px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Auto Layout Left-to-Right"
        >
          <span>Layout (LR)</span>
        </button>

        {/* Export */}
        <button
          onClick={() => onExportTrigger("png")}
          className="px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Export Canvas to PNG"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
          <span>Export PNG</span>
        </button>
      </div>

      {/* Right: Inspector & Copilot Drawers */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleTab("inspector")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
            activeTab === "inspector"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
              : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>WebMCP Inspector</span>
        </button>

        <button
          onClick={() => onToggleTab("copilot")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
            activeTab === "copilot"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
              : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Copilot</span>
        </button>
      </div>
    </header>
  );
};
