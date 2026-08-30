import type { DiagramSpec } from "../types";

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  spec: Omit<DiagramSpec, "theme">;
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
  architecture: {
    id: "architecture",
    name: "Cloud Microservices Architecture",
    category: "Architecture",
    description: "API Gateway, Microservices, PostgreSQL & Redis Cache",
    spec: {
      title: "Microservices Cloud Architecture",
      diagramType: "architecture",
      layoutDirection: "TB",
      nodes: [
        { id: "client", label: "Web / Mobile Client", type: "rectangle" },
        { id: "cdn", label: "Cloudflare Edge CDN", type: "cloud" },
        { id: "gateway", label: "API Gateway & Router", type: "rectangle" },
        { id: "auth", label: "Auth Service (JWT)", type: "rectangle" },
        { id: "orders", label: "Order Service", type: "rectangle" },
        { id: "inventory", label: "Inventory Service", type: "rectangle" },
        { id: "db_orders", label: "Orders PostgreSQL", type: "cylinder" },
        { id: "redis", label: "Redis Session Cache", type: "cylinder" },
      ],
      connections: [
        { from: "client", to: "cdn", label: "HTTPS / TLS" },
        { from: "cdn", to: "gateway", label: "Origin Request" },
        { from: "gateway", to: "auth", label: "Validate Token" },
        { from: "gateway", to: "orders", label: "Route /orders" },
        { from: "gateway", to: "inventory", label: "Route /inventory" },
        { from: "auth", to: "redis", label: "Token Lookup" },
        { from: "orders", to: "db_orders", label: "ACID Transaction" },
        { from: "orders", to: "inventory", label: "Check Stock", style: "dashed" },
      ],
    },
  },

  flowchart: {
    id: "flowchart",
    name: "User Authentication & 2FA Flow",
    category: "Flowchart",
    description: "Login decisions, password validation and 2FA branches",
    spec: {
      title: "User Authentication & Onboarding Flow",
      diagramType: "flowchart",
      layoutDirection: "TB",
      nodes: [
        { id: "start", label: "User Visits App", type: "ellipse" },
        { id: "login_check", label: "Active Session?", type: "diamond" },
        { id: "dashboard", label: "Redirect to Dashboard", type: "rectangle" },
        { id: "prompt_auth", label: "Display Login Form", type: "rectangle" },
        { id: "credentials", label: "Valid Credentials?", type: "diamond" },
        { id: "2fa", label: "2FA Code Verified?", type: "diamond" },
        { id: "error", label: "Rate Limit & Error Message", type: "rectangle" },
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
    },
  },

  erd: {
    id: "erd",
    name: "E-Commerce Database Schema (ERD)",
    category: "Database",
    description: "Relational database tables, keys, and foreign cardinality",
    spec: {
      title: "E-Commerce Relational Database Schema (ERD)",
      diagramType: "erd",
      layoutDirection: "LR",
      nodes: [
        { id: "users", label: "Users Table\n(id, email, password_hash, role)", type: "rectangle" },
        { id: "orders", label: "Orders Table\n(id, user_id, total, status)", type: "rectangle" },
        { id: "items", label: "OrderItems Table\n(id, order_id, product_id, qty)", type: "rectangle" },
        { id: "products", label: "Products Table\n(id, sku, price, stock_qty)", type: "rectangle" },
        { id: "payments", label: "Payments Table\n(id, order_id, amount, status)", type: "rectangle" },
        { id: "shipping", label: "Shipments Table\n(id, order_id, tracking_number)", type: "rectangle" },
      ],
      connections: [
        { from: "users", to: "orders", label: "1 : N" },
        { from: "orders", to: "items", label: "1 : N" },
        { from: "products", to: "items", label: "1 : N" },
        { from: "orders", to: "payments", label: "1 : 1" },
        { from: "orders", to: "shipping", label: "1 : 1" },
      ],
    },
  },

  cicd: {
    id: "cicd",
    name: "CI/CD Cloud DevOps Pipeline",
    category: "DevOps",
    description: "Commit push, test suite, Docker container build & canary deploy",
    spec: {
      title: "Automated CI/CD DevOps Pipeline",
      diagramType: "architecture",
      layoutDirection: "LR",
      nodes: [
        { id: "git_push", label: "Git Push to Main", type: "ellipse" },
        { id: "lint", label: "Lint & Type Check", type: "rectangle" },
        { id: "test", label: "Unit & Integration Tests", type: "rectangle" },
        { id: "docker", label: "Docker Image Build", type: "rectangle" },
        { id: "registry", label: "Container Registry", type: "cylinder" },
        { id: "staging", label: "Staging Cluster Deploy", type: "rectangle" },
        { id: "canary", label: "Canary Health Check", type: "diamond" },
        { id: "prod", label: "Production Release", type: "rectangle" },
      ],
      connections: [
        { from: "git_push", to: "lint", label: "Trigger Action" },
        { from: "lint", to: "test", label: "Pass" },
        { from: "test", to: "docker", label: "Pass" },
        { from: "docker", to: "registry", label: "Push Image" },
        { from: "registry", to: "staging", label: "Pull & Deploy" },
        { from: "staging", to: "canary", label: "Run E2E Suite" },
        { from: "canary", to: "prod", label: "Healthy (100%)" },
      ],
    },
  },

  api_lifecycle: {
    id: "api_lifecycle",
    name: "REST API Request Lifecycle",
    category: "Backend",
    description: "WAF, rate limiting, routing, auth, controller & SQL queries",
    spec: {
      title: "REST API Request & Response Lifecycle",
      diagramType: "architecture",
      layoutDirection: "TB",
      nodes: [
        { id: "http_req", label: "HTTP Request from Client", type: "ellipse" },
        { id: "waf", label: "Cloudflare WAF & DDoS Shield", type: "cloud" },
        { id: "rate_limiter", label: "Rate Limiter Middleware", type: "diamond" },
        { id: "router", label: "API Router & Dispatcher", type: "rectangle" },
        { id: "auth_guard", label: "JWT Auth Guard", type: "diamond" },
        { id: "controller", label: "Business Controller", type: "rectangle" },
        { id: "database", label: "PostgreSQL Database", type: "cylinder" },
        { id: "json_res", label: "HTTP 200 JSON Response", type: "ellipse" },
      ],
      connections: [
        { from: "http_req", to: "waf" },
        { from: "waf", to: "rate_limiter" },
        { from: "rate_limiter", to: "router", label: "Under Quota" },
        { from: "router", to: "auth_guard" },
        { from: "auth_guard", to: "controller", label: "Authorized" },
        { from: "controller", to: "database", label: "Query / Mutation" },
        { from: "database", to: "controller", label: "Result Set" },
        { from: "controller", to: "json_res", label: "Serialize JSON" },
      ],
    },
  },

  agent_loop: {
    id: "agent_loop",
    name: "AI Agent Reasoning & WebMCP Loop",
    category: "AI / WebMCP",
    description: "LLM Cognitive Loop: Planner, WebMCP execution & canvas sync",
    spec: {
      title: "AI Agent Reasoning & WebMCP Tool Execution Loop",
      diagramType: "mindmap",
      layoutDirection: "TB",
      nodes: [
        { id: "user_goal", label: "Human Goal / Request", type: "ellipse" },
        { id: "context", label: "Canvas State Context\n(get_canvas_state)", type: "rectangle" },
        { id: "planner", label: "LLM Cognitive Planner\n(ChatGPT / Chrome AI)", type: "cloud" },
        { id: "tool_call", label: "WebMCP Tool Invocation\n(create_diagram / layout)", type: "rectangle" },
        { id: "execution", label: "Deterministic Canvas Execution\n(Excalidraw API)", type: "rectangle" },
        { id: "verification", label: "Visual Scene Verification\n(scrollToContent & AST check)", type: "diamond" },
      ],
      connections: [
        { from: "user_goal", to: "planner", label: "User Input" },
        { from: "planner", to: "tool_call", label: "JSON Schema Call" },
        { from: "tool_call", to: "execution", label: "Mutate Scene" },
        { from: "execution", to: "verification", label: "60fps Render" },
        { from: "verification", to: "context", label: "Update AST" },
        { from: "context", to: "planner", label: "Spatial Awareness" },
      ],
    },
  },

  system_design: {
    id: "system_design",
    name: "AetherDraw Architecture",
    category: "AetherDraw",
    description: "WebMCP Protocol, Tool Registry, Dagre/ELK & Excalidraw Core",
    spec: {
      title: "AetherDraw -- Agent-Native Architecture",
      diagramType: "architecture",
      layoutDirection: "TB",
      nodes: [
        { id: "agent", label: "AI Agent (ChatGPT / Chrome AI)", type: "cloud" },
        { id: "human_user", label: "Human Co-Creator", type: "ellipse" },
        { id: "webmcp_layer", label: "WebMCP Standard Protocol\n(document.modelContext)", type: "rectangle" },
        { id: "tool_registry", label: "WebMCP Tool Registry\n(11 Granular Tools)", type: "rectangle" },
        { id: "layout_engine", label: "Graph Layout Engine\n(Dagre / ELK.js)", type: "rectangle" },
        { id: "telemetry_stream", label: "Live Telemetry & Logs\n(webMCPEventManager)", type: "cylinder" },
        { id: "excalidraw_core", label: "Excalidraw 60fps Canvas\n(Scene Graph & AST)", type: "rectangle" },
      ],
      connections: [
        { from: "agent", to: "webmcp_layer", label: "Invokes WebMCP Tools" },
        { from: "human_user", to: "excalidraw_core", label: "Direct Canvas Drawing" },
        { from: "webmcp_layer", to: "tool_registry", label: "Dispatches Execution" },
        { from: "tool_registry", to: "layout_engine", label: "Computes Coordinates" },
        { from: "tool_registry", to: "telemetry_stream", label: "Logs Execution" },
        { from: "layout_engine", to: "excalidraw_core", label: "updateScene()" },
        { from: "excalidraw_core", to: "tool_registry", label: "get_canvas_state()" },
      ],
    },
  },
};
