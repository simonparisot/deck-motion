/* Moteur d'écrans et outils de dessin.
   construit() une fois, entre() à chaque arrivée, pas(n) à chaque étape. */
(function (global) {
'use strict';

/* Mouvement réduit : réglage système ou ?statique=1. */
var FORCE = /[?&]statique=1/.test(global.location.search);
var REDUIT = FORCE || (global.matchMedia &&
             global.matchMedia('(prefers-reduced-motion: reduce)').matches);
if (FORCE) document.documentElement.classList.add('reduit');

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
/* Espace fine insécable tous les trois chiffres. */
function nbsp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

function facteurTempo() {
  return (typeof TEMPO === 'number' && TEMPO > 0) ? TEMPO : 1;
}

/* ---- Outils de dessin ---- */

/* Compteur animé. En mouvement réduit, pose la valeur finale. */
function compteJusqua(node, cible, duree, suffixe, format) {
  suffixe = suffixe || '';
  duree = duree * facteurTempo();
  var pose = function (v) {
    node.textContent = (format === 'fr' ? nbsp(v) : v) + suffixe;
  };
  if (REDUIT || !duree) { pose(cible); return; }
  var t0 = null;
  function image(t) {
    if (t0 === null) t0 = t;
    var p = Math.min(1, (t - t0) / duree);
    pose(Math.round(cible * (1 - Math.pow(1 - p, 3))));   /* décélère */
    if (p < 1) requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
}

/* Cache un tracé SVG. À appeler dans entre(), jamais dans construit() :
   sinon la courbe reste dessinée au retour sur l'écran. */
function cachePath(path) {
  var L = path.getTotalLength() || 3000;
  path.style.transition = 'none';
  path.style.strokeDasharray = L;
  path.style.strokeDashoffset = L;
}

function tracePath(path, duree, delai) {
  cachePath(path);
  void path.getBoundingClientRect();                      /* force le reflow */
  path.style.transition = 'stroke-dashoffset ' +
    (REDUIT ? 0.14 : duree * facteurTempo() / 1000) + 's ' +
    (REDUIT ? 0 : (delai || 0) / 1000) + 's cubic-bezier(.16,1,.3,1)';
  path.style.strokeDashoffset = 0;
}

/* Grille de points. Rend le tableau, pour l'allumer ensuite. */
function grillePoints(hote, nombre, colonnes) {
  hote.style.gridTemplateColumns = 'repeat(' + colonnes + ', 1fr)';
  var points = [];
  for (var i = 0; i < nombre; i++) {
    var d = el('i', 'point');
    hote.appendChild(d);
    points.push(d);
  }
  return points;
}

/* Allume une part des points, en les répartissant au hasard. */
function allumeRatio(points, ratio, classe, parImage) {
  classe = classe || 'vif';
  var cible = Math.round(points.length * ratio), i = 0;
  var ordre = points.map(function (p, k) { return k; });
  for (var k = ordre.length - 1; k > 0; k--) {
    var j = Math.floor(Math.random() * (k + 1));
    var t = ordre[k]; ordre[k] = ordre[j]; ordre[j] = t;
  }
  if (REDUIT) {
    ordre.slice(0, cible).forEach(function (k) { points[k].classList.add(classe); });
    return;
  }
  var pas = Math.max(1, parImage || 12);
  (function vague() {
    for (var n = 0; n < pas && i < cible; n++, i++) points[ordre[i]].classList.add(classe);
    if (i < cible) requestAnimationFrame(vague);
  })();
}

/* Courbe pleine largeur, avec aire dégradée. Rend le tracé. */
function courbe(hote, serie, options) {
  options = options || {};
  var n = serie.length, W = 1000, H = 300, x0 = 8, x1 = 992, yB = 258;
  var max = options.max || Math.max.apply(null, serie);
  var pts = serie.map(function (v, i) {
    return [x0 + i / (n - 1) * (x1 - x0), yB - v / max * (yB - 20)];
  });
  var d = pts.map(function (p, i) {
    return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  }).join(' ');

  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
  var defs = svgEl('defs');
  var grad = svgEl('linearGradient', { id: 'aireCourbe', x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': 'currentColor', 'stop-opacity': .26 }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': 'currentColor', 'stop-opacity': 0 }));
  defs.appendChild(grad); svg.appendChild(defs);

  svg.appendChild(svgEl('path', { class: 'courbe-aire',
    d: d + ' L' + x1 + ' ' + yB + ' L' + x0 + ' ' + yB + ' Z' }));
  var trace = svgEl('path', { class: 'courbe-trait', d: d });
  svg.appendChild(trace);
  svg.appendChild(svgEl('line', { class: 'courbe-axe', x1: x0, y1: yB, x2: x1, y2: yB }));
  hote.appendChild(svg);
  return trace;
}

/* ---- Les écrans ----
   Chaque entrée reçoit sa <section>. Sans hook pas(), le moteur pose
   simplement la classe pas-1, pas-2 … et le CSS fait le reste. */
var HOOKS = {};

HOOKS.ouverture = {};

HOOKS.contexte = {
  construit: function (s) {
    this.points = grillePoints(q('.grille', s), DATA.marche.base, 25);
  },
  entre: function (s) {
    this.points.forEach(function (p) { p.classList.remove('vif'); });
    q('[data-compteur]', s).textContent = '';
  },
  pas: function (s, n) {
    if (n === 2) allumeRatio(this.points, DATA.marche.part / 100);
    if (n === 3) compteJusqua(q('[data-compteur]', s), DATA.marche.part, 900, ' %');
  }
};

HOOKS.croissance = {
  construit: function (s) {
    this.trace = courbe(q('.zone-courbe', s), DATA.courbe.serie);
    q('.annee-debut', s).textContent = DATA.courbe.debut;
    q('.annee-fin', s).textContent = DATA.courbe.debut + DATA.courbe.serie.length - 1;
  },
  entre: function (s) { cachePath(this.trace); },
  pas: function (s, n) { if (n === 1) tracePath(this.trace, 1600); }
};

HOOKS.resultat = {
  entre: function (s) { q('[data-compteur]', s).textContent = ''; },
  pas: function (s, n) {
    if (n === 1) compteJusqua(q('[data-compteur]', s), DATA.clients.total, 2000, '', 'fr');
  }
};

HOOKS.fin = {};

global.MoteurEcrans = {
  HOOKS: HOOKS, REDUIT: REDUIT, facteurTempo: facteurTempo,
  q: q, qa: qa, el: el, svgEl: svgEl, nbsp: nbsp,
  compteJusqua: compteJusqua, cachePath: cachePath, tracePath: tracePath,
  grillePoints: grillePoints, allumeRatio: allumeRatio, courbe: courbe
};

})(window);
