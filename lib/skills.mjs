// Build-time data: every page is generated from plugins/mrn/skills/*/SKILL.md and install-prompt.md.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "yaml";
import { marked } from "marked";

export const REPO_URL = "https://github.com/mernorthzide/mrn-skills";
const SKILLS_DIR = "plugins/mrn/skills";

export function loadSkills(root = process.cwd()) {
  const dir = path.join(root, SKILLS_DIR);
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => readSkill(root, d.name))
    .sort((a, b) => (a.added ?? "9999").localeCompare(b.added ?? "9999") || a.name.localeCompare(b.name));
}

function readSkill(root, folder) {
  const rel = `${SKILLS_DIR}/${folder}`;
  const file = path.join(root, rel, "SKILL.md");
  const fail = (msg) => {
    throw new Error(`${rel}/SKILL.md: ${msg}`);
  };
  if (!fs.existsSync(file)) fail("file is missing");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(fs.readFileSync(file, "utf8"));
  if (!m) fail("missing YAML frontmatter (--- name/description ---)");
  const fm = parse(m[1]) ?? {};
  if (!fm.name) fail("frontmatter has no `name`");
  if (!fm.description) fail("frontmatter has no `description`");
  if (fm.name !== folder) fail(`name "${fm.name}" must match its folder name "${folder}"`);

  const body = m[2].trim();
  const dates = gitDates(root, rel);
  // The site serves no skill files, so relative links in SKILL.md go to the file on GitHub.
  const blob = `${REPO_URL}/blob/main/${rel}/`;
  const toGitHub = (t) => {
    if (t.type === "link" && !/^([a-z][a-z\d+.-]*:|\/|#)/i.test(t.href)) t.href = new URL(t.href, blob).href;
  };
  return {
    name: fm.name,
    description: String(fm.description).trim(),
    argumentHint: fm["argument-hint"] ? String(fm["argument-hint"]) : null,
    summary: firstParagraph(body),
    html: marked.parse(body, { walkTokens: toGitHub }),
    sourceUrl: `${REPO_URL}/tree/main/${rel}`,
    files: listFiles(path.join(root, rel)).map((f) => ({ path: f, url: new URL(f, blob).href })),
    updated: dates[0] ?? null,
    added: dates.at(-1) ?? null,
  };
}

// Newest first; empty when the folder is not committed yet (or git is unavailable).
function gitDates(root, rel) {
  try {
    return execFileSync("git", ["log", "--format=%cs", "--", rel], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function listFiles(dir, prefix = "") {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? listFiles(path.join(dir, d.name), `${prefix}${d.name}/`) : [`${prefix}${d.name}`]))
    .sort((a, b) => (a === "SKILL.md" ? -1 : b === "SKILL.md" ? 1 : a.localeCompare(b)));
}

// First prose paragraph after the title, as plain text (Thai summary for the list).
function firstParagraph(body) {
  const para = body.split(/\n\s*\n/).find((p) => !/^\s*(#|```|\||[-*] |\d+\. )/.test(p));
  return para ? para.replace(/\*\*|__|`/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim() : "";
}

export function loadInstall(root = process.cwd()) {
  const prompt = fs.readFileSync(path.join(root, "install-prompt.md"), "utf8").trim();
  const commands = [...prompt.matchAll(/^\s*(claude plugin (?:marketplace add|install) \S+)\s*$/gm)].map((m) => m[1]);
  return { prompt, commands };
}
