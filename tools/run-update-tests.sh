#!/usr/bin/env bash
# Testa a atualização do app (service worker) num servidor local.
# Sobe tools/serve.ps1, abre tests/update.html no Chrome headless com perfil limpo,
# espera a página mandar o resultado (.update-result.txt) e encerra tudo.
cd "$(dirname "$0")/.." || exit 2
PORT=8765
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PROFILE=".chrome-profile-update"
RESULT=".update-result.txt"
rm -rf "$PROFILE" "$RESULT"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/serve.ps1 -Port $PORT >/dev/null 2>&1 &
for i in $(seq 1 50); do curl -s -o /dev/null "http://localhost:$PORT/index.html" && break; sleep 0.2; done
"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$(pwd -W)/$PROFILE" \
  "http://localhost:$PORT/tests/update.html" >/dev/null 2>&1 &
for i in $(seq 1 120); do [ -s "$RESULT" ] && break; sleep 0.5; done
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*chrome-profile-update*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1
curl -s -o /dev/null --max-time 5 "http://localhost:$PORT/__quit"
wait
out=$(grep -E '^(RESULT|FAIL):' "$RESULT" 2>/dev/null)
rm -rf "$PROFILE" "$RESULT"
echo "${out:-RESULT: (nenhum resultado — página não rodou)}"
echo "$out" | grep -q 'RESULT: [0-9]* passed, 0 failed' && ! echo "$out" | grep -q '^FAIL:'
