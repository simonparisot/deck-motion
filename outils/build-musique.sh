#!/usr/bin/env bash
# Monte un morceau sur la durée exacte du support.
#   SOURCE=morceau.mp3 BPM=146.32 ./build-musique.sh
# Le BPM se lit dans le fichier du morceau, ou se mesure : voir
# references/export.md. La mesure vaut 4 × 60 / BPM.
#
# Deux raccords, tous deux d'un nombre entier de mesures, donc la
# pulsation ne bouge jamais :
#   1. dans l'intro calme, on reboucle en arrière pour que le beat
#      entre pile sur l'écran de l'offre ;
#   2. sur l'écran « Ce qui arrive en 2026 », on saute jusqu'à la coda
#      pour que le silence tombe sur la conclusion.
# Les durées viennent de data.js : relancer ce script suffit après un
# changement de TEMPO ou de minutage.
set -euo pipefail
cd "$(dirname "$0")"

SOURCE="${SOURCE:?indiquez le morceau : SOURCE=morceau.mp3}"
SUPPORT="${SUPPORT:-.}"
BPM="${BPM:?indiquez le tempo du morceau : BPM=146.32}"
MESURE=$(LC_ALL=C awk -v b="$BPM" 'BEGIN{printf "%.6f", 4*60/b}')
FIN=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SOURCE")
ENTREE=17.5         # entrée du beat dans le morceau
BOUCLE=12.0         # où reboucler, dans l'intro calme
FONDU=1.2           # durée d'un fondu enchaîné

read -r DUREE OFFRE RACCORD < <(SUPPORT="$SUPPORT" node -e '
  var fs = require("fs");
  eval(fs.readFileSync(process.env.SUPPORT + "/data.js", "utf8"));
  var t = 0, offre = 0, raccord = 0;
  SCENES.forEach(function (s) {
    if (s.id === "s4")  offre = t;
    if (s.id === "s14") raccord = t;
    t += s.confort;
  });
  console.log((t * TEMPO).toFixed(3), (offre * TEMPO).toFixed(3), (raccord * TEMPO).toFixed(3));
')

read -r DECAL SAUT A_FIN B_DEB B_FIN C_DEB FADE SORTIE < <(LC_ALL=C awk \
  -v d="$DUREE" -v o="$OFFRE" -v r="$RACCORD" -v m="$MESURE" \
  -v f="$FIN" -v e="$ENTREE" -v b="$BOUCLE" -v x="$FONDU" 'BEGIN {
    decal = int((o - e) / m + 0.5) * m;          # retard du beat, en mesures
    if (decal < 0) decal = 0;
    saut  = int((f - d + decal) / m) * m;        # coda, sans dépasser la fin
    printf "%.4f %.4f %.4f %.4f %.4f %.4f %.3f %.3f\n",
      decal, saut, b + x/2, b - x/2 - decal, r + x/2 - decal,
      r - x/2 - decal + saut, d - 1, d + 0.5;
  }')

echo "support $DUREE s · offre à $OFFRE s · beat décalé de $DECAL s"
echo "raccord $RACCORD s · saut $SAUT s · coda depuis $C_DEB s"

ffmpeg -v error -y \
  -i "$SOURCE" \
  -filter_complex "\
[0:a]atrim=0:$A_FIN,asetpts=N/SR/TB[a]; \
[0:a]atrim=$B_DEB:$B_FIN,asetpts=N/SR/TB[b]; \
[0:a]atrim=$C_DEB:$FIN,asetpts=N/SR/TB[c]; \
[a][b]acrossfade=d=$FONDU:c1=qsin:c2=qsin[ab]; \
[ab][c]acrossfade=d=$FONDU:c1=qsin:c2=qsin[x]; \
[x]afade=t=in:st=0:d=0.6,afade=t=out:st=$FADE:d=1,\
atrim=0:$SORTIE,apad=whole_dur=$SORTIE[out]" \
  -map "[out]" -c:a libmp3lame -b:a 192k -ar 48000 -ac 2 \
  "$SUPPORT/assets/musique.mp3"

echo "$SUPPORT/assets/musique.mp3 : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SUPPORT/assets/musique.mp3") s"
