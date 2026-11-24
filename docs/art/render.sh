#!/usr/bin/env sh
# Re-render the README art into docs/: sh docs/art/render.sh
# Needs Edge or Chrome (set BROWSER_BIN to its path) and an internet connection for Google Fonts.
cd "$(dirname "$0")"
D="$(pwd -W 2>/dev/null || pwd)"
B="${BROWSER_BIN:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
shot() { # name size [hash] [out] [scale]
  P="$(mktemp -d)"; W="$P"; command -v cygpath >/dev/null && W="$(cygpath -w "$P")"
  "$B" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$W" \
    --force-device-scale-factor="${5:-2}" --virtual-time-budget=6000 --window-size="$2" \
    --screenshot="$D/../${4:-$1}.png" "file:///$D/$1.html$3"
}
shot hero 1600,1000;  shot hero 1280,640 '#social' social-preview 1  # GitHub social preview: 1280x640, under 1 MB
  shot hero 800,1480 '#phone' hero-phone
shot xray 1600,860;   shot xray 800,1540 '#phone' xray-phone
shot steps 1600,680;  shot steps 800,1500 '#phone' steps-phone
# Edge on Windows returns before the headless child writes the file
sleep 12
ls -la ../*.png
