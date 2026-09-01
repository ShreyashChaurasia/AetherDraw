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
  console.log('Verifying V7 layout (TopNav, BottomDock, No Help Icon, About Modal)...\n');
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

  // 1. Capture clean default screen (TopNav on top-right, BottomDock on bottom-right, NO ? help icon)
  console.log('1. Capturing clean canvas layout...');
  await page.screenshot({ path: path.resolve('public/v7-clean-layout.png') });
  console.log('   Saved: public/v7-clean-layout.png');

  // 2. Click "Help" in BottomDock
  console.log('2. Clicking Help in BottomDock...');
  await page.evaluate(() => {
    const helpBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Help');
    if (helpBtn) helpBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.resolve('public/v7-about-modal.png') });
  console.log('   Saved: public/v7-about-modal.png');

  // Close modal
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 3. Click "Inspector" in BottomDock
  console.log('3. Clicking Inspector in BottomDock...');
  await page.evaluate(() => {
    const inspectorBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Inspector'));
    if (inspectorBtn) inspectorBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.resolve('public/v7-inspector-drawer.png') });
  console.log('   Saved: public/v7-inspector-drawer.png');

  await browser.close();
  if (viteProcess) viteProcess.kill();
  console.log('\nVerification complete!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
