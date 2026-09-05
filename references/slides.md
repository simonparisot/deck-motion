# Writing a slide

## The minimum

In `data.js`:

```js
{ id: 'bridge', title: 'The bridge', chapter: 'The case',
  steps: [400, 1600], seconds: 12,
  notes: 'Press the point that these customers already knew us.' }
```

In `index.html`:

```html
<section class="slide" id="bridge">
  <h2 class="title a" data-step="1">They already knew us.</h2>
  <p class="subtitle a" data-step="2">Seven in ten were retail customers.</p>
</section>
```

That is all. No hook: the `a` class plus `data-step="N"` is enough to reveal an
element on step N.

## When you need a hook

As soon as you have to draw or count.

```js
HOOKS.bridge = {
  build: function (s) {
    this.line = curve(q('.chart', s), DATA.series);
  },
  enter: function (s) {
    hidePath(this.line);                          /* folds the path back */
    q('[data-count]', s).textContent = '';        /* empties the counter */
  },
  step: function (s, n, instant) {
    if (n === 1) drawPath(this.line, 1600);
    if (n === 2) countTo(q('[data-count]', s), 7000, instant ? 0 : 900, '', 'group');
  }
};
```

Three rules:

1. **What is expensive goes in `build()`**, it only runs once.
2. **What must restart from zero goes in `enter()`**, it runs on every arrival.
3. **`instant` is `true` going backwards**: drop the final value, do not animate.

## The helpers

| Helper | What it does |
|---|---|
| `countTo(node, target, dur, suffix, format)` | Animated counter, eases out. `format:'group'` separates thousands |
| `curve(host, series, options)` | Full-width curve with a gradient area, returns the path |
| `hidePath(path)` / `drawPath(path, dur)` | Folds then unrolls an SVG path |
| `dotGrid(host, n, columns)` | Grid of dots, returns the array |
| `litRatio(dots, ratio, cls)` | Lights a share at random, in waves |
| `group(n)` | Thin space every three digits |
| `svgEl(tag, attrs)` | Creates an SVG element with its attributes |

## The drawing traps

**The path that shows before it animates.** An SVG `<path>` with a `d` attribute
is drawn in full the moment it exists. You have to set `stroke-dasharray` and
`stroke-dashoffset` **in `enter()`**. Doing it in `build()` works on the first
visit and fails on every one after.

**`preserveAspectRatio="none"` distorts text.** It stretches the SVG on both axes
independently. If the container is not exactly as tall as the `viewBox`, the
letters stretch. Give the container a fixed height equal to the `viewBox`, or
drop `none`.

**`getTotalLength()` can return 0** on an element not yet rendered. Always write
`path.getTotalLength() || 3000`: the fallback must exceed the real length, which
hides the path instead of showing it.

**A counter starting at `0`** makes the page look stuck. Empty the text in
`enter()` and start the counter after a short delay.

**A number that grows makes the sentence around it jump.** Give it
`display:inline-block` and a `min-width` sized on the final value.

**An `infinite` animation flickers** when the slide is replayed. Prefer a single
run with a per-element offset.

## Colours

The template exposes four tokens: `--key` for the subject and hero figures,
`--accent` for secondary data, `--alert` for what warns, and the ink levels.

Two rules learned in rooms:

**One colour, one meaning, across the whole deck.** If the key colour means the
product, it never means anything else. Write it down in the deck's README, or
the third person to touch the file will break it.

**Two neighbouring hues are indistinguishable on a projector.** A yellow and an
acid green side by side in a stacked chart are unreadable from ten metres. You
need a clear hue gap, not a lightness gap.

## Scaling to a long deck

For 40 to 80 slides, `index.html` gets long but stays readable: one section per
slide, in contents order, with a comment separating them. The engine only builds
a slide on its first visit, so file size costs nothing at load.

If the file becomes genuinely unmanageable, split by chapter and concatenate by
hand rather than introduce a build: the value of this setup is that there is
nothing to install.
