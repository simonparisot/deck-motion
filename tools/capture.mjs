/* Records the deck frame by frame, as near-lossless JPEG.
   Chromium's screencast timestamps every frame, which is how the start of
   the deck is recovered to the millisecond. */
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [url, length, folder] = process.argv.slice(2);
const QUALITY = Number(process.env.QUALITY || 97);

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
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio',
         '--force-device-scale-factor=1', '--hide-scrollbars',
         '--disable-frame-rate-limit', '--disable-gpu-vsync']
});
const ctx = await nav.newContext({
  viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Player);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  const name = 'f' + String(frames.length).padStart(6, '0') + '.jpg';
  frames.push({ name, t: f.metadata.timestamp });
  writeFileSync(join(folder, name), Buffer.from(f.data, 'base64'));
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg', quality: QUALITY, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1
});
await page.waitForTimeout(600);

/* The page reports its own start time, so the audio offset is exact. */
const start = await page.evaluate(() => {
  const b = document.getElementById('start-button');
  if (b) b.click();
  document.body.classList.remove('show-hint');
  return Date.now() / 1000;
});
await page.waitForTimeout(Number(length) * 1000 + 700);

await cdp.send('Page.stopScreencast');
await ctx.close();
await nav.close();

writeFileSync(join(folder, 'frames.json'),
              JSON.stringify({ start, length: Number(length), frames }));
const after = frames.filter(f => f.t >= start);
console.log(`${frames.length} frames, ${after.length} after the start`);
console.log(`start ${start.toFixed(3)} · first ${frames[0]?.t.toFixed(3)} · last ${frames.at(-1)?.t.toFixed(3)}`);
