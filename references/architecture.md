# The engine

Three files, plus the content. No dependencies, no build.

```
index.html    the slide <section>s, the chrome, the contents panel
styles.css    colour tokens, skeleton, slide styles
data.js       ← THE ONLY CONTENT FILE
scenes.js     engine, drawing helpers, slide hooks
app.js        the player: navigation, steps, notes, timer
```

## The fixed stage

`#stage` is 1600 × 900 pixels, always. `app.js` computes a scale factor and
applies a `transform: scale()`. Everything else is measured in stage pixels.

```js
var k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
```

Centring is `position:absolute; left:50%; top:50%` then
`translate(-50%,-50%)`. **Not grid, not flex**: a 1600 px child in a narrower
container overflows instead of centring, and the deck ends up offset in small
windows.

The practical consequence: you only ever test one width. What is right at
1600 × 900 is right everywhere.

## A slide's lifecycle

```js
HOOKS.mySlide = {
  build: function (s) { /* once, on first arrival */ },
  enter: function (s) { /* every arrival: reset */ },
  step:  function (s, n, instant) { /* on every step */ },
  exit:  function (s) { /* on leaving */ }
};
```

`build()` creates the expensive DOM: SVG, grids, lists. It runs once, the
construction is cached.

`enter()` **puts the slide back to its starting state.** This is the most
important point in the engine. Empty the counters, fold the paths back, unlight
the dots. Everything that must restart from zero goes here, never in `build()`.

`step(s, n, instant)` gets the step number. `instant` is `true` when you go
backwards: the slide replays up to the wanted step, and hooks can then drop the
final value in without animating.

The engine also puts a `step-N` class on the `<section>` at every step. For
anything CSS can do, the `step()` hook is unnecessary.

## Steps

In `data.js`:

```js
{ id: 'market', title: 'The market', chapter: 'Introduction',
  steps: [600, 2000, 3400], seconds: 18,
  notes: 'The 96 % is the number that matters.' }
```

`steps` is an array of delays in milliseconds. Its **length** is the number of
steps; its **values** only matter in auto mode. A slide with a single step
declares `steps: [400]`.

Arriving on a slide already applies step 1. A slide is never shown blank waiting
for a click.

## The two modes

`var MODE = 'presenter'` or `'auto'`, in `data.js`.

**presenter** — `→` moves one step, then to the next slide once they run out.
`←` goes back a step, then to the previous slide on its last step. No clock.

**auto** — steps fire on their delays, the slide changes after `seconds`. This is
the mode for a screen with nobody in front of it: a lobby display, a stand, a
loop between two sessions.

The same slide code serves both. That is deliberate: a talk deck must be able to
run unattended without a rewrite.

## The tempo

`var TEMPO = 1.4` slows everything by 40 %: slide durations, step delays, CSS
animations. It works through two paths:

- in JS, `tempoFactor()` multiplies the `setTimeout` calls and animation
  durations;
- in CSS, `app.js` sets `--tempo` on `:root`, and rules write
  `animation-delay: calc(var(--d,0s) * var(--tempo,1))`.

A delay hardcoded somewhere escapes the tempo and desynchronises everything
else. There is no acceptable exception.

## Reduced motion

`?static=1` in the URL, or the system "reduce motion" setting. Every slide shows
straight in its final state. Useful for a lobby screen, for people sensitive to
motion, and to check at a glance that every final state is correct.

The drawing helpers (`countTo`, `drawPath`, `litRatio`) already handle it. An
animation written by hand has to handle it too.

## The chrome

Clickable progress bar at the top, buttons on hover at the bottom, timer bottom
right, contents panel by chapter, notes panel. Everything is `position:fixed`, so
outside the scaled stage: the chrome keeps its real size whatever the window.
