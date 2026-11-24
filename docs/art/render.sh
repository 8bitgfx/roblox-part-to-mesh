#!/usr/bin/env sh
# Re-render the README art into docs/: sh docs/art/render.sh
# Needs Edge or Chrome (set BROWSER_BIN to its path) and an internet connection for Google Fonts.
cd "$(dirname "$0")"
D="$(pwd -W 2>/dev/null || pwd)"
B="${BROWSER_BIN:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
shot() {
  P="$(mktemp -d)"; W="$P"; command -v cygpath >/dev/null && W="$(cygpath -w "$P")"
  "$B" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$W" \
    --force-device-scale-factor=2 --virtual-time-budget=6000 --window-size="$2" \
    --screenshot="$D/../$1.png" "file:///$D/$1.html"
}
shot hero 1600,1000
shot xray 1600,860
shot steps 1600,640
# Edge on Windows returns before the headless child writes the file
sleep 10
ls -la ../*.png
