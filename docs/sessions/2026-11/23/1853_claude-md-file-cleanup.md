---
session_id: 860adc01-2cea-4920-8e2a-a71a61f8a9be
title: CLAUDE.md trim to 53 KB
date: 2026-11-23
started: 18:53
branch: feature/claude-md-trim
area: tooling
tags: [docs, tooling, claude-md, consolidation]
issues: [rework]
summary: Post-deploy T1 — CLAUDE.md 99.7→53 KB: schema/api/backlog docs split out, budget cap 100→60 KB, stale refs fixed
turns: 12
stepped_in: true
last_uuid: ec3b1141-c874-4ae1-87df-45766db805eb
---

# CLAUDE.md trim to 53 KB

<!-- Claude fills the sections below with /log. area is one of: character-system, campaign-tools, encyclopedia, backend, tooling -->

## Summary

- Post-deploy ticket T1. Measured CLAUDE.md by section: schema (20 KB), endpoint tables (17 KB) and routes table (4 KB) were the bulk; to-dos were only ~7 KB.
- Moved the column listing to new `docs/schema.md`, endpoints to new `docs/api.md`, to-dos to new `docs/backlog.md` (deduped against the post-deploy ticket); dropped the routes table (`docs/frontend-map.md` already held all 33 routes). CLAUDE.md keeps code-shaping schema constraints, an "API conventions" block, and Docs-index rows for the three new files.
- Compacted the backend tree; fixed stale `require_gm` (real: `require_campaign_gm` + per-service `_require_gm`); table count 41 → 44; deduped the round-trip module list.
- Budget test cap 100 KB → 60 KB; failure message names each content's home. Repointed `/ship`, `/migrate`, `/new-backend-module`, `/mechanics-page`, `/subclass-features`, `/class-config`, `/feat-effects`, `/retro`, three agents, the Stop-hook prompt, all 12 `docs/systems/*` headers, the memory note.
- Full frontend suite green (3956).

## Where Claude struggled / where Robert stepped in

- **rework:** two built-in review passes found stale references the first sweep missed (frontend-page-expert planning line, `/feat-effects`, security-reviewer `require_gm`, frontend-map header/route note, schema-notes pointer, budget-test message, tickets README, table count). The first sweep grepped only for section names ("Not Yet Built", "Working API Endpoints"); grepping for every concept moved (routes table, column listing, `require_gm`, "100 KB") up front would have caught them in one pass.
- First cut script crashed after writing CLAUDE.md (Python on Windows rejected a `/c/...` path) — recovered via `git show HEAD:CLAUDE.md`. Use `C:/...` paths for Python in Git Bash.
- **Robert stepped in:** typing `/ship` loaded Claude Code's new built-in review-only `/ship` instead of `.claude/commands/ship.md` — twice. Claude relayed its canned "PATH has an empty entry" message as if it were the blocker; Robert asked what that meant and why shipping suddenly broke. Should have recognised immediately that the built-in had shadowed the project command and said so. Robert then said "commit and merge" and the project steps were run by hand.

## Decisions

- Reference listings (columns, endpoints, routes, to-dos) leave CLAUDE.md; only rules and code-shaping constraints stay — they are derivable from code and needed only when working in that area.
- `docs/schema.md` = current columns; `docs/schema-notes.md` stays the rationale doc.
- Budget cap 60 KB (not left at 100) so the file cannot creep back.

## Open threads

- **`/ship` name clash:** Claude Code's built-in `/ship` (review → PR) now shadows `.claude/commands/ship.md`. Proposed fix: rename the project command (e.g. `/ship-it`) and update references (CLAUDE.md workflow, `/log`, skills that mention `/ship`). Not done — awaiting Robert.
- Robert's Windows PATH has one empty entry (entry 39) — harmless, but the built-in `/ship` refuses to push because of it.
- `docs/schema.md` / `docs/api.md` drift is not test-guarded; only the docs-audit step and `/ship` Step 4 enforce it.

## Turn log

<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->

### 1. 2026-11-23 18:53

**Robert:**
> Lets look at our post deploy tickert. 
> 
> T1 is cleaning up the claude md files. How should we do this. Should we externalize all todos? Whats clogging up the file?

**Claude:**
> Claude stopped here because Fable 5.2 now requires usage credits. Switch models, or send a message to choose again.

### 2. 2026-11-23 18:53

**Robert:**
> /model claude-fable-5-1

**Claude:**
> _(no text reply)_

### 3. 2026-11-23 18:53

**Robert:**
> /model opus

**Claude:**
> _(no text reply)_

### 4. 2026-11-23 18:53

**Robert:**
> Continue

**Claude:**
> T1 is mostly about moving reference material out, not to-dos. The to-dos are only about 7 KB of the 99.7 KB.
> 
> ## What's taking up the space
> 
> | Section | Size | What it is |
> |---|---|---|
> | Database schema (41 tables) | **20.0 KB** | Every column of every table |
> | API endpoint tables | **17.4 KB** | Every route, method and auth rule |
> | Frontend — Current State | **16.5 KB** | Routes table (4.1), character sheet rules (5.2), Frontend Not Yet Built (5.4), context pattern |
> | Post-Turn Requirements + tripwires + docs index | 9.5 KB | Rules. Keep. |
> | Testing (backend + frontend) | 10.9 KB | Mostly rules. Keep, with small trims. |
> | Backend structure tree | 3.5 KB | Directory listing |
> | What's NOT Built Yet (backend) | 1.8 KB | To-dos |
> | Everything else | ~20 KB | Rules and short reference |
> 
> The schema, endpoints and routes table take up about 41 KB between them. Each one copies somethin …

**Commands run:** 2

### 5. 2026-11-23 18:55

**Robert:**
> No that sounds good. Go ahead.

**Claude:**
> T1 is done. CLAUDE.md went from **99.7 KB to 52.7 KB**, and all 3,956 frontend tests pass. Everything is on `feature/claude-md-trim` and not committed. Run `/ship` when you're happy with it.
> 
> **What moved out:**
> - **Database columns → [docs/schema.md](docs/schema.md).** CLAUDE.md keeps a list of tables by area, plus the constraints that change how code gets written: the `character_data` merge, snapshots that need data migrations, the XP clamp, reading `campaign_mode` through one file, and the missing `UNIQUE(name)`. The "why" for each column is still in `docs/schema-notes.md`.
> - **Endpoint tables → [docs/api.md](docs/api.md).** CLAUDE.md keeps the route prefixes and a short API conventions block: what's stripped for players, how character PUT works, campaign rows overriding system rows, edition filters, rests, GM-only encounters, and the rule that list schemas silently drop fields.
> - **R …

**Files edited:** `docs/backlog.md`, `docs/tickets/post-deploy-followups.md`, `CLAUDE.md`, `.claude/agents/backend-module-expert.md`, `frontend/src/test/claudeMdBudget.test.js` · **Commands run:** 14

### 6. 2026-11-23 19:10

**Robert:**
> /ship

**Claude:**
> The review found 8 problems, all minor documentation leftovers from the trim. I fixed the 4 in `docs/`. The other 4 are in `CLAUDE.md` and `.claude/`, which /ship isn't allowed to edit, so they're listed below for you to make or ask me for. The budget test passes after the fixes; I didn't commit or push anything.
> 
> **Fixed:**
> - [docs/frontend-map.md:3](docs/frontend-map.md#L3): the header, line 531 and the "Routes — full notes" note still said CLAUDE.md held the routes table and "Frontend Not Yet Built". All three now point at this file's own routes table and at `docs/backlog.md`.
> - [docs/tickets/post-deploy-followups.md:6](docs/tickets/post-deploy-followups.md#L6): the status line still said "0 done, ~99.9 KB of a 100 KB cap". It now says T1 is done and gives the new size and 60 KB cap.
> - [CLAUDE.md:182](CLAUDE.md#L182): the shortened backend tree had dropped the upload folder layout (ma …

**Commands run:** 4

### 7. 2026-11-23 20:25

**Robert:**
> fix them

**Claude:**
> I fixed all five, and the CLAUDE.md budget test still passes:
> 
> - **[.claude/commands/ship.md](.claude/commands/ship.md):** I removed the old "new tables as compact column listings" bullet. Step 4 now has two lists. "In CLAUDE.md" covers the table count, a new rule, an API prefix or convention, and a sheet rule. "Reference docs" covers `schema.md`, `api.md`, the Routes section of frontend-map, and `backlog.md`.
> - **[.claude/agents/frontend-page-expert.md](.claude/agents/frontend-page-expert.md):** the planning checklist now sends route rows to frontend-map › Routes and to-dos to `docs/backlog.md`.
> - **[.claude/commands/feat-effects.md](.claude/commands/feat-effects.md):** a new effect kind now updates the `feats` entry in `docs/schema.md`.
> - **[.claude/agents/security-reviewer.md](.claude/agents/security-reviewer.md):** `require_gm(campaign_id)` is now `require_campaign_gm`. The only rema …

**Commands run:** 3

### 8. 2026-11-23 20:35

**Robert:**
> okay lets /ship

**Claude:**
> Nothing started. /ship starts only from a line that you type, not from claude -p or a program.

### 9. 2026-11-23 20:37

**Robert:**
> /ship

**Claude:**
> The review found 7 problems. I fixed the 4 that are in `docs/` and the frontend test. The other 3 are in `CLAUDE.md` or `.claude/`, which this /ship isn't allowed to edit, and the memory note is outside the repo. The budget test passes (26/26). Nothing is committed or pushed.
> 
> **Fixed:**
> - [docs/schema.md:1](docs/schema.md#L1): the doc said 41 tables, but the models define 44, so the heading now says 44. The same wrong count is in the CLAUDE.md "Database Schema" heading, which I couldn't change here.
> - [docs/schema-notes.md:3](docs/schema-notes.md#L3): it still told readers to update a column listing in CLAUDE.md. It now points at `schema.md`. While there I also fixed [docs/api.md:3](docs/api.md#L3), which named a section heading that doesn't exist, and [docs/backlog.md:29](docs/backlog.md#L29), which said "see below" with nothing below it.
> - [frontend/src/test/claudeMdBudget.test.js:45] …

**Commands run:** 4

### 10. 2026-11-23 23:13

**Robert:**
> fix the four problems

**Claude:**
> I fixed all four, and the CLAUDE.md budget test still passes:
> 
> 1. **Table count:** the [CLAUDE.md](CLAUDE.md) "Database Schema" heading now says 44 tables, matching the models and `docs/schema.md`.
> 2. **GM checks:**
>    - **CLAUDE.md** › GM Authorization now says GM checks work two ways. Campaign routes use the `require_campaign_gm` dependency. The calendar, encounters, locations, npcs, session_notes and timeline modules call their own `_require_gm` in `service.py`. Either is correct, as long as it isn't `require_admin`.
>    - **[security-reviewer.md](.claude/agents/security-reviewer.md)** now accepts either check. It also says outright that a route without the dependency is fine when its service calls `_require_gm`, so the agent won't report those as missing.
> 3. **Backend skills:**
>    - **[/new-backend-module](.claude/commands/new-backend-module.md)** has a new step 6. It updates `docs/sc …

**Files edited:** `../../../.claude/projects/c--Users-rober-Documents-Projects-dnd-app/memory/feedback_claude_md_after_tests.md`, `../../../.claude/projects/c--Users-rober-Documents-Projects-dnd-app/memory/MEMORY.md` · **Commands run:** 4

### 11. 2026-11-23 23:19

**Robert:**
> what are you talking about path fix?

**Claude:**
> That message came from Claude Code's built-in `/ship`, not from your project. Two things are going on.
> 
> **1. The PATH warning.** Your Windows `PATH` contains one empty entry: entry 39 is blank, probably from a trailing or doubled `;`. An empty entry makes Windows also search the current folder for programs. Claude Code's `/ship` refuses to push when that's true, because it can't be sure which `git`/`gh` would actually run. Your real ones are fine: `C:\Program Files\Git\cmd\git.exe` and `C:\Program Files\GitHub CLI\gh.exe`. To clear the warning:
> - Open the Start menu, search "Edit environment variables for your account", and select **Path**. Delete the blank line, or remove a stray `;` if you edit it as text.
> - Check the System **Path** too, under "Edit the system environment variables", since the blank can be in either one.
> - Restart VS Code so the new PATH takes effect.
> 
> **2. The bigger …

**Commands run:** 1

### 12. 2026-11-23 23:20

**Robert:**
> why is this happening now we have shipped dozens of times. A few times earlier today its just this session you are having issues

**Claude:**
> Your project's `/ship` is still where it was, at `.claude/commands/ship.md`, and nothing in this branch touched how it's loaded. My best guess: the Claude Code extension updated, and the new version ships its own built-in `/ship` (its skill list shows it as "ship-local (ship)"). In this session, typing `/ship` loaded that built-in instead of your command. Earlier sessions today probably started on the older version, before the built-in existed, so your command ran as usual. I can't confirm the update from here: the `claude` CLI isn't on this shell's PATH, so I can't check the version.
> 
> So the PATH warning wasn't the real problem. It's a check inside the built-in command, and your project's ship never looked at PATH, which is why you'd never seen it.
> 
> What I'd do:
> 1. **Ship this branch now:** say "commit and merge" and I'll run your `ship.md` steps by hand. That's commit on `feature/claud …

**Commands run:** 1
