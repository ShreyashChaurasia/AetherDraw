import React, { useState, useRef, useEffect } from "react";
import {
  Layers,
  LayoutGrid,
  Palette,
  ChevronDown,
  ArrowDownUp,
  ArrowLeftRight,
  Download,
} from "lucide-react";
import { TEMPLATES } from "../../templates/catalog";
import { THEMES } from "../../themes/palettes";
import type { ThemeName } from "../../types";

interface TopNavProps {
  currentTheme: ThemeName;
  onThemeSelect: (theme: ThemeName) => void;
  onLayoutTrigger: (direction: "TB" | "LR") => void;
  onExportTrigger: (format: "svg" | "png") => void;
  onTemplateSelect: (templateId: string) => void;
  onOpenAbout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTheme,
  onThemeSelect,
  onLayoutTrigger,
  onExportTrigger,
  onTemplateSelect,
  onOpenAbout,
}) => {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
        setShowLayoutMenu(false);
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed top-3 right-3 z-20 flex items-center gap-2 select-none pointer-events-auto"
    >
      {/* Floating Diagram Options Island */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl">
        {/* Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTemplateMenu(!showTemplateMenu);
              setShowLayoutMenu(false);
              setShowThemeMenu(false);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800/80 flex items-center gap-1 transition-colors cursor-pointer ${
              showTemplateMenu ? "bg-neutral-800 text-indigo-300" : ""
            }`}
            title="Diagram Templates"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Templates</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showTemplateMenu && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl py-1 z-50 text-xs max-h-96 overflow-y-auto divide-y divide-neutral-800/60 animate-in fade-in zoom-in-95 duration-100">
              {Object.values(TEMPLATES).map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onTemplateSelect(tmpl.id);
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800/80 text-neutral-200 flex flex-col transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-100">{tmpl.name}</span>
                    <span className="text-[9px] px-1 py-0.2 font-mono uppercase bg-neutral-800 text-indigo-300 rounded border border-neutral-700">
                      {tmpl.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                    {tmpl.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowTemplateMenu(false);
              setShowLayoutMenu(false);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800/80 flex items-center gap-1 transition-colors cursor-pointer ${
              showThemeMenu ? "bg-neutral-800 text-pink-300" : ""
            }`}
            title="Canvas & Diagram Themes"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden xl:inline">Theme</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showThemeMenu && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl py-1 z-50 text-xs max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeSelect(key as ThemeName);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between cursor-pointer ${
                    currentTheme === key ? "bg-neutral-800/70 text-indigo-300 font-semibold" : ""
                  }`}
                >
                  <div>
                    <div>{theme.name}</div>
                    <div className="text-[10px] text-neutral-400 line-clamp-1">{theme.description}</div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    {theme.nodeStrokes.slice(0, 3).map((stroke, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-neutral-700"
                        style={{ backgroundColor: stroke }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auto Layout Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowTemplateMenu(false);
              setShowThemeMenu(false);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800/80 flex items-center gap-1 transition-colors cursor-pointer ${
              showLayoutMenu ? "bg-neutral-800 text-emerald-300" : ""
            }`}
            title="Auto-Layout Engine"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Layout</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showLayoutMenu && (
            <div className="absolute top-full mt-2 right-0 w-44 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onLayoutTrigger("TB");
                  setShowLayoutMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 cursor-pointer"
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Top-to-Bottom (TB)</span>
              </button>
              <button
                onClick={() => {
                  onLayoutTrigger("LR");
                  setShowLayoutMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>Left-to-Right (LR)</span>
              </button>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={() => onExportTrigger("png")}
          className="p-1.5 rounded-lg text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition-colors cursor-pointer"
          title="Export Canvas to PNG"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />

        {/* AetherDraw Title Badge (Placed just to the right of options menu) */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-800/80 transition-colors cursor-pointer text-left group"
          title="About AetherDraw & Project References"
        >
          <div className="w-4 h-4 rounded bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Layers className="w-2.5 h-2.5 text-indigo-400" />
          </div>
          <span className="text-xs font-bold text-neutral-100 group-hover:text-indigo-300 transition-colors hidden xl:inline">
            AetherDraw
          </span>
        </button>
      </div>
    </div>
  );
};
