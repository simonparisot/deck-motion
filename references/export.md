# Exporting: video, sound, deployment

## Switching the deck to video mode

```js
var MODE = 'auto';
var TEMPO = 1.6;      // reading comfort in a room is not reading comfort on video
```

In auto mode, `seconds` and the `steps` delays take on meaning again. A talk deck
converted as is runs too fast: the steps were paced against a speaker, not
against a viewer. Be generous.

Add a **start screen** as soon as there is sound: browsers forbid starting audio
without a user gesture, and no web page escapes that. A button that starts the
picture and the sound together solves it, and guarantees the soundtrack is
aligned from the first frame.

## Making the video

**The best result comes from a screen recording.** Measured on a running counter,
share of frames identical to the previous one at 50 fps:

| Method | Frozen frames |
|---|---|
| Screen recording | **19 %** |
| Capture driving the browser clock | 57 % |
| Plain screencast capture | 72 % |

Why: a screen recording follows the display refresh. A capture driven from the
browser returns frames the compositor has not finished composing. The call that
would force one composited frame per step,
`HeadlessExperimental.beginFrame`, was removed from Chromium;
`fromSurface:false` is worse still. Driving the virtual clock works well in
itself — `requestAnimationFrame` runs at 154 virtual Hz — but it is not enough.

So: **record the screen, then lay the sound over it.**

```sh
./tools/mux-recording.sh recording.mov
```

The script finds the offset on its own: it renders 40 s of reference, whose frame
zero it knows by construction, and correlates the two luminance curves. On real
cases it recovers the offset to within 20 ms, with a correlation of 0.98 to 0.99.
It handles both directions — a recording started before or after the first frame.

`tools/render-video.sh` renders a video without going through the screen. Handy
for checking, worse for shipping. `CLOCK=1` turns on the driven clock.

## Encoding settings

Downscale a Retina recording to 1920 × 1080 with a Lanczos filter: it is
supersampling, so the picture gets sharper. Keep 60 frames per second so nothing
is thrown away from fast animations.

| Setting | Result over 3 minutes |
|---|---|
| `crf 16` | ~45 MB, the master |
| `crf 18` | ~30 MB, for sharing |
| `crf 20` | ~26 MB, visibly softer on dark flats |

Dark flats and fine dot grids suffer most. Compare two encodings by pulling the
**same instant** from both and looking at the detail at 1:1 — not by eyeballing
the whole video.

## The soundtrack

`tools/build-music.sh` cuts a track to the exact length of the deck. The
principle, if you ever have to do it by hand:

**Find the track's tempo**, then only ever jump a **whole number of bars**. The
pulse stays continuous and the join is inaudible. A track at 146.32 BPM has a bar
of 1.6402 s; every jump is a multiple of that.

**Pick join points at matching levels.** Measure the RMS on both sides: one
decibel of difference passes unnoticed, four are audible. A 1.2 s equal-power
crossfade (`acrossfade=c1=qsin:c2=qsin`) is enough.

**Land the big moments on the story.** The beat should come in on the slide that
reveals the subject, the coda on the closing slide. If the entry lands too early,
loop a few bars back inside the quiet intro rather than adding silence: it is
inaudible and it shifts everything after it.

**Let the script compute the points, not you.** `build-music.sh` reads the
lengths from `data.js`: a tempo change only needs a re-run. A soundtrack aligned
by hand goes out of tune on the first adjustment.

## Deploying

A private S3 bucket behind CloudFront, one folder per version:

```sh
aws s3 sync ./deck s3://bucket/folder --delete \
  --exclude "*" --include "*.html" --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=60, must-revalidate"
# then one sync per type, and finally:
aws cloudfront create-invalidation --distribution-id XXX --paths "/folder/*"
```

Three things that cost you when forgotten:

- **Sync every type.** A script listing only html, js and css leaves `.avif`,
  `.mp3` and `.jpg` returning 403. You only find out in production.
- **Set the right `Content-Type`.** `aws s3 sync` guesses some of them badly; an
  `.mp3` served as `binary/octet-stream` will not play.
- **Wait for the invalidation to finish** before checking, or you verify the old
  version and conclude wrongly.

Every `--delete` sync wipes what the folder held. To keep a version, deploy it to
another folder rather than hoping to remember.
