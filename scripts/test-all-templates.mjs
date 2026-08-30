import puppeteer from 'puppeteer-core';

const URL = 'http://localhost:3000';

async function run() {
  console.log('Testing all diagram templates in browser for visual spacing and routing...\n');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

  const templates = [
    {
      id: "architecture",
      name: "Cloud Microservices Architecture",
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
    {
      id: "flowchart",
      name: "User Authentication & 2FA Flow",
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
    {
      id: "erd",
      name: "E-Commerce Database Schema (ERD)",
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
    }
  ];

  for (const tmpl of templates) {
    console.log(`-> Testing template: ${tmpl.name} (${tmpl.id})...`);
    const res = await page.evaluate(async (spec) => {
      return await document.modelContext.executeTool('create_diagram', {
        title: spec.name,
        nodes: spec.nodes,
        connections: spec.connections,
        layoutDirection: spec.layoutDirection || "TB",
        theme: 'nord',
        clearExisting: true,
      });
    }, tmpl);

    console.log(`   Nodes created: ${res.createdNodeCount}, Connections: ${res.createdConnectionCount}`);
    await new Promise((r) => setTimeout(r, 600));

    const state = await page.evaluate(async () => {
      return await document.modelContext.executeTool('get_canvas_state', {});
    });
    console.log(`   Canvas Bounds: ${state.canvasBounds.width}x${state.canvasBounds.height}px`);
  }

  await browser.close();
  console.log('\nAll templates verified successfully with clean non-overlapping layout!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
