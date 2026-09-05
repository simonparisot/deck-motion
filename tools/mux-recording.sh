#!/usr/bin/env bash
# Lays the soundtrack over a screen recording of the deck.
#   ./mux-recording.sh recording.mov
#   ./mux-recording.sh recording.mov out.mp4
#
# A screen recording is the best source: it follows the display refresh, so
# fast animations stay smooth. See references/export.md for the numbers.
#
# The offset is found automatically: 40 s of reference are rendered, whose
# frame zero is known by construction, and the two luminance curves are
# correlated. Set OFFSET=1.23 to force it (seconds of music to skip).
# CRF=16 sets the compression, WIDTH=1920 the resolution.
set -euo pipefail
cd "$(dirname "$0")/.."

RECORDING="${1:?usage: ./tools/mux-recording.sh <recording> [out.mp4]}"
OUT="${2:-$(basename "${RECORDING%.*}")-with-sound.mp4}"
DECK="${DECK:-.}"
MUSIC="${MUSIC:-$DECK/assets/music.mp3}"
CRF="${CRF:-16}"
WIDTH="${WIDTH:-1920}"
HEIGHT=$(( WIDTH * 9 / 16 ))
FPS="${FPS:-60}"

LENGTH=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RECORDING")

if [ -n "${OFFSET:-}" ]; then
  echo "Offset forced: $OFFSET s"
else
  REF=".video/reference.mp4"
  if [ ! -f "$REF" ]; then
    echo "Rendering 40 s of reference to align on"
    ./tools/render-video.sh 40 "$REF" >/dev/null
  fi
  read -r OFFSET CORR < <(python3 tools/sync.py "$RECORDING" "$REF")
  echo "Offset found: $OFFSET s (correlation $CORR)"
fi

# A negative offset means the recording starts before frame zero.
if [ "${OFFSET:0:1}" = "-" ]; then
  VIDEO_IN="${OFFSET#-}"; AUDIO_IN=0
else
  VIDEO_IN=0; AUDIO_IN="$OFFSET"
fi

FADE=$(LC_ALL=C awk -v d="$LENGTH" -v v="$VIDEO_IN" 'BEGIN{printf "%.2f", d-v-0.7}')

echo "Encoding ${WIDTH}x${HEIGHT} at $FPS fps, crf $CRF"
ffmpeg -v error -y -ss "$VIDEO_IN" -i "$RECORDING" -ss "$AUDIO_IN" -i "$MUSIC" \
  -map 0:v -map 1:a -shortest \
  -vf "scale=$WIDTH:$HEIGHT:flags=lanczos,fps=$FPS" \
  -af "afade=t=out:st=$FADE:d=0.7" \
  -c:v libx264 -crf "$CRF" -preset slow -tune film -pix_fmt yuv420p \
  -c:a aac -b:a 224k -movflags +faststart "$OUT"

echo "$OUT : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s, $(du -h "$OUT" | cut -f1)"
