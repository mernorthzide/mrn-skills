#!/bin/bash
# Prints a report to an A4 PDF next to it with headless Chrome.
# .md: marked (via npx) -> styled HTML. .html: as is, after CDN scripts (Tailwind, Mermaid) render.
# Usage: to-pdf.sh <in.md|in.html> [out.pdf]
set -euo pipefail
in=${1:-}
[ -n "$in" ] || { echo "usage: to-pdf.sh <in.md|in.html> [out.pdf]" >&2; exit 1; }
out=${2:-${in%.*}.pdf}
case $in in *.md|*.html) ;; *) echo "to-pdf: input must be .md or .html" >&2; exit 1 ;; esac
case $out in *.pdf) ;; *) echo "to-pdf: output must be .pdf" >&2; exit 1 ;; esac # so the rm below can never hit the input
rm -f "$out" # a stale PDF must not pass the [ -s ] check below
[ -f "$in" ] || { echo "to-pdf: $in not found" >&2; exit 1; }
chrome=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "/Applications/Chromium.app/Contents/MacOS/Chromium" \
         "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && chrome=$c && break
done
[ -n "$chrome" ] || { echo "to-pdf: Chrome/Chromium not found" >&2; exit 1; }

# The page Chrome prints sits next to the input, so relative image paths and #anchors resolve as in the original.
# A read-only folder gets the page in $TMPDIR with <base href> instead (in-page #anchors then point at the folder).
dir=$(cd "$(dirname "$in")" && pwd)
base=""
if [ -w "$dir" ]; then
  page="$dir/.to-pdf-$$.html"
else
  page="${TMPDIR:-/tmp}/to-pdf-$$.html"
  base="<base href=\"file://$(printf '%s/' "$dir" | perl -pe 's/([^A-Za-z0-9\/._~-])/sprintf("%%%02X", ord $1)/ge')\">"
fi
trap 'rm -f "$page"' EXIT
if [ "${in##*.}" = md ]; then
command -v npx >/dev/null || { echo "to-pdf: npx not found (needs Node.js)" >&2; exit 1; }
title=$(head -1 "$in" | sed 's/^# *//; s/[<>&]//g')
{
cat <<EOF
<!doctype html><html lang="th"><head><meta charset="utf-8">$base<title>$title</title>
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
td:first-child{min-width:4.5em}
code{font-family:Menlo,monospace;font-size:9pt;background:#f4f4f4;padding:0 2pt}
h1 code,h2 code,h3 code{font-size:.85em}
img{max-width:100%;max-height:140mm;width:auto;height:auto;border:1px solid #ddd;margin:4pt 0;break-inside:avoid}
</style></head><body>
EOF
npx -y marked@15.0.12 --gfm -i "$in"
echo '</body></html>'
} > "$page"
else
# --virtual-time-budget jumps the clock past timers, then Date.now() stays frozen until real time catches up.
# Mermaid ids are "mermaid-"+Date.now(), so diagrams rendered in that window share one id and all draw into
# the first svg. Make Date.now() strictly increasing. ponytail: performance.now() stays frozen; drive Chrome over CDP if a report needs it.
# Goes after <head>, or after the doctype when <head> is omitted; a page's own <base> wins over ours.
BASE=$base perl -0pe 'my $x = (/<base\b/i ? "" : $ENV{BASE}) . "<script>{const n=Date.now;let l=0;Date.now=()=>l=Math.max(n(),l+1)}</script>";
  s/<head\b[^>]*>/$&$x/i or s/^(\s*<!doctype[^>]*>)?/$1$x/i' "$in" > "$page"
fi
"$chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=15000 --run-all-compositor-stages-before-draw \
  --print-to-pdf="$out" "$page" 2>/dev/null
[ -s "$out" ] || { echo "to-pdf: no PDF written" >&2; exit 1; }
echo "$out"
