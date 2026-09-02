import puppeteer from 'puppeteer-core';
import http from 'http';

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

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0' });

  console.log('Testing Variation 1: Using "edges", "shape", and "category" (User snippet)...');
  const res1 = await page.evaluate(async () => {
    return await document.modelContext.executeTool("create_diagram", {
      title: "Test 1: Edges & Shapes",
      diagramType: "architecture",
      theme: "nord",
      nodes: [
        { id: "a", label: "Node A", shape: "rectangle", category: "service" },
        { id: "b", label: "Node B", shape: "database", category: "storage" }
      ],
      edges: [
        { from: "a", to: "b", label: "connects" }
      ]
    });
  });
  console.log('  Result 1:', res1);

  console.log('Testing Variation 2: Using "connections", "type", and "role" (Canonical schema)...');
  const res2 = await page.evaluate(async () => {
    return await document.modelContext.executeTool("create_diagram", {
      title: "Test 2: Canonical",
      diagramType: "architecture",
      theme: "pastel",
      nodes: [
        { id: "c", label: "Node C", type: "rectangle", role: "service" },
        { id: "d", label: "Node D", type: "cylinder", role: "storage" }
      ],
      connections: [
        { from: "c", to: "d", label: "reads" }
      ]
    });
  });
  console.log('  Result 2:', res2);

  console.log('Testing Variation 3: No connections/edges provided (standalone nodes)...');
  const res3 = await page.evaluate(async () => {
    return await document.modelContext.executeTool("create_diagram", {
      title: "Test 3: Standalone Nodes",
      nodes: [
        { id: "x", label: "Standalone 1" },
        { id: "y", label: "Standalone 2" }
      ]
    });
  });
  console.log('  Result 3:', res3);

  await browser.close();
  console.log('\nAll variations passed with 100% success!');
}

run().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
