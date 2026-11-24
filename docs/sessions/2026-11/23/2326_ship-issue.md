---
session_id: 05c19ffe-a208-44cb-8b78-2114ea1032e2
title: Rename /ship to /ship-it
date: 2026-11-23
started: 23:26
branch: feature/ship-command-rename
area: tooling
tags: [tooling, docs, bugfix]
issues: []
summary: Renamed the project ship command to /ship-it so Claude Code's built-in /ship stops shadowing it
turns: 1
stepped_in: false
last_uuid: 29cfe00d-6870-4fd2-be20-4d44256107fa
---

# Rename /ship to /ship-it

<!-- Claude fills the sections below with /log. area is one of: character-system, campaign-tools, encyclopedia, backend, tooling -->

## Summary

- Confirmed the clash was still live: the session's skill list showed only the built-in "ship-local (ship)", no project `ship`.
- Renamed `.claude/commands/ship.md` → `ship-it.md`; updated `/ship` references in CLAUDE.md, `/release`, `/to-tickets`, `feature-branch-guard.mjs`, `.githooks/pre-commit`, deployment/learnings/schema-notes/tickets docs. Historical retros and session logs left as written.
- CLAUDE.md now says the command must not be named `/ship`, and why.
- Memories updated to `/ship-it`; the clash memory rewritten as "command is /ship-it, never rename back".
- Verified: `/ship-it` loaded the project command on first use. 3,956/3,956 frontend tests pass.

## Where Claude struggled / where Robert stepped in

- The blanket `sed` over memory files also turned "built-in /ship shadows it" into "/ship-it" in MEMORY.md, and the pre-commit text into "/ship-it it to main". Both were caught and fixed in review. A word-boundary rename can't tell the old name in prose from a real reference, so read the diff after a codemod.
- Deleting the old clash memory was blocked by the auto-mode classifier; it was rewritten instead, which was the better move anyway.
- Robert didn't need to step in this session.

## Decisions

- Renamed rather than looking for a setting to disable the built-in: a rename is robust whatever the extension version does.
- Picked `/ship-it`, the name proposed last session.
- Kept old retros and session logs saying `/ship`, since they are history.

## Open threads

- Robert's Windows PATH still has one empty entry (entry 39). It's harmless to the project and only the built-in `/ship` checks it. Cleaning it up is optional.

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
