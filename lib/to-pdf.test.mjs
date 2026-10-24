// Runs plugins/mrn/scripts/to-pdf.sh for real (needs Chrome; skipped without it): node --test lib/to-pdf.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../plugins/mrn/scripts/to-pdf.sh", import.meta.url));
const hasChrome =
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"].some(fs.existsSync) ||
  spawnSync("sh", ["-c", "command -v google-chrome || command -v chromium"]).status === 0;
const chromeTest = hasChrome ? test : test.skip;
const run = (...args) => spawnSync("bash", [script, ...args], { encoding: "utf8" });
// a space, Thai and "#" in the folder name, as report folders can have
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "to-pdf รายงาน #"));
// 37x23 PNG: Chrome embeds it with these dimensions; a broken image shows a 14x16 icon instead
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAACUAAAAXCAIAAAADThHyAAAAJklEQVR42mM4oaFBT8Qwat+ofaP2jdo3at+ofaP2jdo3at+gsg8ALsKi9qLDEgoAAAAASUVORK5CYII=", "base64");

chromeTest("md with a table and a relative image becomes a PDF next to it, with the image loaded", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, "screens"));
  fs.writeFileSync(path.join(dir, "screens", "bug-01.png"), png);
  fs.writeFileSync(
    path.join(dir, "REPORT.md"),
    "# รายงานทดสอบ\n\n| ID | ชื่อ |\n|---|---|\n| BUG-01 | ปุ่มบันทึกไม่ทำงาน |\n\n![BUG-01](screens/bug-01.png)\n",
  );
  const r = run(path.join(dir, "REPORT.md"));
  assert.equal(r.status, 0, r.stderr);
  const out = path.join(dir, "REPORT.pdf");
  assert.equal(r.stdout.trim(), out);
  const pdf = fs.readFileSync(out, "latin1");
  assert.ok(pdf.startsWith("%PDF"));
  assert.ok(/\/Width 37\n\/Height 23\n/.test(pdf), "relative image not embedded");
  assert.deepEqual(fs.readdirSync(dir).filter((f) => f.startsWith(".to-pdf")), [], "temp page left behind");
});

chromeTest("html becomes a PDF, and Date.now() stays unique after virtual time jumps (Mermaid ids)", () => {
  const dir = tempDir();
  fs.writeFileSync(
    path.join(dir, "report.html"),
    `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>pending</title>
<script type="module">
await new Promise((r) => setTimeout(r, 50)); // the virtual clock jumps here, then stands still
const ids = new Set();
for (let i = 0; i < 5; i++) { ids.add(Date.now()); await Promise.resolve(); }
document.title = ids.size === 5 ? "ids-unique" : "ids-dup";
</script></head><body><p>สวัสดี</p></body></html>`,
  );
  const out = path.join(dir, "out.pdf");
  const r = run(path.join(dir, "report.html"), out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.readFileSync(out, "latin1").includes("/Title (ids-unique)"), "Mermaid-style ids collided");
});

test("a stale PDF is removed when the input is unusable, so it cannot pass for a fresh one", () => {
  const dir = tempDir();
  const out = path.join(dir, "REPORT.pdf");
  fs.writeFileSync(out, "%PDF-1.4 stale");
  const r = run(path.join(dir, "missing.md"), out);
  assert.notEqual(r.status, 0);
  assert.equal(fs.existsSync(out), false, "stale PDF left behind");
});

test("an out path that is not .pdf is refused, so the input can never be deleted as the 'stale PDF'", () => {
  const dir = tempDir();
  const input = path.join(dir, "report.html");
  fs.writeFileSync(input, "<!doctype html><p>keep me</p>");
  const r = run(input, input);
  assert.notEqual(r.status, 0);
  assert.equal(fs.readFileSync(input, "utf8"), "<!doctype html><p>keep me</p>");
});

chromeTest("an input in a read-only folder still prints, with its relative image, to a writable out", () => {
  const dir = tempDir();
  const ro = path.join(dir, "ro");
  fs.mkdirSync(path.join(ro, "screens"), { recursive: true });
  fs.writeFileSync(path.join(ro, "screens", "a.png"), png);
  fs.writeFileSync(path.join(ro, "r.md"), "# อ่านอย่างเดียว\n\n![a](screens/a.png)\n");
  fs.chmodSync(ro, 0o555);
  try {
    const r = run(path.join(ro, "r.md"), path.join(dir, "out.pdf"));
    assert.equal(r.status, 0, r.stderr);
    assert.ok(/\/Width 37\n\/Height 23\n/.test(fs.readFileSync(path.join(dir, "out.pdf"), "latin1")), "relative image not embedded");
  } finally {
    fs.chmodSync(ro, 0o755);
  }
});

test("no argument prints the usage instead of a shell error", () => {
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage: to-pdf\.sh <in\.md\|in\.html> \[out\.pdf\]/i);
});

chromeTest("html without a <head> tag in a read-only folder still loads its relative image", () => {
  const dir = tempDir();
  const ro = path.join(dir, "ro");
  fs.mkdirSync(ro);
  fs.writeFileSync(path.join(ro, "a.png"), png);
  fs.writeFileSync(path.join(ro, "r.html"), '<!doctype html><title>r</title><img src="a.png">');
  fs.chmodSync(ro, 0o555);
  try {
    const r = run(path.join(ro, "r.html"), path.join(dir, "out.pdf"));
    assert.equal(r.status, 0, r.stderr);
    assert.ok(/\/Width 37\n\/Height 23\n/.test(fs.readFileSync(path.join(dir, "out.pdf"), "latin1")), "relative image not embedded");
  } finally {
    fs.chmodSync(ro, 0o755);
  }
});
