# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) with static export (`output: "export"`), deployed as Cloudflare Workers static assets (`wrangler.jsonc`, project `mrn-skills`). Pages are generated at build time from `plugins/mrn/skills/*/SKILL.md`; no server runtime.

## Users

People at the company who use Claude Code: developers, and non-developers (PM, designers, other teams) who are newer to it. They visit once to install (mostly desktop, sometimes phone), then come back to see what new skills exist and how to use one.

## Product Purpose

A catalog of the company's own Claude Code skills, modeled on skills.sh. Its one job: let someone install every skill with a single prompt pasted into Claude Code, after which new skills and updates arrive automatically. Success = a person copies the prompt, pastes it, and can run `/mrn:<skill>` without asking anyone for help.

## Positioning

Unlike public skill directories, everything here is curated by one owner for this company, installed as one plugin (`mrn@mrn-skills`) through Claude Code's native plugin marketplace, and kept current by auto-update. Installing is "paste this prompt", not a terminal recipe.

## Operating Context

- Skills live in the public GitHub repo `mernorthzide/mrn-skills` at `plugins/mrn/skills/<name>/SKILL.md`; the owner keeps adding skills.
- The install prompt is `install-prompt.md` (Thai) and `install-prompt.en.md` (English) at the repo root; each language of the site must show its exact text.
- Users invoke a skill as `/mrn:<name>`; after install they run `/reload-plugins` or open a new session.
- Skill content is written in Thai with English technical terms.

## Capabilities and Constraints

- Site is generated from the skill folders, never hand-listed; a SKILL.md without `name`/`description`, or with `name` ≠ folder, must fail the build.
- No install counts, ratings, or usage stats exist; do not show any.
- UI languages: English by default at `/`, Thai at `/th/` (strings in `lib/i18n.mjs`). Thai is written the way Thai products write it; technical terms stay English. Skill bodies stay Thai in both; English pages show the English frontmatter description as the summary.

## Brand Commitments

Name: "MRN Skills". No logo or brand colors exist.

## Evidence on Hand

Only the skills themselves (first: `prove-it`). No testimonials, customers, or metrics; never fabricate them.

## Product Principles

1. Copying the install prompt is the primary action on every page.
2. Explain in plain Thai so a non-developer can install without help; keep terminal commands as a secondary path.
3. The skill content is the product: show it faithfully, readable, and complete.
4. Nothing invented: no stats, no marketing filler.

## Accessibility & Inclusion

WCAG AA contrast, visible keyboard focus, touch targets ≥ 44px, works on mobile, Thai line-height and wrapping checked.
