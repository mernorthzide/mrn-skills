#!/bin/bash
# Prints an HTML report to A4 PDF with headless Chrome, waiting for CDN scripts (Tailwind, Mermaid) to render.
# Usage: to-pdf.sh <report.html> [out.pdf]
set -euo pipefail
in=$1
out=${2:-${in%.html}.pdf}
chrome=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "/Applications/Chromium.app/Contents/MacOS/Chromium" \
         "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && chrome=$c && break
done
[ -n "$chrome" ] || { echo "to-pdf: Chrome/Chromium not found" >&2; exit 1; }
"$chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=15000 --run-all-compositor-stages-before-draw \
  --print-to-pdf="$out" "file://$(cd "$(dirname "$in")" && pwd)/$(basename "$in")" 2>/dev/null
[ -s "$out" ] || { echo "to-pdf: no PDF written" >&2; exit 1; }
echo "$out"
