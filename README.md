# deck-motion

A [Claude Code](https://claude.com/claude-code) skill for building animated web
presentations that behave like slides.

The goal: a deck with the finish of a motion design and the flexibility of
slides. No dependencies, no build, one file to open. You drive it from the
keyboard during a 40 minute talk, or let it run on its own on a lobby
screen.

## Demo

**[Open a full one-hour plenary deck](https://simonparisot.github.io/deck-motion/demo/)**

Twenty-six screens for the annual seminar of a fintech that does not exist:
an animated map of France, a Sankey diagram of the underwriting funnel,
speaker notes, a contents panel, a timer. Every figure comes from one file.

It was generated from [a single preparation note](docs/demo/sources/brief-seminaire.md),
the kind anyone writes before a talk. That is the whole point of the skill:
you write the substance, it builds the form, and it applies the editorial
limits in `references/writing.md` while doing it.

The deck and the note are in French, the skill is in English.
Source in [`docs/demo/`](docs/demo/).

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
| `references/deploying.md` | Serving the deck, and the three things that bite. |
| `tools/` | The load audit. |

## The stance

**Very light.** One idea per slide, fifteen words at most, a single visual
object, no bullet lists. The screen does not say what the speaker says: it shows
what speech cannot show. `tools/audit.sh` measures that constraint slide by
slide instead of leaving it to taste.

**A fixed 1600 × 900 stage**, scaled by JavaScript. Nothing reflows: the layout
is identical from a laptop to a projector, and you only ever test one width.

**Classic scripts, no modules.** The file opens on a double click, with no
server, on the machine of a speaker who has neither Node nor network.

**Steps, not a timeline.** The same slide code serves a talk and an unattended
screen. No rewrite between the two.

## Requirements

None to write and present: the deck is plain HTML, CSS and JavaScript.

For the load audit: `node` and a Chromium from the Playwright cache
(`npx playwright install chromium`). Paths are wired for macOS and Linux; set
`CHROMIUM=/path/to/chrome` anywhere else.

## Where it comes from

This skill was extracted from a real project: a deck shown to 17,000 people,
then reworked to carry a spoken talk. The traps listed in the references each
come from a bug found late on that project, not from a checklist.

## Licence

MIT. See `LICENSE`.
