---
source: 2b1411b1f5c7
argument-hint: "<what to improve (URL, path, file)> [max rounds] [goal]"
---

# Make it better

The work is done when a stop condition in step 3 is reached, every round that was kept beat the round before it in the eyes of a judge who did not know which version was new, and the main flows still all work.

Repeating "make it better" with no direction turns the work into **adding things**: in a 100-round experiment, Opus grew a coffee shop site to 21,000 lines, broke its own features, and never once searched the web for references. This skill fixes that with a vision before any change, references from real work, one change per round, keeping only what wins, and stopping once things stop getting better.

## Rules for the whole run

- **Where the work lives**: the target must be in git. If it is not, `git init` it and commit it as it stands. Create the branch `make-it-better/<name>-<YYYYMMDD>`. The run's documents live in `.make-it-better/` at the root (added to `.git/info/exclude`): `VISION.md`, `rounds.md`, `shots/`
- **One change per round**, explainable in one sentence. Each kept round is one commit `round N: <that sentence>`
- **No forced change**: if no proposal is expected to win, write "no proposal worth making" and count the round as not passed
- **Size is a cost**: record the line count of the code (or the word count of a document) every round. If the judge calls a tie, keep the smaller version. Every 5th round (5, 10, 15, ...) is a **cut round**: only proposals that remove, merge or simplify may be chosen
- **The main flows must pass every round**: a round that breaks a main flow loses, however much better it looks
- **UI work**: read `~/.claude/agent-skills/ux-ui.md` before starting. Test in ego-browser on both desktop and mobile. If the shadcn MCP is available, search the registry before writing a component yourself
- **Budget**: the default maximum is 10 rounds, at roughly USD 2-6 per round. If max rounds times cost per round exceeds roughly USD 30, ask first
- Do not push or deploy until the user says so

## 1. Vision and scorecard

1. Look at the real thing first: open the target (for a site, take full-page screenshots on desktop and mobile in ego-browser, saved as `shots/round-0-*`) and note what it has
2. Write `VISION.md`:
   - **Users**: who they are and what they come to do (1-3 main tasks)
   - **Feel**: 3 words users should feel
   - **Out of scope**: what must not be added or touched
   - **Main flows**: the flows that must not break, with a command or ego-browser script that checks them
   - **Scorecard**: 4-6 criteria scored 1-5, each with an example of what a 1, a 3 and a 5 look like. Always include a **focus** criterion (users finish their main task fast with nothing extra in the way). For a site, add measurable checks: zero console errors, and Lighthouse performance and accessibility
   - **Target**: by default, every criterion at 4 or above
3. Ask the user one round of questions (AskUserQuestion, at most 4, recommended option first), only about what the argument and the target cannot answer, such as target users, style, parts not to touch, number of rounds. Mark anything you chose yourself `(สมมติ)` (assumed)

Done when: every scorecard criterion has examples at all three levels, and the main-flow check passes on the original.

## 2. References and backlog

1. Send read-only subagents in parallel, one per angle, each given `VISION.md` and using WebSearch (`mode: "standard"`):
   - **The best examples of the same kind**: the strongest competitors and award winners (for sites: Awwwards, Godly, Land-book)
   - **Proven patterns**: UX research, conversion guides or guidelines for this kind of work
   - **Ready-made parts**: components or templates that fit (shadcn registry, 21st.dev)

   Each returns 3-5 proposals: things a reference does well that the target lacks or does worse, with source URLs
2. Check the best 2-3 references yourself in ego-browser and save screenshots
3. Write the **backlog** in `VISION.md`: proposal / source / criterion likely to improve / rough size. Include proposals that remove or simplify
4. Have the judge (see step 3, item 4) score the original against the scorecard and record it as round 0 in `rounds.md`

Done when: the backlog has at least 8 items, each with a source, and round 0 has scores.

## 3. Rounds

Repeat until a stop condition is reached:

1. **Choose**: take 3 items from the backlog plus any new proposals from what the last round showed, score each on expected score gain per unit of size added, and pick one. In a cut round, only removing or simplifying items qualify. If nothing is worth it, skip to item 6
2. **Make**: change only what was chosen
3. **Check**: run the main-flow check and the related tests and typecheck, look at console and network errors, look at mobile. If something breaks, you get 1 attempt to fix it; if it is still broken, revert
4. **Judge**: send a fresh subagent with no context of this run, given only the scorecard from `VISION.md` and the two versions labelled X and Y (for a site, full-page screenshots on desktop and mobile). Alternate whether the new version is X or Y from round to round. It scores both versions on every criterion, then picks X, Y or a tie, with reasons
5. **Decide**: keep when the judge picks the new version, no criterion drops by more than 1, and no measurable check gets worse. On a tie, keep the smaller version. Commit a kept version; otherwise go back to the last kept commit, and note the reason next to that item in the backlog so it is not proposed again
6. **Record**: add a row to `rounds.md`:

   | Round | Change | Result (kept / reverted / no proposal) | Total score | Size | Judge's reason |
   |---|---|---|---|---|---|

**Stop when**: 3 rounds in a row are not kept, every criterion reaches the target, or the maximum number of rounds is reached.

## 4. Final check and report

1. Send 2 new judges to compare the original with the final version, names hidden. If neither picks the final version, report that plainly
2. Run the main flows, tests and typecheck in full once
3. Report in chat:
   - round 0 against the final round on every criterion, size before and after, and the 2 judges' results
   - the table from `rounds.md`
   - before and after screenshots side by side (sent with SendUserFile)
   - why the run stopped, and the backlog items not yet tried
   - the branch name, offering `mrn:ship` to take it live
