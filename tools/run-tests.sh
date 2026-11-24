#!/usr/bin/env bash
# Roda tests/index.html no Chrome headless e imprime RESULT/FAIL.
# Sai com 0 só se houver "RESULT: N passed, 0 failed" e nenhum FAIL.
cd "$(dirname "$0")/.." || exit 2
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
out=$(timeout 90 "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$(pwd -W)/.chrome-profile" \
  --allow-file-access-from-files --virtual-time-budget=15000 \
  --dump-dom "file:///$(pwd -W)/tests/index.html" 2>/dev/null | grep -oE 'RESULT:[^<]*|FAIL:[^<]*')
echo "${out:-RESULT: (nenhum resultado — página não rodou)}"
echo "$out" | grep -q 'RESULT: [0-9]* passed, 0 failed' && ! echo "$out" | grep -q '^FAIL:'
