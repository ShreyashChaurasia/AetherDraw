import React, { useState, useEffect } from "react";
import { ExcalidrawCanvas } from "./components/Canvas/ExcalidrawCanvas";
import { Header } from "./components/UI/Header";
import { Sidebar } from "./components/UI/Sidebar";
import { ToolInspector } from "./components/Inspector/ToolInspector";
import { ToolLog } from "./components/Inspector/ToolLog";
import { CopilotPanel } from "./components/Copilot/CopilotPanel";
import { Toast } from "./components/UI/Toast";
import type { ThemeName } from "./types";
import { webMCPRegistry } from "./webmcp/registry";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inspector" | "copilot" | null>("inspector");

  useEffect(() => {
    // Initialize WebMCP registry
    webMCPRegistry.initialize();
  }, []);

  const handleToggleTab = (tab: "inspector" | "copilot") => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const handleThemeSelect = async (theme: ThemeName) => {
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

  const handleTemplateSelect = async (template: string) => {
    const modelContext = (document as any).modelContext;
    if (!modelContext) return;

    if (template === "architecture") {
      await modelContext.executeTool("create_diagram", {
        title: "Microservices Cloud Architecture",
        diagramType: "architecture",
        layoutDirection: "TB",
        theme: "nord",
        clearExisting: true,
        nodes: [
          { id: "client", label: "Web / Mobile App", type: "rectangle" },
          { id: "cdn", label: "Cloudflare Edge", type: "cloud" },
          { id: "gateway", label: "API Gateway", type: "rectangle" },
          { id: "auth", label: "Auth Service", type: "rectangle" },
          { id: "orders", label: "Order Service", type: "rectangle" },
          { id: "inventory", label: "Inventory Service", type: "rectangle" },
          { id: "db_orders", label: "Orders PostgreSQL", type: "cylinder" },
          { id: "redis", label: "Redis Session Cache", type: "cylinder" },
        ],
        connections: [
          { from: "client", to: "cdn", label: "HTTPS / TLS" },
          { from: "cdn", to: "gateway", label: "Origin Request" },
          { from: "gateway", to: "auth", label: "Validate JWT" },
          { from: "gateway", to: "orders", label: "Route /orders" },
          { from: "gateway", to: "inventory", label: "Route /inventory" },
          { from: "auth", to: "redis", label: "Token Lookup" },
          { from: "orders", to: "db_orders", label: "ACID Transactions" },
          { from: "orders", to: "inventory", label: "gRPC Check Stock", style: "dashed" },
        ],
      });
    } else if (template === "flowchart") {
      await modelContext.executeTool("create_diagram", {
        title: "User Authentication & Onboarding Flow",
        diagramType: "flowchart",
        layoutDirection: "TB",
        theme: "pastel",
        clearExisting: true,
        nodes: [
          { id: "start", label: "User Visits App", type: "ellipse" },
          { id: "login_check", label: "Has Active Session?", type: "diamond" },
          { id: "dashboard", label: "Redirect to Dashboard", type: "rectangle" },
          { id: "prompt_auth", label: "Display Login / Register", type: "rectangle" },
          { id: "credentials", label: "Valid Credentials?", type: "diamond" },
          { id: "2fa", label: "2FA Verified?", type: "diamond" },
          { id: "error", label: "Show Error & Rate Limit", type: "rectangle" },
        ],
        connections: [
          { from: "start", to: "login_check" },
          { from: "login_check", to: "dashboard", label: "Yes" },
          { from: "login_check", to: "prompt_auth", label: "No" },
          { from: "prompt_auth", to: "credentials", label: "Submit Form" },
          { from: "credentials", to: "2fa", label: "Yes" },
          { from: "credentials", to: "error", label: "No" },
          { from: "2fa", to: "dashboard", label: "Success" },
          { from: "2fa", to: "error", label: "Fail" },
        ],
      });
    } else if (template === "erd") {
      await modelContext.executeTool("create_diagram", {
        title: "E-Commerce Database Entity-Relationship Diagram",
        diagramType: "erd",
        layoutDirection: "LR",
        theme: "blueprint",
        clearExisting: true,
        nodes: [
          { id: "users", label: "Users Table\n(id, email, role, created_at)", type: "rectangle" },
          { id: "orders", label: "Orders Table\n(id, user_id, total, status)", type: "rectangle" },
          { id: "items", label: "OrderItems Table\n(id, order_id, product_id, qty)", type: "rectangle" },
          { id: "products", label: "Products Table\n(id, sku, price, stock)", type: "rectangle" },
          { id: "payments", label: "Payments Table\n(id, order_id, amount, provider)", type: "rectangle" },
        ],
        connections: [
          { from: "users", to: "orders", label: "1 : N" },
          { from: "orders", to: "items", label: "1 : N" },
          { from: "products", to: "items", label: "1 : N" },
          { from: "orders", to: "payments", label: "1 : 1" },
        ],
      });
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Top Navigation & Controls */}
      <Header
        activeTab={activeTab}
        onToggleTab={handleToggleTab}
        onThemeSelect={handleThemeSelect}
        onLayoutTrigger={handleLayoutTrigger}
        onExportTrigger={handleExportTrigger}
        onTemplateSelect={handleTemplateSelect}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 h-full relative">
          <ExcalidrawCanvas theme="dark" />
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

      {/* Toast Notification Container */}
      <Toast />
    </div>
  );
};
