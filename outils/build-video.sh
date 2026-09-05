#!/usr/bin/env bash
# Fabrique une vidéo du support, avec la bande son.
#   ./build-video.sh                    -> la présentation entière
#   ./build-video.sh 46.4               -> les 46,4 premières secondes
#   ./build-video.sh 46.4 extrait.mp4   -> et sous ce nom
#
# L'image est filmée image par image dans un Chromium sans interface, en
# JPEG quasi sans perte, puis encodée en h264 à haut débit. Le son vient
# de assets/musique.mp3. Les deux sortent de la même timeline : la page
# rend son horodatage de départ, donc le calage est à la milliseconde.
#
# URL=...       adresse à filmer (défaut : serveur local 8790)
# SUPPORT=...   dossier du support, pour lire data.js (défaut : .)
# MUSIQUE=...   bande son (défaut : <support>/assets/musique.mp3)
# QUALITE=98    qualité des images intermédiaires (défaut 97)
# CRF=16        compression finale, plus bas = plus lourd (défaut 13)
# IPS=25        images par seconde en sortie (défaut 50)
# HORLOGE=1     pilote l'horloge du navigateur : images à intervalles
#               exacts, mais six fois plus lent et le compositeur reste
#               en retard. Mesuré sur le compteur de l'écran conquête :
#               57 % d'images figées contre 72 % sans, et 19 % pour un
#               enregistrement d'écran. Voir mux-capture.sh.
# Prérequis : bun ou npm, ffmpeg, python3, un Chromium du cache Playwright.
set -euo pipefail
cd "$(dirname "$0")"

SUPPORT="${SUPPORT:-.}"                 # dossier du support
URL="${URL:-http://127.0.0.1:8790/index.html}"
MUSIQUE="${MUSIQUE:-$SUPPORT/assets/musique.mp3}"
CRF="${CRF:-13}"
IPS="${IPS:-50}"
TRAVAIL=".video"

DUREE="${1:-$(SUPPORT="$SUPPORT" node -e '
  var fs = require("fs");
  eval(fs.readFileSync(process.env.SUPPORT + "/data.js", "utf8"));
  console.log((SCENES.reduce(function (a, s) { return a + s.confort; }, 0) * TEMPO).toFixed(1));
')}"
SORTIE="${2:-video-${DUREE}s.mp4}"

mkdir -p "$TRAVAIL"
if [ ! -d "$TRAVAIL/node_modules/playwright-core" ]; then
  echo "Installation de playwright-core"
  ( cd "$TRAVAIL" && (bun add playwright-core >/dev/null 2>&1 || npm install --silent playwright-core) )
fi

rm -rf "$TRAVAIL/images"; mkdir -p "$TRAVAIL/images"
echo "Tournage de $DUREE s depuis $URL"

if [ "${HORLOGE:-0}" = "1" ]; then
  cp outils/tourne-horloge.mjs "$TRAVAIL/"   # pour qu'il voie son node_modules
  IPS="$IPS" node "$TRAVAIL/tourne-horloge.mjs" "$URL" "$DUREE" "$TRAVAIL/images"
  ENTREE=(-framerate "$IPS" -i "$TRAVAIL/images/i%06d.jpg")
else
  cp outils/tourne.mjs "$TRAVAIL/"           # pour qu'il voie son node_modules
  node "$TRAVAIL/tourne.mjs" "$URL" "$DUREE" "$TRAVAIL/images"
  python3 outils/monte.py "$TRAVAIL/images" "$TRAVAIL/images/liste.txt" "$IPS"
  ENTREE=(-f concat -safe 0 -i "$TRAVAIL/images/liste.txt")
fi

echo "Encodage à crf $CRF"
ffmpeg -v error -y "${ENTREE[@]}" \
  -i "$MUSIQUE" \
  -t "$DUREE" -map 0:v -map 1:a \
  -vf "fps=$IPS,fade=t=out:st=$(LC_ALL=C awk -v d="$DUREE" 'BEGIN{printf "%.2f", d-0.5}'):d=0.5" \
  -af "afade=t=out:st=$(LC_ALL=C awk -v d="$DUREE" 'BEGIN{printf "%.2f", d-0.8}'):d=0.8" \
  -c:v libx264 -crf "$CRF" -preset slow -tune film -pix_fmt yuv420p \
  -c:a aac -b:a 224k -movflags +faststart "$SORTIE"

echo "$SORTIE : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SORTIE") s, $(du -h "$SORTIE" | cut -f1)"
