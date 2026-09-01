import React, { useState, useEffect } from "react";
import { ExcalidrawCanvas } from "./components/Canvas/ExcalidrawCanvas";
import { TopNav } from "./components/UI/TopNav";
import { BottomDock } from "./components/UI/BottomDock";
import { Sidebar } from "./components/UI/Sidebar";
import { ToolInspector } from "./components/Inspector/ToolInspector";
import { ToolLog } from "./components/Inspector/ToolLog";
import { CopilotPanel } from "./components/Copilot/CopilotPanel";
import { AboutModal } from "./components/UI/AboutModal";
import { Toast } from "./components/UI/Toast";
import type { ThemeName } from "./types";
import { webMCPRegistry } from "./webmcp/registry";
import { TEMPLATES } from "./templates/catalog";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inspector" | "copilot" | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("default");
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    // Initialize WebMCP registry
    webMCPRegistry.initialize();
  }, []);

  const handleToggleTab = (tab: "inspector" | "copilot") => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const handleThemeSelect = async (theme: ThemeName) => {
    setCurrentTheme(theme);
    const modelContext = (document as any).modelContext;
    if (modelContext) {
      await modelContext.executeTool("apply_theme", { theme });
    }
  };

  const handleLayoutTrigger = async (direction: "TB" | "LR") => {
    const modelContext = (document as any).modelContext;
    if (modelContext) {
      await modelContext.executeTool("apply_auto_layout", { direction, engine: "dagre" });
    }
  };

  const handleExportTrigger = async (format: "svg" | "png") => {
    const modelContext = (document as any).modelContext;
    if (modelContext) {
      const res = await modelContext.executeTool("export_canvas", { format, darkMode: true });
      if (res?.dataUrl) {
        const a = document.createElement("a");
        a.href = res.dataUrl;
        a.download = `aetherdraw_diagram.${format}`;
        a.click();
      }
    }
  };

  const handleTemplateSelect = async (templateKey: string) => {
    const modelContext = (document as any).modelContext;
    if (!modelContext) return;

    const template = TEMPLATES[templateKey];
    if (template) {
      await modelContext.executeTool("create_diagram", {
        ...template.spec,
        theme: currentTheme,
        clearExisting: true,
      });
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 relative">
      {/* 1. Top Options Menu (Templates, Themes, Layout, Export & AetherDraw Title) */}
      <TopNav
        currentTheme={currentTheme}
        onThemeSelect={handleThemeSelect}
        onLayoutTrigger={handleLayoutTrigger}
        onExportTrigger={handleExportTrigger}
        onTemplateSelect={handleTemplateSelect}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* 2. Full-Screen Canvas */}
      <div className="w-full h-full flex overflow-hidden relative">
        <main className="flex-1 h-full relative">
          <ExcalidrawCanvas
            theme="dark"
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        </main>

        {/* Right Drawer (Inspector / Copilot) */}
        <Sidebar
          isOpen={activeTab !== null}
          onClose={() => setActiveTab(null)}
          title={activeTab === "inspector" ? "WebMCP Inspector & Telemetry" : "AetherDraw AI Copilot"}
        >
          {activeTab === "inspector" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <ToolInspector />
              </div>
              <div className="h-64 shrink-0 overflow-hidden">
                <ToolLog />
              </div>
            </div>
          )}
          {activeTab === "copilot" && <CopilotPanel />}
        </Sidebar>
      </div>

      {/* 3. Bottom-Right Agent & Help Dock (Inspector, AI Copilot, Help) */}
      <BottomDock
        activeTab={activeTab}
        onToggleTab={handleToggleTab}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* 4. About, Documentation & References Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 5. Toast Notification Container */}
      <Toast />
    </div>
  );
};
