/* Slide engine and drawing helpers.
   build() runs once, enter() on every arrival, step(n) on every step. */
(function (global) {
'use strict';

/* Reduced motion: system setting or ?static=1. */
var FORCED = /[?&]static=1/.test(global.location.search);
var REDUCED = FORCED || (global.matchMedia &&
              global.matchMedia('(prefers-reduced-motion: reduce)').matches);
if (FORCED) document.documentElement.classList.add('reduced');

function q(sel, root) { return (root || document).querySelector(sel); }
function qa(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel));
}
function el(tag, cls, html) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function svgEl(tag, attrs) {
  var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  return n;
}
/* Thin space every three digits. */
function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

function tempoFactor() {
  return (typeof TEMPO === 'number' && TEMPO > 0) ? TEMPO : 1;
}

/* ---- Drawing helpers ---- */

/* Animated counter. Under reduced motion it drops the final value in. */
function countTo(node, target, dur, suffix, format) {
  suffix = suffix || '';
  dur = dur * tempoFactor();
  var put = function (v) {
    node.textContent = (format === 'group' ? group(v) : v) + suffix;
  };
  if (REDUCED || !dur) { put(target); return; }
  var t0 = null;
  function frame(t) {
    if (t0 === null) t0 = t;
    var p = Math.min(1, (t - t0) / dur);
    put(Math.round(target * (1 - Math.pow(1 - p, 3))));   /* eases out */
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* Hides an SVG path. Call this from enter(), never from build(): otherwise
   the curve stays drawn when you come back to the slide. */
function hidePath(path) {
  var L = path.getTotalLength() || 3000;
  path.style.transition = 'none';
  path.style.strokeDasharray = L;
  path.style.strokeDashoffset = L;
}

function drawPath(path, dur, delay) {
  hidePath(path);
  void path.getBoundingClientRect();                      /* forces a reflow */
  path.style.transition = 'stroke-dashoffset ' +
    (REDUCED ? 0.14 : dur * tempoFactor() / 1000) + 's ' +
    (REDUCED ? 0 : (delay || 0) / 1000) + 's cubic-bezier(.16,1,.3,1)';
  path.style.strokeDashoffset = 0;
}

/* Grid of dots. Returns the array, so you can light them up later. */
function dotGrid(host, count, columns) {
  host.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr)';
  var dots = [];
  for (var i = 0; i < count; i++) {
    var d = el('i', 'dot');
    host.appendChild(d);
    dots.push(d);
  }
  return dots;
}

/* Lights a share of the dots, scattered at random, in waves. */
function litRatio(dots, ratio, cls, perFrame) {
  cls = cls || 'lit';
  var target = Math.round(dots.length * ratio), i = 0;
  var order = dots.map(function (d, k) { return k; });
  for (var k = order.length - 1; k > 0; k--) {
    var j = Math.floor(Math.random() * (k + 1));
    var t = order[k]; order[k] = order[j]; order[j] = t;
  }
  if (REDUCED) {
    order.slice(0, target).forEach(function (k) { dots[k].classList.add(cls); });
    return;
  }
  var step = Math.max(1, perFrame || 12);
  (function wave() {
    for (var n = 0; n < step && i < target; n++, i++) dots[order[i]].classList.add(cls);
    if (i < target) requestAnimationFrame(wave);
  })();
}

/* Full-width curve with a gradient area. Returns the path. */
function curve(host, series, options) {
  options = options || {};
  var n = series.length, W = 1000, H = 300, x0 = 8, x1 = 992, yB = 258;
  var max = options.max || Math.max.apply(null, series);
  var pts = series.map(function (v, i) {
    return [x0 + i / (n - 1) * (x1 - x0), yB - v / max * (yB - 20)];
  });
  var d = pts.map(function (p, i) {
    return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  }).join(' ');

  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
  var defs = svgEl('defs');
  var grad = svgEl('linearGradient', { id: 'curveArea', x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': 'currentColor', 'stop-opacity': .26 }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': 'currentColor', 'stop-opacity': 0 }));
  defs.appendChild(grad); svg.appendChild(defs);

  svg.appendChild(svgEl('path', { class: 'curve-area',
    d: d + ' L' + x1 + ' ' + yB + ' L' + x0 + ' ' + yB + ' Z' }));
  var line = svgEl('path', { class: 'curve-line', d: d });
  svg.appendChild(line);
  svg.appendChild(svgEl('line', { class: 'curve-axis', x1: x0, y1: yB, x2: x1, y2: yB }));
  host.appendChild(svg);
  return line;
}

/* ---- Nos briques à nous ---- */

/* Les nombres en français : espace tous les trois chiffres, virgule décimale. */
function dec(v, n) { return v.toFixed(n).replace('.', ','); }
function nb(v, o) {
  o = o || {};
  var t = o.dec ? dec(v, o.dec) : (o.group === false ? String(v) : group(v));
  return (o.prefixe || '') + t + (o.suffixe || '');
}

/* Compteur, décimales comprises. countTo du modèle ne fait que des entiers. */
function compte(node, cible, dur, o) {
  o = o || {};
  dur = dur * tempoFactor();
  var pose = function (v) { node.textContent = nb(v, o); };
  if (REDUCED || !dur) { pose(cible); return; }
  var t0 = null, f = o.dec ? Math.pow(10, o.dec) : 1;
  function image(t) {
    if (t0 === null) t0 = t;
    var p = Math.min(1, (t - t0) / dur);
    pose(Math.round(cible * (1 - Math.pow(1 - p, 3)) * f) / f);
    if (p < 1) requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
}

/* Les libellés chiffrés du HTML. Une seule table pour tout le support : un
   chiffre ne s'écrit jamais dans index.html, il se pose ici. */
var FAITS = null;
function faits() {
  if (FAITS) return FAITS;
  var a = DATA.activite, d = DATA.dossier, r = DATA.risqueV3;
  FAITS = {
    ticket: nb(a.ticket), jours: nb(a.jours),
    commission: nb(d.commission, { suffixe: ' €' }), risque: nb(d.risque, { suffixe: ' €' }),
    refi: nb(d.refi, { suffixe: ' €' }), service: nb(d.service, { suffixe: ' €' }),
    marge: nb(d.marge, { suffixe: ' €' }), marge27: nb(DATA.dossier2027.marge, { suffixe: ' €' }),
    notreCom: nb(d.commissionTaux, { dec: 1, suffixe: ' %' }),
    trameCom: nb(DATA.trame.commission, { dec: 1, suffixe: ' %' }),
    defautAvant: nb(r.defautAvant, { dec: 1, suffixe: ' %' }),
    defautV3: nb(r.defaut, { dec: 1, suffixe: ' %' })
  };
  return FAITS;
}
function poseFaits(s) {
  var F = faits();
  qa('[data-fact]', s).forEach(function (n) {
    var k = n.getAttribute('data-fact');
    if (F[k] != null) n.textContent = F[k];
  });
}

/* Fabrique d'écran à chiffre héros : un compteur par entrée, déclenché à son
   étape. Vide dans enter(), sinon le chiffre reste affiché au retour. */
function chiffres(entrees) {
  return {
    build: poseFaits,
    enter: function (s) { qa('[data-count]', s).forEach(function (n) { n.textContent = ''; }); },
    step: function (s, n, direct) {
      entrees.forEach(function (c) {
        if ((c.pas || 2) !== n) return;
        var node = q('[data-count="' + c.cle + '"]', s);
        if (node) compte(node, c.valeur, direct ? 0 : (c.duree || 900), c);
      });
    }
  };
}

/* Barres verticales, une par entrée. show(k) en révèle k. */
function bars(hote, entrees, o) {
  o = o || {};
  var max = o.max || Math.max.apply(null, entrees.map(function (e) { return e.valeur; }));
  var els = entrees.map(function (e) {
    var b = el('div', 'bar' + (e.ton ? ' ' + e.ton : ''), '<b></b><i></i><span></span>');
    q('b', b).textContent = e.muet ? '' : (o.fmt ? o.fmt(e.valeur) : nb(e.valeur));
    q('span', b).textContent = e.nom;
    q('i', b).style.setProperty('--h', (e.valeur / max * 100).toFixed(1) + '%');
    hote.appendChild(b);
    return b;
  });
  return {
    efface: function () { els.forEach(function (b) { b.classList.remove('on'); }); },
    show: function (k) { els.forEach(function (b, i) { b.classList.toggle('on', i < k); }); }
  };
}

/* Histogramme : beaucoup de barres fines, qui montent l'une après l'autre. */
function histo(hote, valeurs, libelles) {
  var max = Math.max.apply(null, valeurs), timers = [];
  var els = valeurs.map(function (v, i) {
    var b = el('div', 'hbar', '<i></i><span></span>');
    q('i', b).style.setProperty('--h', (v / max * 100).toFixed(1) + '%');
    q('span', b).textContent = libelles[i];
    hote.appendChild(b);
    return b;
  });
  function arrete() { timers.forEach(clearTimeout); timers = []; }
  return {
    efface: function () { arrete(); els.forEach(function (b) { b.className = 'hbar'; }); },
    monte: function (direct) {
      arrete();
      if (direct || REDUCED) { els.forEach(function (b) { b.classList.add('on'); }); return; }
      els.forEach(function (b, i) {
        timers.push(setTimeout(function () { b.classList.add('on'); }, i * 90 * tempoFactor()));
      });
    },
    marque: function (i) { els[i].classList.add('key'); },
    arrete: arrete
  };
}

/* Anneau : une part par canal, qui se déforme d'un état à l'autre sans être
   reconstruit. C'est ce glissement qui porte le propos. */
function ring(hote, canaux) {
  var R = 128, SW = 46, C = 2 * Math.PI * R;
  var enveloppe = el('div', 'ring-wrap');
  var svg = svgEl('svg', { viewBox: '0 0 320 320' });
  var g = svgEl('g', { transform: 'rotate(-90 160 160)' });
  var arcs = canaux.map(function (c) {
    var arc = svgEl('circle', { class: 'arc ' + c.ton, cx: 160, cy: 160, r: R, fill: 'none',
      'stroke-width': SW, 'stroke-dasharray': '0 ' + C.toFixed(1), 'stroke-dashoffset': C.toFixed(1) });
    g.appendChild(arc);
    return arc;
  });
  svg.appendChild(g);
  var centre = el('div', 'ring-centre', '<b></b><span>partenariats</span>');
  enveloppe.appendChild(svg); enveloppe.appendChild(centre);
  var legende = el('div', 'ring-legend');
  canaux.forEach(function (c) {
    legende.appendChild(el('span', 'lg ' + c.ton, '<i></i>' + c.nom));
  });
  var etat = el('p', 'ring-etat');
  enveloppe.appendChild(etat);              /* le libellé d'état se pose sous l'anneau */
  hote.appendChild(enveloppe); hote.appendChild(legende);

  return {
    efface: function () {
      arcs.forEach(function (arc) {
        arc.style.transition = 'none';
        arc.setAttribute('stroke-dasharray', '0 ' + C.toFixed(1));
        arc.setAttribute('stroke-dashoffset', C.toFixed(1));
      });
      q('b', centre).textContent = '';
      etat.textContent = '';
    },
    tourne: function (valeurs, direct, libelle) {
      var cum = 0;
      arcs.forEach(function (arc, i) {
        var len = valeurs[i] / 100 * C;
        arc.style.transition = (direct || REDUCED) ? 'none'
          : 'stroke-dasharray .9s cubic-bezier(.16,1,.3,1), stroke-dashoffset .9s cubic-bezier(.16,1,.3,1)';
        arc.setAttribute('stroke-dasharray', len.toFixed(1) + ' ' + (C - len).toFixed(1));
        arc.setAttribute('stroke-dashoffset', (C - cum).toFixed(1));
        cum += len;
      });
      compte(q('b', centre), valeurs[0], direct ? 0 : 900, { suffixe: ' %' });
      etat.textContent = libelle;
    }
  };
}

/* ---- La carte ----
   Le contour de la France métropolitaine, en degrés (longitude, latitude).
   Une quarantaine de points : on dessine un repère, pas une carte d'état-major. */
var CONTOUR_FR = [
  [2.38, 51.03], [1.85, 50.95], [1.37, 50.06], [0.11, 49.49], [-1.62, 49.64],
  [-1.60, 48.84], [-2.02, 48.65], [-4.49, 48.39], [-4.74, 48.04], [-3.37, 47.75],
  [-2.20, 47.28], [-1.78, 46.50], [-1.15, 46.16], [-1.03, 45.62], [-1.17, 44.66],
  [-1.56, 43.48], [-1.24, 43.16], [0.14, 42.80], [1.52, 42.50], [3.03, 42.70],
  [3.00, 43.18], [3.88, 43.61], [5.37, 43.30], [5.93, 43.12], [7.27, 43.70],
  [7.50, 43.78], [6.63, 44.90], [5.92, 45.57], [6.14, 46.20], [7.59, 47.56],
  [7.75, 48.58], [8.19, 48.97], [7.07, 49.11], [5.77, 49.52], [4.72, 49.77],
  [3.97, 50.28], [3.06, 50.63]
];

/* La Corse, dessinée à part : c'est une deuxième boucle, et l'oublier est le
   reproche numéro un qu'on fait à une carte de France. */
var CORSE = [
  [9.35, 43.02], [9.56, 42.68], [9.53, 42.12], [9.40, 41.75], [9.28, 41.40],
  [8.79, 41.56], [8.57, 42.27], [8.70, 42.57], [9.00, 42.82]
];

/* Carte à bulles. Le contour se trace, puis une bulle par région, de la plus
   grosse à la plus petite. Aucun chiffre écrit : c'est la surface qui parle.
   Projection équirectangulaire, longitudes corrigées par le cosinus de la
   latitude moyenne, sinon la France est trop large. */
function carteFrance(hote, regions, o) {
  o = o || {};
  var W = o.largeur || 600, H = o.hauteur || 620, marge = 30, rMax = o.rayonMax || 46;
  var tout = CONTOUR_FR.concat(CORSE);
  var lons = tout.map(function (p) { return p[0]; });
  var lats = tout.map(function (p) { return p[1]; });
  var lon0 = Math.min.apply(null, lons), lon1 = Math.max.apply(null, lons);
  var lat0 = Math.min.apply(null, lats), lat1 = Math.max.apply(null, lats);
  var kx = Math.cos(46.5 * Math.PI / 180);
  var k = Math.min((W - 2 * marge) / ((lon1 - lon0) * kx), (H - 2 * marge) / (lat1 - lat0));
  var dx = (W - (lon1 - lon0) * kx * k) / 2, dy = (H - (lat1 - lat0) * k) / 2;
  function proj(lon, lat) { return [dx + (lon - lon0) * kx * k, dy + (lat1 - lat) * k]; }

  function boucle(points) {
    return points.map(function (p, i) {
      var q = proj(p[0], p[1]);
      return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }).join(' ') + ' Z';
  }
  var trace = boucle(CONTOUR_FR) + ' ' + boucle(CORSE);

  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
  var fond = svgEl('path', { class: 'fr-fond', d: trace });
  var contour = svgEl('path', { class: 'fr-trait', d: trace, fill: 'none' });
  svg.appendChild(fond); svg.appendChild(contour);

  var max = Math.max.apply(null, regions.map(function (r) { return r.clients; }));
  var g = svgEl('g', { class: 'fr-bulles' });
  var bulles = regions.slice().sort(function (a, b) { return b.clients - a.clients; })
    .map(function (r) {
      var q = proj(r.lon, r.lat);
      var rayon = Math.sqrt(r.clients / max) * rMax;
      var c = svgEl('circle', { class: 'bulle', cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: rayon.toFixed(1) });
      c.style.setProperty('--r', rayon.toFixed(1) + 'px');
      g.appendChild(c);
      return c;
    });
  svg.appendChild(g); hote.appendChild(svg);

  var timers = [];
  function arrete() { timers.forEach(clearTimeout); timers = []; }
  return {
    efface: function () {
      arrete(); hidePath(contour);
      fond.classList.remove('on');
      bulles.forEach(function (c) { c.classList.remove('on'); });
    },
    trace: function (direct) {
      arrete();
      drawPath(contour, direct ? 1 : 1900);
      if (direct || REDUCED) { fond.classList.add('on'); return; }
      timers.push(setTimeout(function () { fond.classList.add('on'); }, 1000 * tempoFactor()));
    },
    pose: function (direct) {
      arrete();
      if (direct || REDUCED) { bulles.forEach(function (c) { c.classList.add('on'); }); return; }
      bulles.forEach(function (c, i) {
        timers.push(setTimeout(function () { c.classList.add('on'); }, i * 110 * tempoFactor()));
      });
    },
    arrete: arrete
  };
}

/* ---- Le tunnel ----
   Un Sankey à une seule branche : le flux principal se rétrécit d'étape en
   étape, et ce qu'il perd descend vers le bas. Les largeurs sont
   proportionnelles, donc la perte se lit sans qu'on écrive un pourcentage. */
function sankey(hote, etapes) {
  var W = 1360, H = 530, xPad = 6, colW = 24, top = 34, hMax = 240, basY = 396;
  var n = etapes.length, max = etapes[0].valeur;
  var pas = (W - colW - 2 * xPad) / (n - 1);
  function X(i) { return xPad + i * pas; }
  function Ht(i) { return etapes[i].valeur / max * hMax; }

  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
  var groupes = [];

  function texte(cls, x, y, contenu, ancre) {
    var t = svgEl('text', { class: cls, x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': ancre || 'middle' });
    t.textContent = contenu;
    return t;
  }

  function noeud(i) {
    var g = svgEl('g', {});
    g.appendChild(svgEl('rect', { class: 'nd', x: X(i).toFixed(1), y: top, width: colW, height: Ht(i).toFixed(1), rx: 3 }));
    var ancre = i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle');
    var cx = i === 0 ? X(i) : (i === n - 1 ? X(i) + colW : X(i) + colW / 2);
    g.appendChild(texte('nd-nom', cx, top - 16, etapes[i].nom, ancre));
    return g;
  }

  /* Premier groupe : le noeud d'entrée seul. */
  var g0 = svgEl('g', { class: 'etape' });
  g0.appendChild(noeud(0));
  svg.appendChild(g0); groupes.push(g0);

  for (var i = 0; i < n - 1; i++) {
    var g = svgEl('g', { class: 'etape' });
    var xa = X(i) + colW, xb = X(i + 1), m = (xa + xb) / 2;
    var ha = Ht(i), hb = Ht(i + 1);
    var ph = (etapes[i].valeur - etapes[i + 1].valeur) / max * hMax;

    /* Le flux qui continue : bord haut droit, bord bas courbé. */
    g.appendChild(svgEl('path', { class: 'flux', d:
      'M' + xa + ' ' + top + ' L' + xb + ' ' + top +
      ' L' + xb + ' ' + (top + hb) +
      ' C' + m + ' ' + (top + hb) + ' ' + m + ' ' + (top + ha) + ' ' + xa + ' ' + (top + ha) + ' Z' }));

    /* Ce qui se perd : ça descend, ça s'aplatit, ça porte son nom. */
    var cx = (xa + m) / 2, xe = m + 96;
    g.appendChild(svgEl('path', { class: 'perte', d:
      'M' + xa + ' ' + (top + hb) +
      ' C' + cx + ' ' + (top + hb) + ' ' + cx + ' ' + basY + ' ' + m + ' ' + basY +
      ' L' + xe + ' ' + basY +
      ' L' + xe + ' ' + (basY + ph) +
      ' L' + m + ' ' + (basY + ph) +
      ' C' + cx + ' ' + (basY + ph) + ' ' + cx + ' ' + (top + ha) + ' ' + xa + ' ' + (top + ha) + ' Z' }));
    g.appendChild(texte('perte-nom', (m + xe) / 2, basY + ph + 34, etapes[i + 1].perte));

    g.appendChild(noeud(i + 1));
    svg.appendChild(g); groupes.push(g);
  }
  hote.appendChild(svg);

  return {
    efface: function () { groupes.forEach(function (g) { g.classList.remove('on'); }); },
    show: function (k) { groupes.forEach(function (g, i) { g.classList.toggle('on', i <= k); }); }
  };
}

/* ---- Les écrans ----
   Sans hook, le moteur pose step-1, step-2 … et le CSS fait le reste. */
var HOOKS = {};

HOOKS.opening = {};
HOOKS.promesse = {};
HOOKS['chapitre-bilan'] = {};

HOOKS.production = {
  build: function (s) {
    this.g = histo(q('.histo', s), DATA.production.valeurs, DATA.production.mois);
  },
  enter: function (s) {
    this.g.efface();
    qa('[data-count]', s).forEach(function (n) { n.textContent = ''; });
  },
  step: function (s, n, direct) {
    if (n === 2) this.g.monte(direct);
    if (n === 3) {
      this.g.marque(DATA.production.valeurs.length - 1);
      compte(q('[data-count="aout"]', s), DATA.production.aout, direct ? 0 : 900, { suffixe: ' M€' });
    }
  },
  exit: function () { this.g.arrete(); }
};

HOOKS.carte = {
  build: function (s) { this.g = carteFrance(q('.map', s), DATA.regions); },
  enter: function (s) {
    this.g.efface();
    qa('[data-count]', s).forEach(function (n) { n.textContent = ''; });
  },
  step: function (s, n, direct) {
    if (n === 2) this.g.trace(direct);
    if (n === 3) this.g.pose(direct);
    if (n === 4) compte(q('[data-count="clients"]', s), DATA.activite.clients, direct ? 0 : 1100);
  },
  exit: function () { this.g.arrete(); }
};

HOOKS.sankey = {
  build: function (s) { this.g = sankey(q('.sankey', s), DATA.funnel.etapes); },
  enter: function (s) {
    this.g.efface();
    qa('[data-count]', s).forEach(function (n) { n.textContent = ''; });
  },
  step: function (s, n, direct) {
    if (n >= 2 && n <= 4) this.g.show(n - 1);
    if (n === 5) {
      this.g.show(3);
      var e = DATA.funnel.etapes;
      compte(q('[data-count="bout"]', s), e[e.length - 1].valeur, direct ? 0 : 900);
    }
  }
};

HOOKS.defaut = {
  build: function (s) {
    this.g = bars(q('.bars', s), [
      { nom: 'l’an dernier', valeur: DATA.qualite.defautAvant, ton: 'alerte' },
      { nom: 'cette année', valeur: DATA.qualite.defaut, ton: 'nous' }
    ], { fmt: function (v) { return nb(v, { dec: 1, suffixe: ' %' }); } });
  },
  enter: function () { this.g.efface(); },
  step: function (s, n) { if (n >= 2) this.g.show(n - 1); }
};

HOOKS.video = {};
HOOKS['chapitre-marche'] = {};

HOOKS.taux = {
  build: function (s) {
    this.ligne = curve(q('.chart', s), DATA.marche.bceCourbe, { max: 6 });
    q('.year-start', s).textContent = 'sept. 2025 · ' + nb(DATA.marche.bceAvant, { dec: 1, suffixe: ' %' });
    q('.year-end', s).textContent = 'août 2026 · ' + nb(DATA.marche.bce, { dec: 1, suffixe: ' %' });
  },
  enter: function () { hidePath(this.ligne); },
  step: function (s, n, direct) { if (n === 2) drawPath(this.ligne, direct ? 1 : 1700); }
};

HOOKS.concurrence = { build: poseFaits };
HOOKS.alignement = {};
HOOKS.equation = { build: poseFaits };
HOOKS.equilibre = chiffres([{ cle: 'equilibre', valeur: DATA.equilibre.dossiers, duree: 1300 }]);
HOOKS.pause = {};
HOOKS['chapitre-paris'] = {};
HOOKS.paris = {};

HOOKS['api-mix'] = {
  build: function (s) { this.g = ring(q('.ring', s), DATA.mix.canaux); },
  enter: function (s) { this.g.efface(); s.classList.remove('cible'); },
  step: function (s, n, direct) {
    if (n === 2) this.g.tourne(DATA.mix.aujourdhui, direct, 'aujourd’hui');
    if (n === 3) s.classList.remove('cible');
    if (n === 4) { s.classList.add('cible'); this.g.tourne(DATA.mix.cible, direct, 'en cible 2027'); }
  }
};

HOOKS['risque-v3'] = { build: poseFaits };
HOOKS['marge-2027'] = { build: poseFaits };

HOOKS.trajectoire = {
  build: function (s) {
    this.g = bars(q('.bars', s), DATA.trajectoire);
  },
  enter: function () { this.g.efface(); },
  step: function (s, n) { if (n === 2) this.g.show(2); if (n === 3) this.g.show(3); if (n >= 4) this.g.show(4); }
};

HOOKS['non-choix'] = {
  build: function (s) {
    var hote = q('.strikes', s);
    DATA.nonChoix.forEach(function (t, i) {
      var p = el('p', 'strike a', '<span>' + t + '</span>');
      p.setAttribute('data-step', String(i + 2));
      hote.appendChild(p);
    });
  }
};

HOOKS['chapitre-orga'] = {};

HOOKS.squads = {
  build: function (s) {
    var hote = q('.cards', s);
    DATA.squads.forEach(function (sq, i) {
      var c = el('div', 'card a', '<b>0' + (i + 1) + '</b><span>' + sq.nom + '</span><i>' + sq.quoi + '</i>');
      c.setAttribute('data-step', String(i + 2));
      hote.appendChild(c);
    });
  }
};

HOOKS.merci = {};
HOOKS.questions = {};

global.SlideEngine = {
  HOOKS: HOOKS, REDUCED: REDUCED, tempoFactor: tempoFactor,
  q: q, qa: qa, el: el, svgEl: svgEl, group: group,
  countTo: countTo, hidePath: hidePath, drawPath: drawPath,
  dotGrid: dotGrid, litRatio: litRatio, curve: curve,
  nb: nb, dec: dec, compte: compte, bars: bars, histo: histo, ring: ring,
  carteFrance: carteFrance, sankey: sankey, faits: faits
};

})(window);
