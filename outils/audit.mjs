/* Mesure la charge de chaque écran : un support de présentation orale doit
   rester léger. Voir references/redaction.md pour les seuils et pourquoi. */
import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:8790/index.html';
const SEUILS = { mots: 15, blocs: 4, corps: 24, puces: 3 };

function trouveChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const cache = process.platform === 'darwin'
    ? process.env.HOME + '/Library/Caches/ms-playwright'
    : process.env.HOME + '/.cache/ms-playwright';
  const dedans = process.platform === 'darwin'
    ? 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    : 'chrome-linux/chrome';
  for (const v of readdirSync(cache)
        .filter(d => /^chromium-\d+$/.test(d))
        .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))) {
    const p = `${cache}/${v}/${dedans}`;
    if (existsSync(p)) return p;
  }
  throw new Error('Chromium introuvable. Posez son chemin dans CHROMIUM.');
}

const nav = await chromium.launch({ executablePath: trouveChromium(), args: ['--hide-scrollbars'] });
const ctx = await nav.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecteur);

const ecrans = await page.evaluate(() => window.Lecteur.ecrans);
const bilan = [];

for (let i = 0; i < ecrans.length; i++) {
  await page.evaluate(i => window.Lecteur.va(i, 99), i);   /* toutes les étapes posées */
  await page.waitForTimeout(260);
  bilan.push(await page.evaluate(() => {
    const s = document.querySelector('.ecran.est-actif');
    const cadre = { l: 0, t: 0, r: 1600, b: 900 };
    let mots = 0, blocs = 0, corps = Infinity, puces = 0, heros = 0, debord = [];

    s.querySelectorAll('*').forEach(n => {
      if (!n.children.length && n.textContent.trim()) {
        const st = getComputedStyle(n);
        if (st.visibility === 'hidden' || st.display === 'none') return;
        const px = parseFloat(st.fontSize);
        const t = n.textContent.trim();
        const m = t.split(/\s+/).length;
        /* un chiffre héros n'est pas du texte à lire */
        if (px >= 90 && m <= 4) { heros++; return; }
        /* une valeur d'axe non plus */
        if (/^[\d\s.,%€$·—–-]+$/.test(t)) return;
        mots += m; blocs++;
        /* une étiquette d'axe n'est pas du texte à lire : on ne juge
           la taille que sur trois mots ou plus */
        if (m >= 3 && px < corps) corps = px;
      }
      if (n.tagName === 'LI') puces++;
      const r = n.getBoundingClientRect();
      if (r.width && (r.left < cadre.l - 1 || r.top < cadre.t - 1 ||
                      r.right > cadre.r + 1 || r.bottom > cadre.b + 1)) {
        debord.push(n.className || n.tagName);
      }
    });
    const visuels = s.querySelectorAll('svg, img, canvas, .grille').length;
    return { id: s.id, mots, blocs, heros, visuels, puces,
             corps: corps === Infinity ? null : Math.round(corps),
             debord: debord.slice(0, 3) };
  }));
}
await nav.close();

let signales = 0;
console.log('écran'.padEnd(18) + 'mots  blocs  visuels  corps   remarques');
for (const e of bilan) {
  const r = [];
  if (e.mots > SEUILS.mots) r.push(`${e.mots} mots (max ${SEUILS.mots})`);
  if (e.blocs > SEUILS.blocs) r.push(`${e.blocs} blocs de texte`);
  if (e.corps && e.corps < SEUILS.corps) r.push(`corps ${e.corps} px (min ${SEUILS.corps})`);
  if (e.puces > SEUILS.puces) r.push(`${e.puces} puces`);
  if (e.visuels > 1) r.push(`${e.visuels} objets visuels`);
  if (e.heros > 1) r.push(`${e.heros} chiffres héros`);
  if (e.debord.length) r.push(`déborde : ${e.debord.join(', ')}`);
  if (r.length) signales++;
  console.log(
    e.id.padEnd(18) +
    String(e.mots).padStart(4) + String(e.blocs).padStart(7) +
    String(e.visuels).padStart(9) + String(e.corps ?? '-').padStart(7) +
    '   ' + (r.length ? '⚠ ' + r.join(' · ') : 'ok'));
}
console.log(`\n${bilan.length - signales} / ${bilan.length} écrans dans les clous.`);
if (signales > bilan.length / 2)
  console.log('Plus de la moitié des écrans sont chargés : la salle va lire au lieu d’écouter.');
