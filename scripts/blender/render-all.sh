#!/bin/bash
# Renders every Blender asset for the site (Cycles, Apple GPU).
#   npm run render            → sheets + split sequence (final quality)
#   npm run render -- preview → quick low-sample pass to check framing
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"

BLENDER="${BLENDER:-}"
for c in "$BLENDER" /Applications/Blender.app/Contents/MacOS/Blender "$HOME/Applications/Blender.app/Contents/MacOS/Blender" "$(command -v blender || true)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then BLENDER="$c"; break; fi
done
if [ -z "$BLENDER" ] || [ ! -x "$BLENDER" ]; then
  echo "Blender not found. Install it from https://www.blender.org/download/ (macOS Apple Silicon)."; exit 1
fi
echo "Using $BLENDER"

if [ "${1:-}" = "preview" ]; then SHEET_SAMPLES=16; SPLIT_SAMPLES=8; FRAMES=24; else SHEET_SAMPLES=96; SPLIT_SAMPLES=40; FRAMES=72; fi

"$BLENDER" -b --factory-startup -P scripts/blender/render_sheets.py -- "$ROOT" "$SHEET_SAMPLES"
"$BLENDER" -b --factory-startup -P scripts/blender/render_split.py -- "$ROOT" carrara "$FRAMES" "$SPLIT_SAMPLES"
PATH="/usr/local/bin:$PATH" node scripts/scan-renders.mjs
echo "Renders done → public/images/sheets/ and public/seq/split/"
