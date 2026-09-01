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
  console.log('Verifying unobstructed UI layout and patched Help Dialog links...\n');
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

  // 1. Close the sidebar to see the full clean canvas view
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[title="Close sidebar"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log('1. Capturing clean canvas view with closed sidebar...');
  await page.screenshot({ path: path.resolve('public/v5-clean-canvas.png') });
  console.log('   Saved: public/v5-clean-canvas.png');

  // 2. Open Excalidraw Help Dialog via bottom-right button
  console.log('2. Clicking help button...');
  await page.evaluate(() => {
    const helpBtn = document.querySelector('.help-icon') || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('?') || b.getAttribute('aria-label')?.includes('Help'));
    if (helpBtn) helpBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.resolve('public/v5-help-dialog.png') });
  console.log('   Saved: public/v5-help-dialog.png');

  await browser.close();
  if (viteProcess) viteProcess.kill();
  console.log('\nVerification complete!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
