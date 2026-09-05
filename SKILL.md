---
name: deck-motion
description: |
  Build an animated web presentation that behaves like slides: a fixed scaled
  stage, screens in plain HTML/CSS/JS with no dependencies, step animations
  driven by a click or by the clock, speaker notes, contents panel, timer.
  Made for a 30 to 45 minute talk, and for any deck that should carry a spoken
  presentation rather than be read. Ships a working template, editorial limits
  with a tool that measures them, the browser verification method, and
  deployment. Use it when someone asks for a presentation deck that is "not a
  PowerPoint", a web motion design, or an animated slideshow.
---

# Animated web presentation

The goal: a deck with the finish of a motion design and the flexibility of
slides. No dependencies, no build, one file to open. You drive it from the
keyboard during a talk, or let it run on its own on a lobby screen.

> **Read `references/writing.md` before writing anything.**
> A deck that backs a talk is **very light**: one idea per slide, fifteen words
> at most, a single visual object, no bullet lists. The screen does not say what
> the speaker says — it shows what speech cannot show. This is the constraint
> everyone drops first and the one the room notices most.
> `tools/audit.sh` measures it, slide by slide.

## Start

```sh
cp -r <this-skill>/template my-deck && cd my-deck
open index.html
```

The template works as it is: five slides, a counter, a curve, a dot grid,
speaker notes and a contents panel. It is a foundation, not an example to copy:
replace the content, keep the engine.

**All the content lives in `data.js`.** That is the only file a non-technical
person should ever open. Figures, running order, notes, pacing.

## The four decisions everything else rests on

**A fixed 1600 × 900 stage, scaled by JavaScript.** Nothing reflows: the layout
is identical on a laptop, a projector and a lobby screen. You lay things out
once, at one size. That is what lets you place things to the pixel without ever
testing ten widths.

**Classic scripts, no ES modules.** That is what lets the file open from
`file://` on a double click, with no server. On the machine of a speaker who has
neither Node nor network, that matters.

**One content file.** `data.js` carries the figures, the running order and the
notes. No value hardcoded in the HTML: otherwise two numbers drift apart and
nobody notices before the room does.

**Steps, not a timeline.** Each slide declares its steps. In presenter mode they
advance on a click, in auto mode they follow a clock. The same slide code serves
both, so a deck can run unattended without being rewritten.

## The workflow

1. **Write the running order in `data.js`** before a line of CSS: the slides,
   the chapters, the number of steps, the notes. Content first.
   What gets said goes in the notes, what gets shown goes on the slide.
2. **Lay out the slides in HTML**, one `<section class="slide" id="…">` per
   entry. Three blocks per slide: a short claim, a visual object, a caption.
3. **Animate in steps.** An element carries `class="a" data-step="2"`: it appears
   on step 2. For what CSS cannot do, a `step(s, n)` hook.
4. **Pass the load audit**: `tools/audit.sh`. A flagged slide gets split, not
   shrunk.
5. **Verify in a browser, never by reading the code.** See
   `references/verifying.md`. This is the part people skip and regret.
6. **Deploy if needed.** See `references/deploying.md`.

## The references

| File | When to read it |
|---|---|
| `references/writing.md` | **First.** What goes on a slide, and what does not |
| `references/architecture.md` | Understand the engine before changing it |
| `references/slides.md` | Write a slide, animate, the drawing traps |
| `references/talks.md` | A 30 to 45 minute deck, presenter mode |
| `references/verifying.md` | **Before shipping anything** |
| `references/deploying.md` | Serving the deck, and what bites |

## What costs a lot when ignored

Every one of these came from a real bug, found late.

**An animated element must be hidden in `enter()`, not in `build()`.**
`build()` only runs once. Coming back to the slide, the element is still in its
final state and shows in full before animating again. The classic symptom: "the
chart appears at once, disappears, then animates".

**`[hidden]` hides nothing if a CSS rule sets a `display`.** `#thing{display:flex}`
beats the browser rule. You have to write `#thing[hidden]{display:none}`. Check
with `getComputedStyle`, not with the `hidden` property.

**A screenshot at rest proves nothing.** The bugs live during the animation. You
have to sample frames at precise moments.

**Every script that edits a file must assert its anchor.** A `replace` that
matches nothing fails silently, and you end up debugging a change that was never
written.

**A dense deck goes unnoticed while writing and is paid for in the room.** The
agent doing the writing tends to fill: three figures instead of one, a list
instead of a sentence, the source under the chart. Run `tools/audit.sh` before
shipping, and split the flagged slides rather than shrinking the type.

**Measure instead of eyeballing.** Sound in RMS, sync by correlation, smoothness
by counting frozen frames. And validate the measurement itself on a case whose
answer you already know, before trusting it.
