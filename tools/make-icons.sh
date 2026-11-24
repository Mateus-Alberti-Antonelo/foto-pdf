#!/usr/bin/env bash
# Gera icons/icon-192.png e icons/icon-512.png a partir de tools/icon.html.
cd "$(dirname "$0")/.." || exit 2
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p icons
for size in 192 512; do
  "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$(pwd -W)/.chrome-profile" \
    --dump-dom "file:///$(pwd -W)/tools/icon.html?size=$size" 2>/dev/null \
    | sed -n 's/.*<pre id="png">\([^<]*\)<\/pre>.*/\1/p' | base64 -d > "icons/icon-$size.png"
done
ls -l icons
