#!/usr/bin/env bash
# Cuts a track to the exact length of the deck.
#   SOURCE=track.mp3 BPM=146.32 ./tools/build-music.sh
#
# Two joins, both an exact whole number of bars, so the pulse never shifts:
#   1. in the quiet intro, it loops backwards so the beat lands on the slide
#      that reveals the subject;
#   2. near the end it jumps to the coda, so the silence falls on the closing
#      slide.
# Lengths come from data.js: after a tempo change, just run it again.
#
# BPM       tempo of the track. Read it from the file, or measure it —
#           see references/export.md. A bar is 4 × 60 / BPM seconds.
# DECK=.    deck folder
# ENTRY=17.5  where the beat comes in, in the source track
# LOOP=12.0   where to loop back, inside the quiet intro
set -euo pipefail
cd "$(dirname "$0")/.."

SOURCE="${SOURCE:?name the track: SOURCE=track.mp3}"
BPM="${BPM:?name the tempo: BPM=146.32}"
DECK="${DECK:-.}"
ENTRY="${ENTRY:-17.5}"
LOOP="${LOOP:-12.0}"
XFADE="${XFADE:-1.2}"

BAR=$(LC_ALL=C awk -v b="$BPM" 'BEGIN{printf "%.6f", 4*60/b}')
END=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SOURCE")

read -r LENGTH REVEAL JOIN < <(DECK="$DECK" node -e '
  var fs = require("fs");
  eval(fs.readFileSync(process.env.DECK + "/data.js", "utf8"));
  var t = 0, reveal = 0, join = 0;
  SLIDES.forEach(function (s, i) {
    if (i === 2) reveal = t;                       /* the slide that reveals */
    if (i === SLIDES.length - 2) join = t;         /* where the coda starts */
    t += s.seconds;
  });
  console.log((t * TEMPO).toFixed(3), (reveal * TEMPO).toFixed(3), (join * TEMPO).toFixed(3));
')

read -r SHIFT JUMP A_END B_START B_END C_START FADE OUT_LEN < <(LC_ALL=C awk \
  -v d="$LENGTH" -v o="$REVEAL" -v r="$JOIN" -v m="$BAR" \
  -v f="$END" -v e="$ENTRY" -v b="$LOOP" -v x="$XFADE" 'BEGIN {
    shift = int((o - e) / m + 0.5) * m;          # delay the beat, in whole bars
    if (shift < 0) shift = 0;
    jump  = int((f - d + shift) / m) * m;        # reach the coda without overrunning
    printf "%.4f %.4f %.4f %.4f %.4f %.4f %.3f %.3f\n",
      shift, jump, b + x/2, b - x/2 - shift, r + x/2 - shift,
      r - x/2 - shift + jump, d - 1, d + 0.5;
  }')

echo "deck ${LENGTH}s · reveal at ${REVEAL}s · beat shifted by ${SHIFT}s"
echo "join at ${JOIN}s · jump ${JUMP}s · coda from ${C_START}s"

mkdir -p "$DECK/assets"
ffmpeg -v error -y -i "$SOURCE" \
  -filter_complex "\
[0:a]atrim=0:$A_END,asetpts=N/SR/TB[a]; \
[0:a]atrim=$B_START:$B_END,asetpts=N/SR/TB[b]; \
[0:a]atrim=$C_START:$END,asetpts=N/SR/TB[c]; \
[a][b]acrossfade=d=$XFADE:c1=qsin:c2=qsin[ab]; \
[ab][c]acrossfade=d=$XFADE:c1=qsin:c2=qsin[x]; \
[x]afade=t=in:st=0:d=0.6,afade=t=out:st=$FADE:d=1,\
atrim=0:$OUT_LEN,apad=whole_dur=$OUT_LEN[out]" \
  -map "[out]" -c:a libmp3lame -b:a 192k -ar 48000 -ac 2 \
  "$DECK/assets/music.mp3"

echo "$DECK/assets/music.mp3 : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DECK/assets/music.mp3")s"
