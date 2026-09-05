/* Records the deck by driving the browser clock.
   Time is frozen, then advanced by an exact step before every frame, so the
   intervals are perfect and nothing is resampled.

   It helps, but not enough: measured on a running counter, 57 % of frames are
   identical to the previous one, against 72 % for the plain screencast and
   19 % for a screen recording. The DOM updates fine — requestAnimationFrame
   runs at 154 virtual Hz — but captureScreenshot returns a frame the
   compositor has not finished composing, and the call that would force one
   composited frame per step, HeadlessExperimental.beginFrame, was removed from
   Chromium. See references/export.md. */
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [url, length, folder] = process.argv.slice(2);
const FPS = Number(process.env.FPS || 50);
const QUALITY = Number(process.env.QUALITY || 95);
const STEP = 1000 / FPS;

function findChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const cache = process.platform === 'darwin'
    ? process.env.HOME + '/Library/Caches/ms-playwright'
    : process.env.HOME + '/.cache/ms-playwright';
  const inside = process.platform === 'darwin'
    ? 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    : 'chrome-linux/chrome';
  if (!existsSync(cache)) throw new Error('No Playwright cache. Set CHROMIUM.');
  for (const v of readdirSync(cache)
        .filter(d => /^chromium-\d+$/.test(d))
        .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))) {
    const p = `${cache}/${v}/${inside}`;
    if (existsSync(p)) return p;
  }
  throw new Error('Chromium not found. Set CHROMIUM to its path.');
}

mkdirSync(folder, { recursive: true });

const nav = await chromium.launch({
  executablePath: findChromium(),
  args: [
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--force-device-scale-factor=1', '--hide-scrollbars',
    /* animation must stay on the main thread, or the clock loses hold of it */
    '--disable-threaded-animation', '--disable-threaded-scrolling',
    '--disable-checker-imaging', '--disable-image-animation-resync',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--run-all-compositor-stages-before-draw', '--disable-new-content-rendering-timeout',
    '--disable-gpu'
  ]
});
const ctx = await nav.newContext({
  viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Player);

const cdp = await ctx.newCDPSession(page);

async function advance(ms) {
  const done = new Promise(r => cdp.once('Emulation.virtualTimeBudgetExpired', r));
  await cdp.send('Emulation.setVirtualTimePolicy',
                 { policy: 'pauseIfNetworkFetchesPending', budget: ms });
  await done;
}

await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
await page.evaluate(() => {
  const b = document.getElementById('start-button');
  if (b) b.click();
  document.body.classList.remove('show-hint');
});

const total = Math.round(Number(length) * FPS);
for (let i = 0; i < total; i++) {
  const img = await cdp.send('Page.captureScreenshot',
                             { format: 'jpeg', quality: QUALITY, captureBeyondViewport: false });
  writeFileSync(join(folder, 'f' + String(i).padStart(6, '0') + '.jpg'),
                Buffer.from(img.data, 'base64'));
  await advance(STEP);
  if (i % 250 === 0) process.stderr.write(`  ${i}/${total}\n`);
}

await ctx.close();
await nav.close();
console.log(`${total} frames at ${FPS} fps, ${STEP} ms step`);
