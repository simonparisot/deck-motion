/* The player: navigation, steps, contents, notes, timer. */
(function () {
'use strict';

var E = window.SlideEngine;
var q = E.q, qa = E.qa, el = E.el;
var FACTOR = (typeof TEMPO === 'number' && TEMPO > 0) ? TEMPO : 1;
document.documentElement.style.setProperty('--tempo', FACTOR);

var AUTO = (typeof MODE === 'string' && MODE === 'auto');
var DECK = SLIDES
  .map(function (s) { return { def: s, node: q('#' + s.id) }; })
  .filter(function (s) { return s.node; });

if (DECK.length !== SLIDES.length) {
  console.warn('Declared with no matching <section>:',
    SLIDES.filter(function (s) { return !q('#' + s.id); }).map(function (s) { return s.id; }));
}

function stepCount(s) { return (s.def.steps && s.def.steps.length) || 1; }
function mmss(sec) {
  var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ':' + ('0' + s).slice(-2);
}

/* ---- Scaling the 1600 × 900 stage ---- */
var stage = q('#stage');
function fit() {
  var k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
}
window.addEventListener('resize', fit);
fit();

/* ---- Contents, grouped by chapter ---- */
var list = q('#toc-list'), chapter = null;
DECK.forEach(function (s, i) {
  if (s.def.chapter && s.def.chapter !== chapter) {
    chapter = s.def.chapter;
    list.appendChild(el('li', 'toc-chapter', chapter));
  }
  var li = el('li');
  var b = el('button', null,
    '<b>' + ('0' + (i + 1)).slice(-2) + '</b><span>' + s.def.title + '</span>');
  b.type = 'button';
  b.addEventListener('click', function () { closeToc(); go(i); });
  li.appendChild(b);
  list.appendChild(li);
});
var entries = qa('#toc-list li:not(.toc-chapter)');
q('#toc-total').textContent = DECK.length + ' slides';

/* ---- Progress ---- */
var progress = q('#progress');
DECK.forEach(function () { progress.appendChild(el('i')); });
var segments = qa('#progress i');

/* ---- State ---- */
var current = -1, currentStep = 0, built = {}, timers = [];
var started = null, elapsed = 0, raf = null;

function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function build(s) {
  if (built[s.def.id]) return;
  built[s.def.id] = true;
  var h = E.HOOKS[s.def.id];
  if (h && h.build) h.build(s.node);
}

/* Applies one step: the step-N class, then the hook if there is one. */
function applyStep(s, n, instant) {
  s.node.classList.add('step-' + n);
  var h = E.HOOKS[s.def.id];
  if (h && h.step) h.step(s.node, n, !!instant);
}

function go(i, step) {
  if (i < 0 || i >= DECK.length) return;
  clearTimers();
  var prev = DECK[current];
  if (prev) {
    var hp = E.HOOKS[prev.def.id];
    if (hp && hp.exit) hp.exit(prev.node);
    prev.node.classList.remove('is-active');
    prev.node.classList.add('is-leaving');
    (function (n) { setTimeout(function () { n.classList.remove('is-leaving'); }, 220); })(prev.node);
  }

  current = i;
  var s = DECK[current];
  build(s);

  /* Reset: step classes go, enter() puts the slide back to its start. */
  s.node.className = s.node.className.replace(/\s*step-\d+/g, '');
  var h = E.HOOKS[s.def.id];
  if (h && h.enter) h.enter(s.node);

  s.node.classList.remove('is-active');
  void s.node.offsetWidth;                       /* the reflow restarts animations */
  s.node.classList.add('is-active');

  var total = stepCount(s);
  var wanted = (step == null) ? 1 : Math.max(1, Math.min(total, step));

  if (AUTO) {
    s.def.steps.forEach(function (ms, k) {
      timers.push(setTimeout(function () { applyStep(s, k + 1); },
        (E.REDUCED ? Math.min(ms * 0.08, 320) : ms * FACTOR)));
    });
    currentStep = total;
    timers.push(setTimeout(function () {
      if (current < DECK.length - 1) go(current + 1);
    }, s.def.seconds * 1000 * FACTOR));
  } else {
    /* Arriving on a slide already applies its first step. */
    for (var n = 1; n <= wanted; n++) applyStep(s, n, n < wanted);
    currentStep = wanted;
  }
  chrome();
}

function next() {
  var s = DECK[current];
  if (!AUTO && currentStep < stepCount(s)) {
    currentStep++;
    applyStep(s, currentStep);
    chrome();
    return;
  }
  if (current < DECK.length - 1) go(current + 1);
}

function prev() {
  if (!AUTO && currentStep > 1) { go(current, currentStep - 1); return; }
  if (current > 0) go(current - 1, stepCount(DECK[current - 1]));
}

/* ---- Chrome: progress, contents, notes ---- */
function chrome() {
  segments.forEach(function (n, k) {
    n.classList.toggle('done', k < current);
    n.classList.toggle('here', k === current);
  });
  entries.forEach(function (n, k) { n.classList.toggle('is-here', k === current); });
  var s = DECK[current];
  q('#notes-text').textContent = s.def.notes || '';
  q('#notes-where').textContent =
    (current + 1) + ' / ' + DECK.length +
    (stepCount(s) > 1 ? '  ·  step ' + currentStep + ' / ' + stepCount(s) : '');
  var after = DECK[current + 1];
  q('#notes-next').textContent = after ? '→ ' + after.def.title : '→ end';
}

/* ---- Timer ---- */
var target = (typeof TARGET_MINUTES === 'number' ? TARGET_MINUTES : 0) * 60;
function tick(t) {
  raf = requestAnimationFrame(tick);
  if (started === null) started = t;
  elapsed = (t - started) / 1000;
  var n = q('#timer');
  n.textContent = mmss(elapsed) + (target ? ' / ' + mmss(target) : '');
  n.classList.toggle('over', target && elapsed > target);
}

/* ---- Commands ---- */
var toc = q('#toc');
function openToc() { toc.hidden = false; }
function closeToc() { toc.hidden = true; }
function toggleToc() { toc.hidden ? openToc() : closeToc(); }
function toggleNotes() { document.body.classList.toggle('with-notes'); }
function toggleBlackout() { document.body.classList.toggle('blackout'); }
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) {
    var p = document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(function () {});
  }
}

q('#toc-close').addEventListener('click', closeToc);

document.addEventListener('click', function (ev) {
  var b = ev.target.closest ? ev.target.closest('[data-action]') : null;
  if (b) {
    var a = b.getAttribute('data-action');
    if (a === 'next') next();
    else if (a === 'prev') prev();
    else if (a === 'toc') toggleToc();
    else if (a === 'notes') toggleNotes();
    else if (a === 'full') toggleFull();
    ev.preventDefault();
    return;
  }
  if (!toc.hidden) return;
  if (ev.target.closest && ev.target.closest('#chrome, #toc, #notes, a, button')) return;
  if (document.body.classList.contains('blackout')) { toggleBlackout(); return; }
  next();
});

document.addEventListener('keydown', function (ev) {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  var k = ev.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { next(); ev.preventDefault(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { prev(); ev.preventDefault(); }
  else if (k === 'Home') go(0);
  else if (k === 'End') go(DECK.length - 1, 99);
  else if (k === 's' || k === 'S') toggleToc();
  else if (k === 'n' || k === 'N') toggleNotes();
  else if (k === 'b' || k === 'B' || k === '.') toggleBlackout();
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'r' || k === 'R') { started = null; go(0); }
  else if (k === 'Escape') closeToc();
});

progress.addEventListener('click', function (ev) {
  var r = progress.getBoundingClientRect();
  go(Math.floor((ev.clientX - r.left) / r.width * DECK.length));
});

/* Moving the mouse reveals the buttons. */
var uiTimer = null;
document.addEventListener('mousemove', function () {
  document.body.classList.add('show-ui');
  clearTimeout(uiTimer);
  uiTimer = setTimeout(function () { document.body.classList.remove('show-ui'); }, 2200);
});

/* ---- Start ---- */
if (typeof NOTES_AT_START !== 'undefined' && NOTES_AT_START) toggleNotes();
go(0);
raf = requestAnimationFrame(tick);

window.Player = {
  go: go, next: next, prev: prev,
  where: function () { return { slide: DECK[current].def.id, step: currentStep }; },
  slides: DECK.map(function (s) { return s.def.id; }),
  mode: AUTO ? 'auto' : 'presenter'
};
console.log('%cdeck-motion', 'color:#8BE9FD;font-weight:700',
  '\n' + DECK.length + ' slides · ' + window.Player.mode + ' mode' +
  '\nPlayer.go(3) opens a slide. N notes, S contents, B blackout.');

})();
