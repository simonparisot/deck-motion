/* Measures how loaded each slide is. A deck that backs a talk must stay light.
   See references/writing.md for the limits and why they are what they are. */
import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:8790/index.html';
const LIMITS = { words: 15, blocks: 4, body: 24, bullets: 3 };

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

const nav = await chromium.launch({ executablePath: findChromium(), args: ['--hide-scrollbars'] });
const ctx = await nav.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Player);

const slides = await page.evaluate(() => window.Player.slides);
const report = [];

for (let i = 0; i < slides.length; i++) {
  await page.evaluate(i => window.Player.go(i, 99), i);   /* every step applied */
  await page.waitForTimeout(260);
  report.push(await page.evaluate(() => {
    const s = document.querySelector('.slide.is-active');
    const frame = { l: 0, t: 0, r: 1600, b: 900 };
    let words = 0, blocks = 0, body = Infinity, bullets = 0, heroes = 0, spill = [];

    s.querySelectorAll('*').forEach(n => {
      if (!n.children.length && n.textContent.trim()) {
        const st = getComputedStyle(n);
        if (st.visibility === 'hidden' || st.display === 'none') return;
        const px = parseFloat(st.fontSize);
        const t = n.textContent.trim();
        const m = t.split(/\s+/).length;
        /* a hero figure is not text you read */
        if (px >= 90 && m <= 4) { heroes++; return; }
        /* nor is an axis value */
        if (/^[\d\s.,%€$·—–-]+$/.test(t)) return;
        words += m; blocks++;
        /* an axis label is not text you read either: only judge the size
           of blocks of three words or more */
        if (m >= 3 && px < body) body = px;
      }
      if (n.tagName === 'LI') bullets++;
      const r = n.getBoundingClientRect();
      if (r.width && (r.left < frame.l - 1 || r.top < frame.t - 1 ||
                      r.right > frame.r + 1 || r.bottom > frame.b + 1)) {
        spill.push(n.className || n.tagName);
      }
    });
    const visuals = s.querySelectorAll('svg, img, canvas, .grid').length;
    return { id: s.id, words, blocks, heroes, visuals, bullets,
             body: body === Infinity ? null : Math.round(body),
             spill: spill.slice(0, 3) };
  }));
}
await nav.close();

let flagged = 0;
console.log('slide'.padEnd(18) + 'words blocks visuals  body   notes');
for (const s of report) {
  const n = [];
  if (s.words > LIMITS.words) n.push(`${s.words} words (max ${LIMITS.words})`);
  if (s.blocks > LIMITS.blocks) n.push(`${s.blocks} text blocks`);
  if (s.body && s.body < LIMITS.body) n.push(`body ${s.body}px (min ${LIMITS.body})`);
  if (s.bullets > LIMITS.bullets) n.push(`${s.bullets} bullets`);
  if (s.visuals > 1) n.push(`${s.visuals} visual objects`);
  if (s.heroes > 1) n.push(`${s.heroes} hero figures`);
  if (s.spill.length) n.push(`spills out: ${s.spill.join(', ')}`);
  if (n.length) flagged++;
  console.log(
    s.id.padEnd(18) +
    String(s.words).padStart(5) + String(s.blocks).padStart(7) +
    String(s.visuals).padStart(8) + String(s.body ?? '-').padStart(6) +
    '   ' + (n.length ? '! ' + n.join(' · ') : 'ok'));
}
console.log(`\n${report.length - flagged} / ${report.length} slides within limits.`);
if (flagged > report.length / 2)
  console.log('More than half the slides are loaded: the room will read instead of listen.');
