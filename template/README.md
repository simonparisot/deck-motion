# Presentation deck

Standalone deck, no dependencies and no build. Double-click `index.html`.

## Controls

| Key | Effect |
|---|---|
| `→` `space` or click | Next step, then next slide |
| `←` `backspace` | Previous step, then previous slide |
| `N` | Speaker notes |
| `S` | Contents |
| `B` or `.` | Blackout |
| `F` | Full screen |
| `R` | Restart |

## Changing the content

**Everything is in `data.js`.** That is the only file to open.

- **A figure** → its value in `DATA`. The slide, the counter and the chart follow.
- **The running order** → the `SLIDES` array: order, titles, chapters, notes.
- **How many steps a slide has** → the length of its `steps` array.
- **Overall pacing** → `TEMPO`. 1.3 slows everything by 30 %.
- **Turn it into a video** → `MODE = 'auto'`.

## Special URLs

| URL | Effect |
|---|---|
| `index.html` | Normal |
| `index.html?static=1` | No animation, every slide in its final state |

## Colour coding

Write yours here and stop changing it: one colour, one meaning, across the deck.

| Token | Meaning |
|---|---|
| `--key` | The subject, the hero figures |
| `--accent` | Secondary data |
| `--alert` | Warning, unfavourable comparison |
