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
  console.log('Testing Flowchart obstacle-avoidance routing...\n');
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

  await page.evaluate(async () => {
    await document.modelContext.executeTool('create_diagram', {
      title: 'User Authentication & Onboarding Flow',
      diagramType: 'flowchart',
      layoutDirection: 'TB',
      theme: 'nord',
      clearExisting: true,
      nodes: [
        { id: 'start', label: 'User Visits App', type: 'ellipse' },
        { id: 'login_check', label: 'Active Session?', type: 'diamond' },
        { id: 'dashboard', label: 'Redirect to Dashboard', type: 'rectangle' },
        { id: 'prompt_auth', label: 'Display Login Form', type: 'rectangle' },
        { id: 'credentials', label: 'Valid Credentials?', type: 'diamond' },
        { id: '2fa', label: '2FA Code Verified?', type: 'diamond' },
        { id: 'error', label: 'Rate Limit & Error Message', type: 'rectangle' },
      ],
      connections: [
        { from: 'start', to: 'login_check' },
        { from: 'login_check', to: 'dashboard', label: 'Yes' },
        { from: 'login_check', to: 'prompt_auth', label: 'No' },
        { from: 'prompt_auth', to: 'credentials', label: 'Submit Form' },
        { from: 'credentials', to: '2fa', label: 'Yes' },
        { from: 'credentials', to: 'error', label: 'No' },
        { from: '2fa', to: 'dashboard', label: 'Success' },
        { from: '2fa', to: 'error', label: 'Fail' },
      ],
    });
  });

  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.resolve('public/flowchart-avoidance-test.png') });
  console.log('Saved screenshot: public/flowchart-avoidance-test.png');

  await browser.close();
  if (viteProcess) viteProcess.kill();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
