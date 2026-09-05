# deck-motion

A [Claude Code](https://claude.com/claude-code) skill for building animated web
presentations that behave like slides.

The goal: a deck with the finish of a motion design and the flexibility of
slides. No dependencies, no build, one file to open. You drive it from the
keyboard during a 40 minute talk, or let it run on its own to make a three
minute video.

## Install

```sh
git clone https://github.com/simonparisot/deck-motion.git ~/.claude/skills/deck-motion
```

That is all. The skill loads itself when a request calls for it, or on
`/deck-motion`.

## Try it without Claude

The template stands on its own:

```sh
cp -r ~/.claude/skills/deck-motion/template my-deck
cd my-deck && open index.html
```

`→` moves one step then one slide, `N` opens the speaker notes, `S` the
contents, `B` blacks the screen out, `F` goes full screen.

## What is in it

| | |
|---|---|
| `template/` | A deck that works, to copy and fill. All the content lives in `data.js`. |
| `references/writing.md` | **Read this first.** What goes on a slide that backs a talk, and what does not. |
| `references/architecture.md` | The fixed stage, a slide's lifecycle, the two modes, the tempo. |
| `references/slides.md` | Writing a slide, the drawing helpers, the SVG traps. |
| `references/talks.md` | A 30 to 45 minute deck: pacing, notes, dual screen. |
| `references/verifying.md` | The browser verification method. |
| `references/export.md` | Video, a soundtrack cut on the bar, deployment. |
| `tools/` | Load audit, video capture, soundtrack editing, automatic sync. |

## The stance

**Very light.** One idea per slide, fifteen words at most, a single visual
object, no bullet lists. The screen does not say what the speaker says: it shows
what speech cannot show. `tools/audit.sh` measures that constraint slide by
slide instead of leaving it to taste.

**A fixed 1600 × 900 stage**, scaled by JavaScript. Nothing reflows: the layout
is identical from a laptop to a projector, and you only ever test one width.

**Classic scripts, no modules.** The file opens on a double click, with no
server, on the machine of a speaker who has neither Node nor network.

**Steps, not a timeline.** The same slide code serves the talk and the video. A
deck becomes a video without a rewrite.

## Requirements

None to write and present: the deck is plain HTML, CSS and JavaScript.

For the audit and export tools: `node`, `ffmpeg`, `python3`, and a Chromium from
the Playwright cache (`npx playwright install chromium`). Paths are wired for
macOS and Linux; set `CHROMIUM=/path/to/chrome` anywhere else.

## Where it comes from

This skill was extracted from a real project: a three minute deck shown to
17,000 people, then reworked into a talk. The figures quoted in the references —
the frozen-frame rates between capture methods, the compression thresholds, the
sync correlations — are measurements taken on that project, not estimates.

## Licence

MIT. See `LICENSE`.
