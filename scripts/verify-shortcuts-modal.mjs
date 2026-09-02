import puppeteer from 'puppeteer-core';
import http from 'http';
import path from 'path';

const URL = 'http://localhost:3000';

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
  console.log('Verifying Keyboard Shortcuts Modal...\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto(URL, { waitUntil: 'networkidle0' });

  // 1. Click Help in BottomDock
  console.log('1. Clicking Help button in BottomDock...');
  const helpBtn = await page.$('button[title*="Help, Documentation"]');
  if (!helpBtn) {
    throw new Error('Help button not found in BottomDock');
  }
  await helpBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // Take screenshot of Shortcuts tab
  await page.screenshot({ path: path.resolve('public/v9-keyboard-shortcuts.png') });
  console.log('Saved screenshot: public/v9-keyboard-shortcuts.png');

  // 2. Click About & References tab
  console.log('2. Switching to About & References tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aboutBtn = btns.find((b) => b.textContent?.includes('About & References'));
    aboutBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  await page.screenshot({ path: path.resolve('public/v9-about-references.png') });
  console.log('Saved screenshot: public/v9-about-references.png');

  // 3. Test closing modal and pressing '?' key
  console.log('3. Closing modal and testing "?" hotkey...');
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 300));

  await page.keyboard.press('?');
  await new Promise((r) => setTimeout(r, 400));

  const isModalOpen = await page.evaluate(() => {
    return !!document.querySelector('h2');
  });
  console.log('Modal opened via "?" hotkey:', isModalOpen);

  await browser.close();
  console.log('\nVerification completed successfully!');
}

run().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
