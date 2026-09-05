#!/usr/bin/env bash
# Monte la musique sur un enregistrement d'écran du support.
#   ./mux-capture.sh screenrecording.mov
#   ./mux-capture.sh screenrecording.mov sortie.mp4
#
# Le calage est trouvé tout seul : on rend 40 s de référence, dont on
# connaît l'image zéro, et on corrèle les courbes de luminance. Passez
# DECALAGE=1.23 pour l'imposer à la main (secondes de musique à sauter).
# CRF=16 règle la compression, LARGEUR=1920 la définition.
set -euo pipefail
cd "$(dirname "$0")"

CAPTURE="${1:?usage : ./mux-capture.sh <enregistrement> [sortie.mp4]}"
SORTIE="${2:-$(basename "${CAPTURE%.*}")-avec-son.mp4}"
SUPPORT="${SUPPORT:-.}"
MUSIQUE="${MUSIQUE:-$SUPPORT/assets/musique.mp3}"
CRF="${CRF:-16}"
LARGEUR="${LARGEUR:-1920}"
HAUTEUR=$(( LARGEUR * 9 / 16 ))
IPS="${IPS:-60}"

DUREE=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CAPTURE")

if [ -n "${DECALAGE:-}" ]; then
  echo "Décalage imposé : $DECALAGE s"
else
  REF=".video/reference.mp4"
  if [ ! -f "$REF" ]; then
    echo "Rendu de 40 s de référence pour le calage"
    ./build-video.sh 40 "$REF" >/dev/null
  fi
  read -r DECALAGE CORR < <(python3 outils/cale.py "$CAPTURE" "$REF")
  echo "Calage trouvé : $DECALAGE s (corrélation $CORR)"
fi

# Un décalage négatif veut dire que la capture commence avant l'image zéro.
if [ "${DECALAGE%%.*}" -lt 0 ] 2>/dev/null || [ "${DECALAGE:0:1}" = "-" ]; then
  DEBUT_V="${DECALAGE#-}"; DEBUT_A=0
else
  DEBUT_V=0; DEBUT_A="$DECALAGE"
fi

FONDU=$(LC_ALL=C awk -v d="$DUREE" -v v="$DEBUT_V" 'BEGIN{printf "%.2f", d-v-0.7}')

echo "Encodage en ${LARGEUR}x${HAUTEUR} à $IPS i/s, crf $CRF"
ffmpeg -v error -y -ss "$DEBUT_V" -i "$CAPTURE" -ss "$DEBUT_A" -i "$MUSIQUE" \
  -map 0:v -map 1:a -shortest \
  -vf "scale=$LARGEUR:$HAUTEUR:flags=lanczos,fps=$IPS" \
  -af "afade=t=out:st=$FONDU:d=0.7" \
  -c:v libx264 -crf "$CRF" -preset slow -tune film -pix_fmt yuv420p \
  -c:a aac -b:a 224k -movflags +faststart "$SORTIE"

echo "$SORTIE : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SORTIE") s, $(du -h "$SORTIE" | cut -f1)"
