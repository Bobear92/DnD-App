---
session_id: 05c19ffe-a208-44cb-8b78-2114ea1032e2
title: /ship-it rename and T2 security leaks
date: 2026-11-23
started: 23:26
branch: feature/t2-security-leaks
area: backend
tags: [tooling, docs, bugfix, security, deployment, campaign-tools, encyclopedia]
issues: []
summary: Renamed /ship to /ship-it (built-in clash); T2 slice 1: closed homebrew, email, hidden-location and era leaks
turns: 6
stepped_in: false
last_uuid: 1a72cded-412a-4f18-a9d2-a8ec2fd386e4
---

# /ship-it rename and T2 security leaks

<!-- Claude fills the sections below with /log. area is one of: character-system, campaign-tools, encyclopedia, backend, tooling -->

## Summary

- Confirmed the clash was still live: the session's skill list showed only the built-in "ship-local (ship)", no project `ship`.
- Renamed `.claude/commands/ship.md` → `ship-it.md`; updated `/ship` references in CLAUDE.md, `/release`, `/to-tickets`, `feature-branch-guard.mjs`, `.githooks/pre-commit`, deployment/learnings/schema-notes/tickets docs. Historical retros and session logs left as written.
- CLAUDE.md now says the command must not be named `/ship`, and why.
- Memories updated to `/ship-it`; the clash memory rewritten as "command is /ship-it, never rename back".
- Verified: `/ship-it` loaded the project command on first use. 3,956/3,956 frontend tests pass. Shipped as `f914e34`.
- **T2 slice 1 (post-deploy security, data leaks)** on `feature/t2-security-leaks`:
  - Compendium homebrew members-only across 12 modules: `require_campaign_query_member` attached once via
    `COMPENDIUM_ROUTERS` in `main.py`; `check_content_read` wraps each get-by-id.
  - No emails: user search matches/returns username only; `UserInfo` (member payload) drops email; both invite UIs
    stop showing it.
  - Locations: `_get_readable_location` gates maps/NPCs/relationships/links on visibility for players; pins also need
    a visible map; relationships drop hidden other sides.
  - Eras: `_resolve_absolute_year(db, campaign_id, …)` only accepts this campaign's eras (timeline, sessions, character
    timeline), even with no year.
  - `backend/tests/test_security_leaks.py` (57; 33 fail on the old code). Docs: api.md, backend-tests.md, ticket;
    agent + `/new-backend-module` now say compendium modules go in `COMPENDIUM_ROUTERS`.
  - Verified live: curl (search, `?campaign_id` 403) and Playwright on the Members page (no "@", username-only search).

## Where Claude struggled / where Robert stepped in

- The blanket `sed` over memory files also turned "built-in /ship shadows it" into "/ship-it" in MEMORY.md, and the pre-commit text into "/ship-it it to main". Both were caught and fixed in review. A word-boundary rename can't tell the old name in prose from a real reference, so read the diff after a codemod.
- Deleting the old clash memory was blocked by the auto-mode classifier; it was rewritten instead, which was the better move anyway.
- Robert didn't need to step in this session.
- T2: the generic row-builder in the new test guessed JSON column shapes wrong twice (list vs object defaults) — test
  data, not product code, but two extra runs. An older `test_search_response_shape` still asserted `email` and only
  surfaced in the 12-minute full run; grepping tests for the field being removed would have caught it up front.
- The Playwright check first clicked the campaign title (not "Enter Campaign"), so the page rendered as a non-GM and
  looked like a role regression; checking created_by vs user id via the API ruled that out.

## Decisions

- Renamed rather than looking for a setting to disable the built-in: a rename is robust whatever the extension version does.
- Picked `/ship-it`, the name proposed last session.
- Kept old retros and session logs saying `/ship`, since they are history.
- Robert: the free-DB expiry (~2026-12-18) is not a deadline — nothing needs to persist until January, then only
  worldbuilding. Ticket T5 + memory updated.
- Compendium list guard attached at include time (one place) instead of per route; detail check is a one-line wrapper
  per route, matching `check_content_ownership`. Non-member gets 403 (the repo's convention), not 404.
- T2 split into 3 slices: leaks (done), authorization rules, hardening.

## Open threads

- Robert's Windows PATH still has one empty entry (entry 39). It's harmless to the project and only the built-in `/ship` checks it. Cleaning it up is optional.
- T2 slice 2 needs Robert's call: should an added player have to accept (consent step), or is direct add fine?
  Also in slice 2: `is_admin` granting GM powers in `characters/service.py`; campaign classes writable by anyone.
- T2 slice 3: music upload Content-Type, login rate limit + password minimum, public `/docs`.
- Logged on the ticket (T6): the two duplicated invite UIs (`CampaignMembers.jsx` / `CampaignSettingsPage.jsx`) —
  extract before T3's username picker; location links shown to players can point at hidden NPCs.

## Turn log

<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->

### 1. 2026-11-23 23:26

**Robert:**
> Lets see if we can fix the ship issue we were having in the last session

**Claude:**
> I renamed your project ship command from `/ship` to `/ship-it`, so Claude Code's built-in `/ship` can't shadow it anymore. Typing `/ship` was still loading the built-in in this session too; your command didn't appear in the skill list at all. After the rename, `ship-it` showed up straight away as your project command ("Finish a session — verify tests exist, update docs, commit, and push to GitHub"). All 3,956 frontend tests pass.
> 
> **What changed** (on `feature/ship-command-rename`):
> - **The command:** [.claude/commands/ship.md](.claude/commands/ship.md) is now [ship-it.md](.claude/commands/ship-it.md). Its contents are unchanged except where it names itself.
> - **References updated** in [CLAUDE.md](CLAUDE.md), `/release`, `/to-tickets`, the feature-branch guard hook, [.githooks/pre-commit](.githooks/pre-commit), and the deployment, learnings, schema-notes and tickets docs. I left old retr …

**Files edited:** `../../../.claude/projects/c--Users-rober-Documents-Projects-dnd-app/memory/project_ship_command_clash.md` · **Commands run:** 9

### 2. 2026-11-23 23:40

**Robert:**
> /ship-it

**Claude:**
> This is shipped, and the fix is confirmed: typing `/ship-it` ran your project's ship workflow this time, not Claude Code's built-in.
> 
> - **Commit:** `main` is now at **f914e34** and pushed to GitHub. It contains the rename of `ship.md` to `ship-it.md`, the updated references and the session log.
> - **Cleanup:** the feature branch is deleted. It was never pushed, so there was nothing to delete on GitHub. The working tree is clean.
> - **Checks:** all 3,956 frontend tests passed. The backend check and the in-app check were skipped, because only docs and tooling changed.
> 
> One small hiccup on the way: my first `git add` pointed at the old `ship.md` path, so the first commit held only the file rename. Since it hadn't been pushed yet, I added the remaining files to that same commit before merging.
> 
> From now on, type `/ship-it` to ship. Plain `/ship` still runs Claude Code's built-in review-only co …

**Commands run:** 7

### 3. 2026-11-23 23:43

**Robert:**
> okay whats next for our post first deploy tickets?

**Claude:**
> T1, the CLAUDE.md cleanup, is done. I'd take **T2 (security follow-ups)** next, and keep one date in view.
> 
> **The deadline: T5's database upgrade, by about 2026-12-18.** The free Render database expires and has no backups, so losing it means losing production data. It takes a few minutes in Render's dashboard, but you have to click through it yourself. It's 25 days out, so it doesn't need to come first, but don't let it slip.
> 
> **T2 next.** The ticket marks these as "fix before inviting anyone beyond friends". I'd split it into three branches:
> 
> 1. **Data leaks.** These are the serious ones:
>    - Any user can read any campaign's homebrew.
>    - User search returns emails, and a 2-character query can collect every address.
>    - Every member's email is in the campaign response.
>    - The children of a hidden location (its maps, NPCs and links) can be listed by id.
>    - Timeline and session dat …

**Commands run:** 1

### 4. 2026-11-23 23:48

**Robert:**
> Dont worry about the deadline. I wont need for stuff to persist until January. And then it will just be the worldbuilding part of the site not the character creation. 
> 
> Lets work on T2 now.

**Claude:**
> The backend suite is still running; I'll restart the server once it finishes.

**Files edited:** `backend/tests/test_campaigns.py`, `backend/tests/test_security_leaks.py` · **Commands run:** 55

### 5. 2026-11-24 00:06

**Robert:**
> <task-notification>
> <task-id>buois0pox</task-id>
> <summary>Monitor event: "Wait for backend test run to finish"</summary>
> <event>[Monitor expired after 5m with no events delivered. Re-arm it if you still need the watch — and widen the filter if silence was unexpected.]</event>
> </task-notification>

**Claude:**
> The full backend suite is still running; it usually takes a few minutes. I'll get a notice when it finishes, then restart the backend and report the results.

### 6. 2026-11-24 00:11

**Robert:**
> <task-notification>
> <task-id>bmjux4v6e</task-id>
> <tool-use-id>toolu_01XXVcpTLGTxRJEsrpFKZydb</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\05c19ffe-a208-44cb-8b78-2114ea1032e2\tasks\bmjux4v6e.output</output-file>
> <status>completed</status>
> <summary>Background command "Run full backend test suite" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> Slice 1 of T2, the data leaks, is done and sitting uncommitted on `feature/t2-security-leaks`. All tests pass: 3,957 frontend and 1,139 backend. The new security tests also fail on the old code (33 of 57), so they really catch the bugs. The backend is restarted on the new code, and I checked it there.
> 
> **What's fixed:**
> - **Campaign homebrew:** only that campaign's members can read it, across all 12 compendium sections (races, backgrounds, feats, classes, monsters, spells and the six item types). A stranger who asks for another campaign's list, or for one of its entries by id, now gets "forbidden". The base compendium is still readable by everyone.
>   - On the running server, asking for a campaign I'm not in was refused, and the normal weapons list still loads.
> - **Emails:** user search now matches usernames only and returns just id and username. Member lists no longer include anyone's em …

**Files edited:** `backend/tests/test_campaigns.py` · **Commands run:** 7
