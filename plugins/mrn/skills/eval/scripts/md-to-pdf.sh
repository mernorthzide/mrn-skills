#!/bin/bash
# Converts an eval report (Markdown) to an A4 PDF next to it: marked (via npx) -> styled HTML -> headless Chrome.
# Usage: md-to-pdf.sh <report.md> [out.pdf]
set -euo pipefail
in=$1
out=${2:-${in%.md}.pdf}
chrome=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "/Applications/Chromium.app/Contents/MacOS/Chromium" \
         "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && chrome=$c && break
done
[ -n "$chrome" ] || { echo "md-to-pdf: Chrome/Chromium not found" >&2; exit 1; }
command -v npx >/dev/null || { echo "md-to-pdf: npx not found (needs Node.js)" >&2; exit 1; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
title=$(head -1 "$in" | sed 's/^# *//; s/[<>&]//g')
npx -y marked@15.0.12 --gfm -i "$in" -o "$work/body.html"
{
cat <<EOF
<!doctype html><html lang="th"><head><meta charset="utf-8"><title>$title</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:18mm 16mm 20mm}
body{font-family:"Sarabun","Sukhumvit Set",sans-serif;font-size:11.5pt;line-height:1.7;color:#1a1a1a}
h1{font-size:20pt;line-height:1.35;margin:0 0 10pt;color:#111}
h2{font-size:14.5pt;line-height:1.4;margin:20pt 0 6pt;padding-top:6pt;border-top:1px solid #ddd;break-after:avoid}
h3{font-size:12pt;margin:14pt 0 4pt;break-after:avoid}
p{margin:0 0 8pt}
a{color:#0b5cad;text-decoration:none;overflow-wrap:anywhere}
td code,td a{overflow-wrap:anywhere;word-break:break-all}
table{border-collapse:collapse;width:100%;margin:8pt 0 12pt;font-size:9.5pt;line-height:1.5}
th,td{border:1px solid #ccc;padding:4pt 6pt;vertical-align:top;text-align:left;overflow-wrap:break-word}
th{background:#f2f4f7}
tr{break-inside:avoid}
code{font-family:Menlo,monospace;font-size:9pt;background:#f4f4f4;padding:0 2pt}
h1 code,h2 code,h3 code{font-size:.85em}
img{max-width:100%;max-height:140mm;width:auto;height:auto;border:1px solid #ddd;margin:4pt 0;break-inside:avoid}
</style></head><body>
EOF
cat "$work/body.html"
echo '</body></html>'
} > "$work/report.html"
"$chrome" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf="$out" "file://$work/report.html" 2>/dev/null
[ -s "$out" ] || { echo "md-to-pdf: no PDF written" >&2; exit 1; }
echo "$out"
