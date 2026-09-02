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
  console.log('Testing exact user console payload...\n');
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

  page.on('console', (msg) => console.log('  [Console]', msg.text()));

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Execute the exact command from user's screenshot
  console.log('Executing create_diagram with edges & shape aliases...');
  const result = await page.evaluate(async () => {
    return await document.modelContext.executeTool("create_diagram", {
      title: "Kubernetes Microservices Architecture",
      diagramType: "architecture",
      theme: "cyberpunk",
      layoutDirection: "TB",
      nodes: [
        { id: "ingress", label: "Nginx Ingress", shape: "rectangle", category: "entry" },
        { id: "auth_svc", label: "Auth Service", shape: "rectangle", category: "service" },
        { id: "order_svc", label: "Order Service", shape: "rectangle", category: "service" },
        { id: "redis", label: "Redis Session Cache", shape: "database", category: "storage" },
        { id: "postgres", label: "PostgreSQL Database", shape: "database", category: "storage" }
      ],
      edges: [
        { from: "ingress", to: "auth_svc", label: "verify token" },
        { from: "ingress", to: "order_svc", label: "/api/orders" },
        { from: "auth_svc", to: "redis", label: "read session" },
        { from: "order_svc", to: "postgres", label: "write orders" }
      ]
    });
  });

  console.log('Result:', result);
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: path.resolve('public/v8-user-command-success.png') });
  console.log('Saved screenshot to: public/v8-user-command-success.png');

  await browser.close();
  if (viteProcess) viteProcess.kill();
  console.log('\nTest completed successfully!');
}

run().catch((e) => {
  console.error('Test failed with error:', e);
  process.exit(1);
});
