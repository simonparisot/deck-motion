#!/usr/bin/env bash
# Renders a video of the deck, with its soundtrack.
#   ./render-video.sh                    the whole deck
#   ./render-video.sh 46.4               the first 46.4 seconds
#   ./render-video.sh 46.4 clip.mp4      and under that name
#
# The picture is captured frame by frame in a headless Chromium as
# near-lossless JPEG, then encoded to h264. The sound comes from the deck's
# music file. Both come off the same timeline, and the page reports its own
# start time, so the alignment is exact.
#
# URL=...       address to record (default: local server on 8790)
# DECK=...      deck folder, to read data.js (default: .)
# MUSIC=...     soundtrack (default: <deck>/assets/music.mp3)
# QUALITY=98    intermediate frame quality (default 97)
# CRF=16        final compression, lower is heavier (default 13)
# FPS=25        output frame rate (default 50)
# CLOCK=1       drive the browser clock: exact intervals, six times slower,
#               and the compositor still lags. Measured on a running counter:
#               57 % frozen frames against 72 % without, and 19 % for a screen
#               recording. See mux-recording.sh and references/export.md.
#
# Needs: bun or npm, ffmpeg, python3, a Chromium in the Playwright cache.
set -euo pipefail
cd "$(dirname "$0")/.."

DECK="${DECK:-.}"
URL="${URL:-http://127.0.0.1:8790/index.html}"
MUSIC="${MUSIC:-$DECK/assets/music.mp3}"
CRF="${CRF:-13}"
FPS="${FPS:-50}"
WORK=".video"

LENGTH="${1:-$(DECK="$DECK" node -e '
  var fs = require("fs");
  eval(fs.readFileSync(process.env.DECK + "/data.js", "utf8"));
  console.log((SLIDES.reduce(function (a, s) { return a + s.seconds; }, 0) * TEMPO).toFixed(1));
')}"
OUT="${2:-video-${LENGTH}s.mp4}"

mkdir -p "$WORK"
if [ ! -d "$WORK/node_modules/playwright-core" ]; then
  echo "Installing playwright-core"
  ( cd "$WORK" && (bun add playwright-core >/dev/null 2>&1 || npm install --silent playwright-core) )
fi

rm -rf "$WORK/frames"; mkdir -p "$WORK/frames"
echo "Recording ${LENGTH}s from $URL"

if [ "${CLOCK:-0}" = "1" ]; then
  cp tools/capture-clock.mjs "$WORK/"     # so it can see its node_modules
  FPS="$FPS" node "$WORK/capture-clock.mjs" "$URL" "$LENGTH" "$WORK/frames"
  INPUT=(-framerate "$FPS" -i "$WORK/frames/f%06d.jpg")
else
  cp tools/capture.mjs "$WORK/"           # so it can see its node_modules
  node "$WORK/capture.mjs" "$URL" "$LENGTH" "$WORK/frames"
  python3 tools/timeline.py "$WORK/frames" "$WORK/frames/list.txt" "$FPS"
  INPUT=(-f concat -safe 0 -i "$WORK/frames/list.txt")
fi

echo "Encoding at crf $CRF"
ffmpeg -v error -y "${INPUT[@]}" -i "$MUSIC" \
  -t "$LENGTH" -map 0:v -map 1:a \
  -vf "fps=$FPS,fade=t=out:st=$(LC_ALL=C awk -v d="$LENGTH" 'BEGIN{printf "%.2f", d-0.5}'):d=0.5" \
  -af "afade=t=out:st=$(LC_ALL=C awk -v d="$LENGTH" 'BEGIN{printf "%.2f", d-0.8}'):d=0.8" \
  -c:v libx264 -crf "$CRF" -preset slow -tune film -pix_fmt yuv420p \
  -c:a aac -b:a 224k -movflags +faststart "$OUT"

echo "$OUT : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s, $(du -h "$OUT" | cut -f1)"
