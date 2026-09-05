/* Le lecteur : navigation, étapes, sommaire, notes, minuteur. */
(function () {
'use strict';

var M = window.MoteurEcrans;
var q = M.q, qa = M.qa, el = M.el;
var FACTEUR = (typeof TEMPO === 'number' && TEMPO > 0) ? TEMPO : 1;
document.documentElement.style.setProperty('--tempo', FACTEUR);

var AUTO = (typeof MODE === 'string' && MODE === 'auto');
var JEU = ECRANS
  .map(function (e) { return { def: e, node: q('#' + e.id) }; })
  .filter(function (e) { return e.node; });

if (JEU.length !== ECRANS.length) {
  console.warn('Écrans déclarés sans <section> correspondante :',
    ECRANS.filter(function (e) { return !q('#' + e.id); }).map(function (e) { return e.id; }));
}

function nbPas(e) { return (e.def.pas && e.def.pas.length) || 1; }
function mmss(sec) {
  var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ':' + ('0' + s).slice(-2);
}

/* ---- Mise à l'échelle du canvas 1600 × 900 ---- */
var scene = q('#scene');
function ajuste() {
  var k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  scene.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
}
window.addEventListener('resize', ajuste);
ajuste();

/* ---- Sommaire, groupé par chapitre ---- */
var liste = q('#sommaire-liste'), chapitreCourant = null;
JEU.forEach(function (e, i) {
  if (e.def.chapitre && e.def.chapitre !== chapitreCourant) {
    chapitreCourant = e.def.chapitre;
    liste.appendChild(el('li', 'sommaire-chapitre', chapitreCourant));
  }
  var li = el('li');
  var b = el('button', null,
    '<b>' + ('0' + (i + 1)).slice(-2) + '</b><span>' + e.def.titre + '</span>');
  b.type = 'button';
  b.addEventListener('click', function () { fermeSommaire(); va(i); });
  li.appendChild(b);
  liste.appendChild(li);
  e.entree = li;
});
var entrees = qa('#sommaire-liste li:not(.sommaire-chapitre)');
q('#sommaire-total').textContent = JEU.length + ' écrans';

/* ---- Barre de progression ---- */
var barre = q('#progression');
JEU.forEach(function () { barre.appendChild(el('i')); });
var segments = qa('#progression i');

/* ---- État ---- */
var courant = -1, pasCourant = 0, construits = {}, minuteries = [];
var depart = null, ecoule = 0, raf = null;

function purge() { minuteries.forEach(clearTimeout); minuteries = []; }

function construit(e) {
  if (construits[e.def.id]) return;
  construits[e.def.id] = true;
  var h = M.HOOKS[e.def.id];
  if (h && h.construit) h.construit(e.node);
}

/* Applique une étape : classe pas-N, puis le hook s'il existe. */
function appliquePas(e, n, direct) {
  e.node.classList.add('pas-' + n);
  var h = M.HOOKS[e.def.id];
  if (h && h.pas) h.pas(e.node, n, !!direct);
}

function va(i, pas) {
  if (i < 0 || i >= JEU.length) return;
  purge();
  var avant = JEU[courant];
  if (avant) {
    var ha = M.HOOKS[avant.def.id];
    if (ha && ha.sort) ha.sort(avant.node);
    avant.node.classList.remove('est-actif');
    avant.node.classList.add('est-sorti');
    (function (n) { setTimeout(function () { n.classList.remove('est-sorti'); }, 220); })(avant.node);
  }

  courant = i;
  var e = JEU[courant];
  construit(e);

  /* Remise à zéro : les classes d'étape partent, entre() rétablit l'état initial. */
  e.node.className = e.node.className.replace(/\s*pas-\d+/g, '');
  var h = M.HOOKS[e.def.id];
  if (h && h.entre) h.entre(e.node);

  e.node.classList.remove('est-actif');
  void e.node.offsetWidth;                       /* le reflow relance les animations */
  e.node.classList.add('est-actif');

  var total = nbPas(e);
  var cible = (pas == null) ? 1 : Math.max(1, Math.min(total, pas));

  if (AUTO) {
    e.def.pas.forEach(function (ms, k) {
      minuteries.push(setTimeout(function () { appliquePas(e, k + 1); },
        (M.REDUIT ? Math.min(ms * 0.08, 320) : ms * FACTEUR)));
    });
    pasCourant = total;
    minuteries.push(setTimeout(function () {
      if (courant < JEU.length - 1) va(courant + 1);
    }, e.def.duree * 1000 * FACTEUR));
  } else {
    /* Arriver sur un écran applique déjà sa première étape. */
    for (var n = 1; n <= cible; n++) appliquePas(e, n, n < cible);
    pasCourant = cible;
  }
  chrome();
}

function suivant() {
  var e = JEU[courant];
  if (!AUTO && pasCourant < nbPas(e)) {
    pasCourant++;
    appliquePas(e, pasCourant);
    chrome();
    return;
  }
  if (courant < JEU.length - 1) va(courant + 1);
}

function precedent() {
  if (!AUTO && pasCourant > 1) { va(courant, pasCourant - 1); return; }
  if (courant > 0) va(courant - 1, nbPas(JEU[courant - 1]));
}

/* ---- Chrome : progression, sommaire, notes, minuteur ---- */
function chrome() {
  segments.forEach(function (s, k) {
    s.classList.toggle('faite', k < courant);
    s.classList.toggle('active', k === courant);
  });
  entrees.forEach(function (n, k) { n.classList.toggle('est-ici', k === courant); });
  var e = JEU[courant];
  q('#notes-texte').textContent = e.def.notes || '';
  q('#notes-ou').textContent =
    (courant + 1) + ' / ' + JEU.length +
    (nbPas(e) > 1 ? '  ·  étape ' + pasCourant + ' / ' + nbPas(e) : '');
  var s = JEU[courant + 1];
  q('#notes-apres').textContent = s ? '→ ' + s.def.titre : '→ fin';
}

/* ---- Minuteur ---- */
var vise = (typeof DUREE_VISEE === 'number' ? DUREE_VISEE : 0) * 60;
function tic(t) {
  raf = requestAnimationFrame(tic);
  if (depart === null) depart = t;
  ecoule = (t - depart) / 1000;
  var n = q('#minuteur');
  n.textContent = mmss(ecoule) + (vise ? ' / ' + mmss(vise) : '');
  n.classList.toggle('depasse', vise && ecoule > vise);
}

/* ---- Commandes ---- */
var sommaire = q('#sommaire');
function ouvreSommaire() { sommaire.hidden = false; }
function fermeSommaire() { sommaire.hidden = true; }
function basculeSommaire() { sommaire.hidden ? ouvreSommaire() : fermeSommaire(); }
function basculeNotes() { document.body.classList.toggle('avec-notes'); }
function basculeNoir() { document.body.classList.toggle('ecran-noir'); }
function basculePlein() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) {
    var p = document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(function () {});
  }
}

q('#sommaire-fermer').addEventListener('click', fermeSommaire);

document.addEventListener('click', function (ev) {
  var b = ev.target.closest ? ev.target.closest('[data-action]') : null;
  if (b) {
    var a = b.getAttribute('data-action');
    if (a === 'suivant') suivant();
    else if (a === 'precedent') precedent();
    else if (a === 'sommaire') basculeSommaire();
    else if (a === 'notes') basculeNotes();
    else if (a === 'plein') basculePlein();
    ev.preventDefault();
    return;
  }
  if (!sommaire.hidden) return;
  if (ev.target.closest && ev.target.closest('#chrome, #sommaire, #notes, a, button')) return;
  if (document.body.classList.contains('ecran-noir')) { basculeNoir(); return; }
  suivant();
});

document.addEventListener('keydown', function (ev) {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  var k = ev.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { suivant(); ev.preventDefault(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { precedent(); ev.preventDefault(); }
  else if (k === 'Home') va(0);
  else if (k === 'End') va(JEU.length - 1, 99);
  else if (k === 's' || k === 'S') basculeSommaire();
  else if (k === 'n' || k === 'N') basculeNotes();
  else if (k === 'b' || k === 'B' || k === '.') basculeNoir();
  else if (k === 'f' || k === 'F') basculePlein();
  else if (k === 'r' || k === 'R') { depart = null; va(0); }
  else if (k === 'Escape') fermeSommaire();
  else if (k >= '1' && k <= '9' && sommaire.hidden === false) va(Number(k) - 1);
});

barre.addEventListener('click', function (ev) {
  var r = barre.getBoundingClientRect();
  va(Math.floor((ev.clientX - r.left) / r.width * JEU.length));
});

/* La souris révèle les boutons. */
var minuterieUI = null;
document.addEventListener('mousemove', function () {
  document.body.classList.add('montre-ui');
  clearTimeout(minuterieUI);
  minuterieUI = setTimeout(function () { document.body.classList.remove('montre-ui'); }, 2200);
});

/* ---- Départ ---- */
if (typeof NOTES_AU_DEPART !== 'undefined' && NOTES_AU_DEPART) basculeNotes();
va(0);
raf = requestAnimationFrame(tic);

window.Lecteur = {
  va: va, suivant: suivant, precedent: precedent,
  ou: function () { return { ecran: JEU[courant].def.id, pas: pasCourant }; },
  ecrans: JEU.map(function (e) { return e.def.id; }),
  mode: AUTO ? 'auto' : 'presentateur'
};
console.log('%cdeck-motion', 'color:#8BE9FD;font-weight:700',
  '\n' + JEU.length + ' écrans · mode ' + window.Lecteur.mode +
  '\nLecteur.va(3) ouvre un écran. N notes, S sommaire, B écran noir.');

})();
