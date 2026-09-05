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

/* ---- The slides ----
   Each entry gets its <section>. With no step() hook, the engine just adds
   the class step-1, step-2 … and the CSS does the rest. */
var HOOKS = {};

HOOKS.opening = {};

HOOKS.market = {
  build: function (s) {
    this.dots = dotGrid(q('.grid', s), DATA.market.base, 25);
  },
  enter: function (s) {
    this.dots.forEach(function (d) { d.classList.remove('lit'); });
    q('[data-count]', s).textContent = '';
  },
  step: function (s, n, instant) {
    if (n === 2) litRatio(this.dots, DATA.market.share / 100);
    if (n === 3) countTo(q('[data-count]', s), DATA.market.share, instant ? 0 : 900, ' %');
  }
};

HOOKS.growth = {
  build: function (s) {
    this.line = curve(q('.chart', s), DATA.curve.series);
    q('.year-start', s).textContent = DATA.curve.start;
    q('.year-end', s).textContent = DATA.curve.start + DATA.curve.series.length - 1;
  },
  enter: function (s) { hidePath(this.line); },
  step: function (s, n) { if (n === 1) drawPath(this.line, 1600); }
};

HOOKS.result = {
  enter: function (s) { q('[data-count]', s).textContent = ''; },
  step: function (s, n, instant) {
    if (n === 1) countTo(q('[data-count]', s), DATA.clients.total,
                         instant ? 0 : 2000, '', 'group');
  }
};

HOOKS.closing = {};

global.SlideEngine = {
  HOOKS: HOOKS, REDUCED: REDUCED, tempoFactor: tempoFactor,
  q: q, qa: qa, el: el, svgEl: svgEl, group: group,
  countTo: countTo, hidePath: hidePath, drawPath: drawPath,
  dotGrid: dotGrid, litRatio: litRatio, curve: curve
};

})(window);
