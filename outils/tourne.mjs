/* Filme le slideshow image par image, en JPEG quasi sans perte.
   Le screencast de Chromium donne l'horodatage de chaque image, ce qui
   permet de retrouver le départ de la présentation à la milliseconde. */
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [url, duree, dossier] = process.argv.slice(2);
const QUALITE = Number(process.env.QUALITE || 97);

function trouveChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const cache = process.platform === 'darwin'
    ? process.env.HOME + '/Library/Caches/ms-playwright'
    : process.env.HOME + '/.cache/ms-playwright';
  const dedans = process.platform === 'darwin'
    ? 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    : 'chrome-linux/chrome';
  const versions = readdirSync(cache)
    .filter(d => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const v of versions) {
    const p = `${cache}/${v}/${dedans}`;
    if (existsSync(p)) return p;
  }
  throw new Error('Chromium introuvable. Posez son chemin dans CHROMIUM.');
}

mkdirSync(dossier, { recursive: true });

const navigateur = await chromium.launch({
  executablePath: trouveChromium(),
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio',
         '--force-device-scale-factor=1', '--hide-scrollbars',
         '--disable-frame-rate-limit', '--disable-gpu-vsync']
});
const ctx = await navigateur.newContext({
  viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Player && document.getElementById('musique').readyState > 0);

const cdp = await ctx.newCDPSession(page);
const images = [];
cdp.on('Page.screencastFrame', async (f) => {
  const nom = 'i' + String(images.length).padStart(6, '0') + '.jpg';
  images.push({ nom, t: f.metadata.timestamp });
  writeFileSync(join(dossier, nom), Buffer.from(f.data, 'base64'));
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg', quality: QUALITE, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1
});
await page.waitForTimeout(600);

const depart = await page.evaluate(() => {
  document.getElementById('intro-go').click();
  document.body.classList.remove('show-hint');
  return Date.now() / 1000;
});
await page.waitForTimeout(Number(duree) * 1000 + 700);

await cdp.send('Page.stopScreencast');
await ctx.close();
await navigateur.close();

writeFileSync(join(dossier, 'images.json'), JSON.stringify({ depart, duree: Number(duree), images }));
const apres = images.filter(i => i.t >= depart);
console.log(`${images.length} images, ${apres.length} après le départ`);
console.log(`départ ${depart.toFixed(3)} · première image ${images[0]?.t.toFixed(3)} · dernière ${images.at(-1)?.t.toFixed(3)}`);
