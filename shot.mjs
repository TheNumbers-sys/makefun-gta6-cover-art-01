import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '/home/hatch/workspace/make-fun/tools/shot/node_modules/playwright-core/index.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const server = spawn('node', ['serve.ts', '--port', '8080'], { cwd: root, stdio: 'ignore' });
const output = join(root, 'screenshots');
const shots = [
  { name: '1-cover.jpg', query: 'cover', width: 1280, height: 720 },
  { name: '2-editor.jpg', query: 'editor', width: 1280, height: 800 },
  { name: '3-cover-portrait.jpg', query: 'cover-portrait', width: 1024, height: 1280 },
  { name: '4-cover-square.jpg', query: 'cover-square', width: 1080, height: 1080 },
];
let browser;
try {
  await mkdir(output, { recursive: true });
  await delay(450);
  browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', args: ['--no-sandbox'], headless: true });
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://localhost:8080/?shot=${shot.query}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
    if (errors.length) throw new Error(`${shot.name} browser errors: ${errors.join(' | ')}`);
    const canvasInfo = await page.locator('#cover').evaluate((canvas) => ({ width: canvas.width, height: canvas.height, pixels: canvas.toDataURL('image/png').length }));
    if (canvasInfo.pixels < 10000) throw new Error(`${shot.name} canvas did not paint`);
    if (shot.query === 'editor' && await page.locator('.photo-chip').count() !== 2) throw new Error('Editor sample photos did not load');
    await page.screenshot({ path: join(output, shot.name), type: 'jpeg', quality: 80 });
    if (shot.query === 'editor') {
      const downloadReady = page.waitForEvent('download');
      await page.locator('#export').click();
      const download = await downloadReady;
      if (!download.suggestedFilename().endsWith('.png')) throw new Error('Export did not produce a PNG');
    }
    await page.close();
    console.log(`Captured ${shot.name} ${shot.width}x${shot.height}`);
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
