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

  // 1. Capture clean UI view
  console.log('1. Capturing top-right toolbar with AetherDraw on the right...');
  await page.screenshot({ path: path.resolve('public/v6-top-right-header.png') });
  console.log('   Saved: public/v6-top-right-header.png');

  // 2. Open Excalidraw Help Dialog by clicking the bottom-right ? button
  console.log('2. Opening Help Dialog via bottom-right ? button...');
  await page.evaluate(() => {
    // Find the bottom right ? button in Excalidraw footer
    const helpBtn = document.querySelector('.help-icon') || 
                    document.querySelector('button[aria-label="Help"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '?');
    if (helpBtn) helpBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.resolve('public/v6-help-dialog.png') });
  console.log('   Saved: public/v6-help-dialog.png');

  // 3. Inspect the Help Dialog link hrefs
  const helpLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.HelpDialog__btn, .HelpDialog a'));
    return links.map((l) => ({ text: l.textContent?.trim(), href: l.getAttribute('href') }));
  });
  console.log('   Help Dialog Links Detected:', helpLinks);

  // 4. Click AetherDraw Title in the top-right to test AboutModal
  console.log('3. Testing AetherDraw Title click to open AboutModal...');
  await page.evaluate(() => {
    // Close help dialog if open (press escape)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 400));

  await page.evaluate(() => {
    const aetherBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('AetherDraw'));
    if (aetherBtn) aetherBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: path.resolve('public/v6-about-modal.png') });
  console.log('   Saved: public/v6-about-modal.png');

  await browser.close();
  if (viteProcess) viteProcess.kill();
  console.log('\nVerification complete!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
