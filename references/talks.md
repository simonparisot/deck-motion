# A 30 to 45 minute talk

This is not a long video. The pace comes from the speaker, not from a clock.
Three things change.

## 1. The mode

```js
var MODE = 'presenter';
var TARGET_MINUTES = 40;    // drives the timer
var NOTES_AT_START = false; // true when rehearsing
```

`seconds` on each slide becomes decorative: it only matters in auto mode. Fill it
in anyway if you expect to export a video one day.

## 2. The controls in the room

| Key | Effect |
|---|---|
| `→` `space` `enter` | Next step, then next slide |
| `←` `backspace` | Previous step, then previous slide |
| `N` | Speaker notes |
| `S` | Contents, by chapter |
| `B` or `.` | **Blackout** — to take the room back |
| `F` | Full screen |
| `R` | Restart, timer back to zero |
| `Home` `End` | First, last slide |

A click anywhere also moves forward. A presentation remote sends `PageUp` /
`PageDown`: that is wired.

**Blackout is the most useful control** and the one people forget to plan for.
When a question comes, you want the room looking at you, not at the slide.

## 3. The cutting

**One slide per idea, one step per sentence.** A slide that takes four clicks is
a slide that holds four sentences. That is the right grain: beyond it, split.

**Chapters.** Over 45 minutes a contents panel without chapters is useless. The
`chapter` field groups them, and a chapter slide — a title alone on a plain
background — gives the room the landmark a progress bar does not.

**Count in slides, not in minutes.** A talk slide holds 30 to 60 seconds. For 40
minutes, aim at 45 to 70 slides. Below 30 the deck drags and the speaker talks
over a still image.

**Write the notes while you write the slide**, not after. A useful note says what
the slide does not: the source of a figure, the question that always comes, the
sentence that bridges to the next part. It never repeats what is on screen.

## Rehearsing

Open with `NOTES_AT_START = true`, run it, and watch the timer. It turns red past
`TARGET_MINUTES`.

The notes panel shows the position (`12 / 58`), the current step
(`step 2 / 4`) and the title of the next slide. That is what you need to know
where you are without looking elsewhere.

## Two screens, laptop and projector

The notes panel is in the same window, so it shows on the projector too. Three
ways round it, most robust first:

1. **Notes on paper**, deck full screen. This never fails.
2. **Extended display**: the deck full screen on the projector, a second window
   of the same file on the laptop, advanced in parallel. Crude but no code.
3. **A real presenter view**: open a second window and sync over
   `BroadcastChannel`. Works **only when served over `http://`** — two `file://`
   windows have opaque origins and cannot talk. If you add it, keep the built-in
   panel as the fallback.

Option 1 stays the sensible default. A talk setup has to survive a room where
nothing works.

## Before you walk in

- Open it from `file://` on **the machine that will present**, not on yours.
- Go full screen and look at the edges: the scaling should leave even black
  bars, never an offset picture.
- Walk the whole deck once with `?static=1`: every final state shows at once, so
  an empty value or overflowing text jumps out.
- Check the first and last slide under real projection: dark greys that read fine
  on a laptop vanish on a badly calibrated projector.
