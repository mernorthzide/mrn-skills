// Run via `npm test` (builds first, then checks the exported site in out/).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSkills, loadInstall } from "./skills.mjs";

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
  assert.deepEqual(s.files, ["SKILL.md", "ab-eval.md", "edge-matrix.md"]);
  assert.match(s.summary, /claim/);
  assert.match(s.html, /<table>/);
});

test("install prompt is read verbatim and yields the two terminal commands", () => {
  const { prompt, commands } = loadInstall();
  assert.equal(prompt, fs.readFileSync("install-prompt.md", "utf8").trim());
  assert.deepEqual(commands, [
    "claude plugin marketplace add https://github.com/mernorthzide/mrn-skills.git",
    "claude plugin install mrn@mrn-skills",
  ]);
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

test("exported site has the index and one page per skill", () => {
  const index = fs.readFileSync("out/index.html", "utf8");
  for (const s of loadSkills()) {
    assert.ok(index.includes(`/mrn:${s.name}`), `index lacks /mrn:${s.name}`);
    assert.ok(fs.existsSync(`out/skills/${s.name}/index.html`), `no page for ${s.name}`);
  }
  assert.ok(index.includes("claude plugin install mrn@mrn-skills"));
});
