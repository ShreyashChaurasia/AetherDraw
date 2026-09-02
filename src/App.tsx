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
import { THEMES } from "./themes/palettes";
import { webMCPRegistry } from "./webmcp/registry";
import { TEMPLATES } from "./templates/catalog";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inspector" | "copilot" | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("default");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<"shortcuts" | "about">("shortcuts");

  const handleOpenHelp = (tab: "shortcuts" | "about" = "shortcuts") => {
    setHelpTab(tab);
    setIsAboutOpen(true);
  };

  useEffect(() => {
    // Initialize WebMCP registry
    webMCPRegistry.initialize();

    // Global keyboard listener for shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleOpenHelp("shortcuts");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setActiveTab((prev) => (prev === "copilot" ? null : "copilot"));
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setActiveTab((prev) => (prev === "inspector" ? null : "inspector"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to theme change events from WebMCP tools (e.g. when agent runs create_diagram or apply_theme)
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const newTheme = e.detail?.theme;
      if (newTheme && THEMES[newTheme as ThemeName]) {
        setCurrentTheme(newTheme as ThemeName);
      }
    };
    window.addEventListener("aetherdraw:themechange", handleThemeChange);
    return () => window.removeEventListener("aetherdraw:themechange", handleThemeChange);
  }, []);

  const handleToggleTab = (tab: "inspector" | "copilot") => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const handleThemeSelect = async (theme: ThemeName) => {
    setCurrentTheme(theme);
    try {
      await webMCPRegistry.executeTool("apply_theme", { theme });
    } catch (err) {
      console.error("[Theme] Failed to apply theme:", err);
    }
  };

  const handleLayoutTrigger = async (direction: "TB" | "LR") => {
    try {
      await webMCPRegistry.executeTool("apply_auto_layout", { direction, engine: "dagre" });
    } catch (err) {
      console.error("[Layout] Failed to apply auto layout:", err);
    }
  };

  const handleExportTrigger = async (format: "svg" | "png") => {
    try {
      const res = await webMCPRegistry.executeTool("export_canvas", { format, darkMode: true });
      if (res?.dataUrl) {
        const a = document.createElement("a");
        a.href = res.dataUrl;
        a.download = `aetherdraw_diagram.${format}`;
        a.click();
      }
    } catch (err) {
      console.error("[Export] Failed to export canvas:", err);
    }
  };

  const handleTemplateSelect = async (templateKey: string) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      try {
        await webMCPRegistry.executeTool("create_diagram", {
          ...template.spec,
          theme: currentTheme,
          clearExisting: true,
        });
      } catch (err) {
        console.error("[Template] Failed to load template:", err);
      }
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
        onOpenAbout={() => handleOpenHelp("about")}
      />

      {/* 2. Full-Screen Canvas */}
      <div className="w-full h-full flex overflow-hidden relative">
        <main
          className="flex-1 h-full relative transition-colors duration-300"
          style={{ backgroundColor: THEMES[currentTheme]?.canvasBackground || "#090d16" }}
        >
          <ExcalidrawCanvas
            theme={THEMES[currentTheme]?.isDark === false ? "light" : "dark"}
            onOpenAbout={() => handleOpenHelp("about")}
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
        onOpenAbout={() => handleOpenHelp("shortcuts")}
      />

      {/* 4. About, Documentation & References Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        initialTab={helpTab}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 5. Toast Notification Container */}
      <Toast />
    </div>
  );
};
