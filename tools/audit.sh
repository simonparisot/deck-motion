#!/usr/bin/env bash
# Measures how loaded each slide is. See references/writing.md.
#   ./outils/audit.sh                                 deck served on 8790
#   ./outils/audit.sh http://127.0.0.1:8080/deck/     another address
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$HERE/../.tools"
mkdir -p "$WORK"
if [ ! -d "$WORK/node_modules/playwright-core" ]; then
  ( cd "$WORK" && (bun add playwright-core >/dev/null 2>&1 || npm install --silent playwright-core) )
fi
cp "$HERE/audit.mjs" "$WORK/"
node "$WORK/audit.mjs" "${1:-http://127.0.0.1:8790/index.html}"
