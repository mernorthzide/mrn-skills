---
source: 2a8d60079c8e
argument-hint: "<the task, or a path to a plan> [builder=claude|codex] [mode=full|review] [rounds=3]"
---

# Loop

The work is done when Codex approves the final plan (its hash matches the real file), the code passes the proof commands in the plan, and a fresh session of the model that did not write the code inspects the final diff with no high findings left open. If a round cap is hit first, report what is still open, plainly.

The core idea: **whoever writes it does not review it**. Claude in this session coordinates (talks to the user, writes the plan, rules on findings), Codex reviews the plan, and the model that did not build inspects the code.

| Role | Who |
|---|---|
| Requirements, plan, ruling on findings | Claude (this session) |
| Plan review | Codex, read-only, same session every round |
| Builder | Claude (default) or Codex with `builder=codex` |
| Code inspection | The opposite of the builder, a fresh session every time |

## Rules for the whole run

- **Calling Codex**: through `codex:codex-rescue`, following `~/.claude/agent-skills/codex.md` (read it before the first call). Use `--model gpt-6.1-sol --effort high`, and `xhigh` when the work touches security, money/accounts, data/migration or concurrency/cache. Run in the background and wait for the task-notification
  - Review and inspection: no `--write` (read-only). The prompt says not to edit files and not to run the full test suite
  - The same reviewer's next round: add `--resume`. Code inspection always uses `--fresh`. Do not call Codex for anything else in this repo between review rounds, because `--resume` continues the latest task
- **Claude as inspector**: send a new Agent (`general-purpose`) with no context of this run, given only the plan, the base commit and an instruction to read only
- **Every reviewer returns** (put this in the prompt): `verdict` = APPROVED / REVISE / BLOCKED, `findings` (id, severity high/medium/low, path:line, evidence, fix), `coverage` (files and requirements actually read), `limitations`. APPROVED with an open high or medium finding does not count as approval. Empty output, an error or a timeout does not count as approval
- **Rule on findings yourself**: check every finding against the real code before acting. Fix the real ones; reject the rest with evidence, and send the reasons to the reviewer in the next round. Do not reopen a settled finding without new evidence
- **Log**: `LOOP-LOG.md` next to `PLAN.md`, append-only. Each round records: round, reviewer and model, verdict, plan hash, findings with rulings (fixed / rejected because...). Never commit `LOOP-LOG.md` or raw CLI output (add them to `.git/info/exclude`)
- **Authorization**: asked only to plan = go up to step 3, then stop and ask. Asked to do the whole job = build without asking again. Commit, push and deploy only when the user says so
- **Testing**: by the work level in CLAUDE.md. UI work is tested in ego-browser on desktop and mobile. Large or risky work uses `mrn:prove-it` as the proof command. The code inspection in step 5 counts as this work's Codex review; do not review again

| Cap | Default |
|---|---|
| Plan review rounds (`rounds`) | 3 |
| Fix rounds after a build whose proof fails | 2 |
| Code inspection rounds | 2 (first round + a round checking the fixes, per codex.md) |

Before starting, show the roles, the plan path, the round caps and the models in one table.

## 1. Recon

- Existing project: read the relevant code, callers and writers of shared state (use graphify if `graphify-out/graph.json` exists), and `CONTEXT.md` and `docs/adr/` if present
- New work: look up prior art, a suitable stack and common failure points with WebSearch (`mode: "standard"`). Use `mrn:deep-research` only when the user asks
- With `builder=codex`, check that Codex has the tools the work needs (this session's MCP, browser and credentials do not carry over)

Show an **assumptions table**: assumption / source (path or URL) / what is lost if it is wrong

## 2. Settle requirements and write the plan

Ask one round (AskUserQuestion, at most 4 questions, recommended option first), only about what changes what gets built and what the code cannot answer. Choose reversible matters yourself and mark them `(สมมติ)` (assumed). If domain terms are ambiguous or a hard-to-reverse decision comes up, use `mattpocock-skills:domain-modeling` to record it in `CONTEXT.md` or an ADR.

Write `PLAN.md`:
- **Goal** and observable acceptance criteria
- **Approach**: key decisions, trade-offs, non-goals, files to touch
- **Assumptions** with sources, and remaining risks
- **Proof**: runnable commands with expected results, and what to check by eye (which page, which screen)

`mode=review`: load the plan the user gave, fill only the missing parts, then go straight to step 3.

Done when: every acceptance criterion has a proof command or check tied to it.

## 3. Codex reviews the plan

1. Log `shasum -a 256 PLAN.md`
2. Send Codex (read-only) the plan body. It may read the relevant code; it looks for what would break or is missing from the plan, with evidence from real files, and returns the format in the rules
3. By verdict:
   - **APPROVED**: check the hash still matches the file. A plan edited after approval needs another review
   - **REVISE**: rule on each finding, revise the plan, log the rulings, then send the next round with `--resume` and the rulings
   - **BLOCKED or the call failed**: tell the user what is blocking. Do not retry the same way, and do not silently switch to another reviewer
4. Cap reached without APPROVED: show the open findings with Claude's position and let the user decide whether to keep revising or move on. If moving on, log "proceeding without plan approval" and never call it approved

Done when: APPROVED with a hash matching the current `PLAN.md`, or the user chose to move on and that is logged.

## 4. Build

1. Record the base commit (`git rev-parse HEAD`). If the folder holds unrelated work in progress, build in a separate worktree (`EnterWorktree` or `git worktree add`). Never stash someone else's work
2. The builder by role:
   - **Claude**: follow the plan with the normal tools. Work that splits into independent modules uses `mrn:swarm`
   - **Codex**: send `codex:codex-rescue` with `--write` in a clean worktree, with the approved plan, the acceptance criteria and the proof commands. Fix rounds use `--resume` with the list of fixes
3. Claude runs the proof commands itself (never trusting the builder's report) and reads every file changed since the base, including new and deleted files. Changed tests must still measure the acceptance criteria, not be bent to match what the code does. If proof fails, fix within the cap; if it still fails, stop and report

Done when: every proof command passes in Claude's own run.

## 5. Cross inspection

1. Send the inspector opposite the builder, in a fresh session, with the plan, the base commit, `git diff <base>` and the list of new untracked files. Tell it to open every new file
2. Rule on findings and fix them, rerun the relevant proof commands, then inspect round 2 in another fresh session
3. **Whoever edits, the other side inspects**: if Claude edits code Codex built, Codex inspects that part. If both sides wrote code, log who wrote which files and have each side inspect the other's part. An inspection covers only the code as it was when inspected; later edits count as uninspected
4. Round 2 still has a verified high or critical finding: stop and report that the part needs redesign. Medium and below: fix and finish

## 6. Report

The first sentence gives the status (plan approved? proof passed? inspection passed?), then:

| Step | Doer / reviewer | Rounds | Result | Evidence |
|---|---|---|---|---|

- What the plan changed because of review (the 2-3 most valuable findings)
- Diff summary by file, proof results, open findings, uninspected parts, and deviations from the plan
- Paths to `PLAN.md` and `LOOP-LOG.md`
- Without commit authorization, leave the diff ready for the user, and offer `mrn:ship` or `mrn:finish-worktree`
