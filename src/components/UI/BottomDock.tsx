import React from "react";
import { Terminal, Sparkles, HelpCircle } from "lucide-react";

interface BottomDockProps {
  activeTab: "inspector" | "copilot" | null;
  onToggleTab: (tab: "inspector" | "copilot") => void;
  onOpenAbout: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  onToggleTab,
  onOpenAbout,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 select-none pointer-events-auto">
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl">
        {/* WebMCP Inspector Trigger */}
        <button
          onClick={() => onToggleTab("inspector")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "inspector"
              ? "bg-indigo-600 text-white shadow-md font-semibold"
              : "text-neutral-300 hover:bg-neutral-800/80 hover:text-white"
          }`}
          title="Toggle WebMCP Inspector & Live Telemetry"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Inspector</span>
        </button>

        {/* AI Copilot Trigger */}
        <button
          onClick={() => onToggleTab("copilot")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "copilot"
              ? "bg-indigo-600 text-white shadow-md font-semibold"
              : "text-neutral-300 hover:bg-neutral-800/80 hover:text-white"
          }`}
          title="Toggle AetherDraw AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Copilot</span>
        </button>

        <div className="w-[1px] h-4 bg-neutral-800 my-auto" />

        {/* Help & Project References */}
        <button
          onClick={onOpenAbout}
          className="px-2 py-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-100 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          title="Help, Documentation & Project References"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">Help</span>
        </button>
      </div>
    </div>
  );
};
