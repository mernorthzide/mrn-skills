// Run via `npm test` (builds first, then checks the exported site in out/).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSkills, loadInstall, INSTALL_PROMPTS, REPO_URL } from "./skills.mjs";

function tempRepo(skills) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mrn-skills-"));
  for (const [folder, src] of Object.entries(skills)) {
    fs.mkdirSync(path.join(root, "plugins/mrn/skills", folder), { recursive: true });
    fs.writeFileSync(path.join(root, "plugins/mrn/skills", folder, "SKILL.md"), src);
  }
  return root;
}
const skill = (fm, body = "# T\n\nสรุปภาษาไทย") => `---\n${fm}\n---\n\n${body}\n`;

test("real repo: prove-it is loaded with its metadata, files and rendered body", () => {
  const s = loadSkills().find((x) => x.name === "prove-it");
  assert.ok(s, "prove-it missing");
  assert.match(s.description, /^Proves a code change works/);
  assert.ok(s.argumentHint);
  assert.deepEqual(s.files.map((f) => f.path), ["SKILL.md", "ab-eval.md", "edge-matrix.md"]);
  assert.match(s.summary, /claim/);
  assert.match(s.html, /<table>/);
});

test("both install prompts are read verbatim and yield the same two terminal commands", () => {
  for (const [lang, file] of Object.entries(INSTALL_PROMPTS)) {
    const { prompt, commands } = loadInstall(lang);
    assert.equal(prompt, fs.readFileSync(file, "utf8").trim());
    assert.deepEqual(commands, [
      "claude plugin marketplace add https://github.com/mernorthzide/mrn-skills.git",
      "claude plugin install mrn@mrn-skills",
    ], `${file} commands`);
    for (const step of ["claude plugin marketplace update mrn-skills", "claude plugin update mrn@mrn-skills", "CLAUDE_CONFIG_DIR", '"autoUpdate": true', "claude plugin list", "/reload-plugins"]) {
      assert.ok(prompt.includes(step), `${file} lost a step: ${step}`);
    }
  }
});

test("English summary is the description without its trigger phrases", () => {
  const root = tempRepo({ a: skill('name: a\ndescription: Does X well. Use when the user says "x", "เอ็กซ์".') });
  assert.equal(loadSkills(root)[0].summaryEn, "Does X well.");
  const plain = tempRepo({ b: skill("name: b\ndescription: Only says what it does.") });
  assert.equal(loadSkills(plain)[0].summaryEn, "Only says what it does.");
});

test("the trigger phrases are split out for the facts panel, so the lede is not repeated there", () => {
  const root = tempRepo({ a: skill('name: a\ndescription: Does X well. Use when the user says "x". Use when asked twice.') });
  assert.equal(loadSkills(root)[0].useWhen, 'The user says "x". Use when asked twice.');
  const plain = tempRepo({ b: skill("name: b\ndescription: Only says what it does.") });
  assert.equal(loadSkills(plain)[0].useWhen, null);
  const onlyWhen = tempRepo({ c: skill("name: c\ndescription: Use when asked.") });
  assert.equal(loadSkills(onlyWhen)[0].useWhen, "Asked.");
});

test("shipped skills work on any machine: no maintainer-only tools, models or CLAUDE.md sections are required", () => {
  const maintainerOnly = [
    [/ego-browser\s*เท่านั้น/, "ego-browser as the only browser"],
    [/jev-model-router/, "the maintainer's model router"],
    [/claude-(opus|sonnet|haiku|fable)-\d/, "a fixed model id"],
    [/กฎหัวข้อ UX\/UI ใน CLAUDE\.md/, "a section of the maintainer's CLAUDE.md"],
    [/ตามกฎ Codex review/, "the maintainer's Codex review rule as the only reviewer"],
    [/\/Users\/\w|~\/\.claude\/(local-plugins|CLAUDE\.md|skills)/, "a path on the maintainer's machine"],
  ];
  for (const s of loadSkills()) {
    const md = fs.readFileSync(`plugins/mrn/skills/${s.name}/SKILL.md`, "utf8");
    for (const [re, what] of maintainerOnly) assert.doesNotMatch(md, re, `${s.name} requires ${what}`);
  }
});

test("plugin.json has no version, so every push is an update (version = commit SHA)", () => {
  const manifest = JSON.parse(fs.readFileSync("plugins/mrn/.claude-plugin/plugin.json", "utf8"));
  assert.equal(manifest.version, undefined);
});

test("build fails loudly on a SKILL.md without description", () => {
  const root = tempRepo({ broken: skill("name: broken") });
  assert.throws(() => loadSkills(root), /skills\/broken\/SKILL\.md: frontmatter has no `description`/);
});

test("build fails loudly when name differs from folder", () => {
  const root = tempRepo({ "my-skill": skill("name: other\ndescription: d") });
  assert.throws(() => loadSkills(root), /name "other" must match its folder name "my-skill"/);
});

test("build fails loudly on missing frontmatter", () => {
  const root = tempRepo({ plain: "# no frontmatter\n" });
  assert.throws(() => loadSkills(root), /missing YAML frontmatter/);
});

test("new skill folders appear without any list to edit; uncommitted ones have no date", () => {
  const root = tempRepo({
    alpha: skill("name: alpha\ndescription: First"),
    "beta-thai": skill('name: beta-thai\ndescription: >\n  multi line\n  description\nargument-hint: "[ไฟล์]"'),
  });
  const skills = loadSkills(root);
  assert.deepEqual(skills.map((s) => s.name), ["alpha", "beta-thai"]);
  assert.equal(skills[1].description, "multi line description");
  assert.equal(skills[1].argumentHint, "[ไฟล์]");
  assert.equal(skills[0].summary, "สรุปภาษาไทย");
  assert.equal(skills[0].updated, null);
});

test("links and files point at the skill's folder on GitHub, so relative links in SKILL.md don't 404 on the site", () => {
  const body = "# T\n\nสรุป [a](a.md) [b](../other/b.md#x) [dir](scripts/) [web](https://example.com/x.md) [top](#top)";
  const root = tempRepo({ linky: skill("name: linky\ndescription: d", body) });
  fs.writeFileSync(path.join(root, "plugins/mrn/skills/linky/a.md"), "a");
  const s = loadSkills(root)[0];
  const blob = `${REPO_URL}/blob/main/plugins/mrn/skills`;
  assert.equal(s.sourceUrl, `${REPO_URL}/tree/main/plugins/mrn/skills/linky`);
  assert.deepEqual(s.files, [
    { path: "SKILL.md", url: `${blob}/linky/SKILL.md` },
    { path: "a.md", url: `${blob}/linky/a.md` },
  ]);
  for (const href of [`${blob}/linky/a.md`, `${blob}/other/b.md#x`, `${blob}/linky/scripts/`, "https://example.com/x.md", "#top"]) {
    assert.ok(s.html.includes(`href="${href}"`), `missing href="${href}" in ${s.html}`);
  }
});

// English is the default at /, Thai lives under /th/.
const SITES = { en: { dir: "out", eg: "e.g. " }, th: { dir: "out/th", eg: "เช่น " } };

test("exported site has an index and one page per skill in each language", () => {
  for (const [lang, { dir, eg }] of Object.entries(SITES)) {
    const index = fs.readFileSync(`${dir}/index.html`, "utf8");
    assert.match(index, new RegExp(`<html lang="${lang}"`), `${dir} is not <html lang="${lang}">`);
    for (const s of loadSkills()) {
      assert.ok(index.includes(`/mrn:${s.name}`), `${dir} index lacks /mrn:${s.name}`);
      assert.ok(index.includes(`href="${lang === "th" ? "/th" : ""}/skills/${s.name}/"`), `${dir} index does not link ${s.name} in ${lang}`);
      const page = fs.readFileSync(`${dir}/skills/${s.name}/index.html`, "utf8");
      assert.match(page, new RegExp(`<html lang="${lang}"`), `${dir}/skills/${s.name} is not <html lang="${lang}">`);
      assert.match(page, /<article class="prose" lang="th">/, "skill bodies are Thai in both languages");
      if (s.argumentHint) assert.match(page, /<span class="hint" lang="th">/, `${s.name} hint is Thai but not marked so`);
    }
    assert.ok(index.includes("claude plugin install mrn@mrn-skills"));
    assert.match(index, /<link rel="icon"[^>]*href="\/icon\.svg/, "no favicon, so every page requests /favicon.ico and gets a 404");
    const { prompt } = loadInstall(lang);
    assert.ok(index.includes(prompt.slice(0, 40)), `${dir} index does not show its own install prompt`);
    const example = /\/mrn:[\w-]+/.exec(prompt)[0];
    assert.ok(index.includes(`${eg}<code>${example}</code>`), `${dir} index example differs from the install prompt's ${example}`);
  }
});

test("the 404 page has its own <html> (one root layout per language) and points both ways", () => {
  const page = fs.readFileSync("out/404.html", "utf8");
  assert.match(page, /<html lang="en"/);
  assert.match(page, /stylesheet/, "404 page lost the site styles");
  assert.match(page, /<p lang="th">/);
});

test("a missing /th/ URL gets a Thai 404 that leads back into /th/ (Cloudflare serves the nearest 404.html)", () => {
  assert.ok(fs.existsSync("out/th/404.html"), "no out/th/404.html, so /th/<missing> falls back to the English 404");
  const page = fs.readFileSync("out/th/404.html", "utf8");
  assert.match(page, /<html lang="th"/);
  assert.match(page, /stylesheet/, "Thai 404 page lost the site styles");
  assert.ok(page.includes('href="/th/#skills"'), "Thai 404 does not link back to the Thai catalog");
  assert.ok(!fs.existsSync("out/th/404/index.html"), "/th/404/ would be served as a normal 200 page");
});

test("skill pages never repeat the lede in the facts panel (BUG-04)", () => {
  for (const { dir } of Object.values(SITES))
    for (const s of loadSkills()) {
      const page = fs.readFileSync(`${dir}/skills/${s.name}/index.html`, "utf8");
      const dd = /<dt>[^<]*<\/dt><dd lang="en">([^<]*)<\/dd>/.exec(page)?.[1];
      if (!/Use when/.test(s.description)) { assert.equal(dd, undefined, `${dir}/${s.name} has no trigger phrases but shows a "when" row`); continue; }
      assert.ok(dd && dd.startsWith("The user"), `${dir}/${s.name} "when" row should start with the trigger, got: ${dd?.slice(0, 60)}`);
      assert.ok(!dd.includes(s.summaryEn.slice(0, 40)), `${dir}/${s.name} repeats the summary in the facts panel`);
    }
});

test("every page names its canonical URL and its language pair for search engines (BUG-06)", () => {
  const SITE = "https://mrn-skills.mernorthzide.workers.dev";
  const links = (html) => [...html.matchAll(/<link rel="(canonical|alternate)"[^>]*>/g)].map((m) => m[0]);
  const pages = ["/", ...loadSkills().map((s) => `/skills/${s.name}/`)];
  for (const p of pages)
    for (const [lang, file] of [["en", `out${p}index.html`], ["th", `out/th${p}index.html`]]) {
      const tags = links(fs.readFileSync(file, "utf8"));
      const self = lang === "th" ? `${SITE}/th${p}` : `${SITE}${p}`;
      assert.deepEqual(tags.filter((t) => t.includes('rel="canonical"')), [`<link rel="canonical" href="${self}"/>`], `${file} canonical`);
      for (const [hl, url] of [["en", `${SITE}${p}`], ["th", `${SITE}/th${p}`], ["x-default", `${SITE}${p}`]])
        assert.ok(tags.includes(`<link rel="alternate" hrefLang="${hl}" href="${url}"/>`), `${file} lacks hreflang ${hl} -> ${url}; has ${tags.join(" ")}`);
    }
  for (const file of ["out/404.html", "out/th/404.html"])
    assert.deepEqual(links(fs.readFileSync(file, "utf8")), [], `${file} is a 404 and must not claim a canonical URL`);
});

test("404 pages tell search engines not to index them (/404 and /th/404 are also served with 200)", () => {
  for (const file of ["out/404.html", "out/th/404.html"])
    assert.match(fs.readFileSync(file, "utf8"), /<meta name="robots" content="noindex"\/>/, `${file} has no noindex`);
});

test("the language switch links each page to the same page in the other language", () => {
  const pages = [
    ["out/index.html", 'href="/th/" lang="th"'],
    ["out/th/index.html", 'href="/" lang="en"'],
    ...loadSkills().flatMap(({ name }) => [
      [`out/skills/${name}/index.html`, `href="/th/skills/${name}/" lang="th"`],
      [`out/th/skills/${name}/index.html`, `href="/skills/${name}/" lang="en"`],
    ]),
  ];
  for (const [page, other] of pages) assert.ok(fs.readFileSync(page, "utf8").includes(other), `${page} lacks ${other}`);
});

test("Thai pages link within /th/ and English pages never do", () => {
  const name = loadSkills()[0].name;
  const links = (page) => [...fs.readFileSync(page, "utf8").matchAll(/<a [^>]*href="\/[^"]*"[^>]*>/g)].map((m) => m[0]);
  for (const a of links(`out/th/skills/${name}/index.html`)) if (!/lang="en"/.test(a)) assert.match(a, /href="\/th\//, a);
  for (const a of links(`out/skills/${name}/index.html`)) if (!/lang="th"/.test(a)) assert.doesNotMatch(a, /href="\/th\//, a);
});

test("exported skill pages have no relative links (the site serves no .md files, so they would 404)", () => {
  for (const { dir } of Object.values(SITES)) {
    for (const s of loadSkills()) {
      const page = fs.readFileSync(`${dir}/skills/${s.name}/index.html`, "utf8");
      const relative = [...page.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).filter((h) => !/^([a-z][a-z\d+.-]*:|\/|#)/i.test(h));
      assert.deepEqual(relative, [], `${dir}/${s.name} has relative links`);
    }
  }
});
