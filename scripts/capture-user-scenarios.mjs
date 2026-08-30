import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServer()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function run() {
  console.log('Capturing screenshots for user test scenarios (ERD, AI Agent Loop, Architecture)...\n');
  let viteProcess = null;

  if (!(await checkServer())) {
    console.log('Launching Vite server...');
    viteProcess = spawn('npm', ['run', 'dev'], { stdio: 'pipe', shell: true, env: { ...process.env } });
    await waitForServer();
  }

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Scenario 1: ERD Diagram
  console.log('1. Rendering ERD Diagram...');
  await page.evaluate(async () => {
    await document.modelContext.executeTool('create_diagram', {
      title: 'E-Commerce Relational Database Schema (ERD)',
      diagramType: 'erd',
      layoutDirection: 'LR',
      theme: 'nord',
      clearExisting: true,
      nodes: [
        { id: 'users', label: 'Users Table\n(id, email, password_hash, role)', type: 'rectangle' },
        { id: 'orders', label: 'Orders Table\n(id, user_id, total, status)', type: 'rectangle' },
        { id: 'items', label: 'OrderItems Table\n(id, order_id, product_id, qty)', type: 'rectangle' },
        { id: 'products', label: 'Products Table\n(id, sku, price, stock_qty)', type: 'rectangle' },
        { id: 'payments', label: 'Payments Table\n(id, order_id, amount, status)', type: 'rectangle' },
        { id: 'shipping', label: 'Shipments Table\n(id, order_id, tracking_number)', type: 'rectangle' },
      ],
      connections: [
        { from: 'users', to: 'orders', label: '1 : N' },
        { from: 'orders', to: 'items', label: '1 : N' },
        { from: 'products', to: 'items', label: '1 : N' },
        { from: 'orders', to: 'payments', label: '1 : 1' },
        { from: 'orders', to: 'shipping', label: '1 : 1' },
      ],
    });
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.resolve('public/scenario-1-erd.png') });
  console.log('   Saved: public/scenario-1-erd.png');

  // Scenario 2: AI Agent Loop (with upward feedback cycle)
  console.log('2. Rendering AI Agent Loop...');
  await page.evaluate(async () => {
    await document.modelContext.executeTool('create_diagram', {
      title: 'AI Agent Reasoning & WebMCP Tool Execution Loop',
      diagramType: 'mindmap',
      layoutDirection: 'TB',
      theme: 'nord',
      clearExisting: true,
      nodes: [
        { id: 'user_goal', label: 'Human Goal / Request', type: 'ellipse' },
        { id: 'context', label: 'Canvas State Context\n(get_canvas_state)', type: 'rectangle' },
        { id: 'planner', label: 'LLM Cognitive Planner\n(ChatGPT / Chrome AI)', type: 'cloud' },
        { id: 'tool_call', label: 'WebMCP Tool Invocation\n(create_diagram / layout)', type: 'rectangle' },
        { id: 'execution', label: 'Deterministic Canvas Execution\n(Excalidraw API)', type: 'rectangle' },
        { id: 'verification', label: 'Visual Scene Verification\n(scrollToContent & AST check)', type: 'diamond' },
      ],
      connections: [
        { from: 'user_goal', to: 'planner', label: 'User Input' },
        { from: 'planner', to: 'tool_call', label: 'JSON Schema Call' },
        { from: 'tool_call', to: 'execution', label: 'Mutate Scene' },
        { from: 'execution', to: 'verification', label: '60fps Render' },
        { from: 'verification', to: 'context', label: 'Update AST' },
        { from: 'context', to: 'planner', label: 'Spatial Awareness' },
      ],
    });
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.resolve('public/scenario-2-agent-loop.png') });
  console.log('   Saved: public/scenario-2-agent-loop.png');

  // Scenario 3: AetherDraw Architecture
  console.log('3. Rendering AetherDraw Architecture...');
  await page.evaluate(async () => {
    await document.modelContext.executeTool('create_diagram', {
      title: 'AetherDraw -- Agent-Native Architecture',
      diagramType: 'architecture',
      layoutDirection: 'TB',
      theme: 'nord',
      clearExisting: true,
      nodes: [
        { id: 'agent', label: 'AI Agent (ChatGPT / Chrome AI)', type: 'cloud' },
        { id: 'webmcp_layer', label: 'WebMCP Standard Protocol\n(document.modelContext)', type: 'rectangle' },
        { id: 'tool_registry', label: 'WebMCP Tool Registry\n(11 Granular Tools)', type: 'rectangle' },
        { id: 'layout_engine', label: 'Graph Layout Engines\n(Dagre / ELK.js)', type: 'rectangle' },
        { id: 'excalidraw_core', label: 'Excalidraw 60fps Canvas\n(Scene Graph & AST)', type: 'rectangle' },
        { id: 'telemetry_stream', label: 'Live Telemetry & Logs\n(webMCPEventManager)', type: 'cylinder' },
        { id: 'human_user', label: 'Human Co-Creator', type: 'ellipse' },
      ],
      connections: [
        { from: 'agent', to: 'webmcp_layer', label: 'Discovers & Calls Tools' },
        { from: 'webmcp_layer', to: 'tool_registry', label: 'Dispatches Call' },
        { from: 'tool_registry', to: 'layout_engine', label: 'Calculates (x, y)' },
        { from: 'tool_registry', to: 'telemetry_stream', label: 'Logs Events' },
        { from: 'layout_engine', to: 'excalidraw_core', label: 'updateScene()' },
        { from: 'human_user', to: 'excalidraw_core', label: 'Direct Canvas Edits' },
        { from: 'excalidraw_core', to: 'tool_registry', label: 'get_canvas_state()' },
      ],
    });
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.resolve('public/scenario-3-architecture.png') });
  console.log('   Saved: public/scenario-3-architecture.png');

  await browser.close();
  if (viteProcess) viteProcess.kill();
  console.log('\nAll scenario screenshots captured successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
