---
session_id: 7478825a-3da6-4e38-a3ea-4dbe238539cb
title: World-building-only campaign mode
date: 2026-11-15
started: 12:57
branch: feature/world-building-only-toggle
area: campaign-tools
tags: [build, campaign-mode, campaign-settings, campaign-tools, encounters, encyclopedia, character-list, migration, claude-md]
issues: []
summary: GM toggle hides character sheets, encounters, encyclopedia, rules settings and NPC stats; Settings moved to nav top
turns: 5
stepped_in: true
last_uuid: 31b9d909-74f0-4274-a3a2-ad2b541a6bb4
---

# World-building-only campaign mode

<!-- Claude fills the sections below with /log. area is one of: character-system, campaign-tools, encyclopedia, backend, tooling -->

## Summary

- New `campaigns.campaign_mode` column (`full` | `worldbuilding`, Literal-validated; migration `b7c8d9e0f1a2`), accepted on POST and PUT.
- `campaigns/campaignFeatures.js` is the single reader of the mode; `FeatureRoute` redirects disabled routes to the dashboard (wraps 20 character/encounter/encyclopedia routes).
- World-building hides: Characters/My Characters, Encounters, Encyclopedia (nav + routes), rules settings in Campaign Settings, NPC Combat Stats, session "Characters Present" (and its fetch). Hide-only — data kept.
- `MainLayout` now re-fetches the campaign on mount so a player's stored copy picks up a GM's mode switch.
- Campaign Settings moved to the top of the GM sidebar (Robert's request from QA).
- Verified live: API toggle + 422 on a bad value; Playwright on Yaara shows trimmed nav, redirects, hidden rules sections.

## Where Claude struggled / where Robert stepped in

- A parallel session shared the working tree and moved the uncommitted work to `feature/world-building-only-toggle` mid-session; also edited CLAUDE.md and docs alongside. Claude noticed foreign file changes but kept to its own files.
- `npm test` failed wholesale ("Vitest failed to find the runner") — first blamed on a concurrent vitest run, then traced to the lower-case `c:\` working directory; running from `C:\` passed. Cost two full-suite runs.
- First model edit silently missed (anchor whitespace), then a cp1252 em dash broke the file encoding — Python `open()` without `encoding=` on Windows. Use `encoding='utf-8'` always.
- Playwright verify first clicked the wrong campaign's Enter button (`.last()` over a list-wide container) and reported "full mode" — a false reading caught by checking which campaign was entered.
- Robert stepped in on design: world items should be kept (narrative visible, stat block hidden) — a new module, deferred; asked for Campaign Settings at the top of the nav.

## Decisions

- One `campaign_mode` column, not a boolean per feature — finer toggles later only change `campaignFeatures.js`.
- Hide-only (Robert): no backend blocking of characters/encounters in world-building campaigns.
- GM can switch modes any time (Robert); switching never clears the hidden settings.
- Settings preview follows the GM's DRAFT mode, so picking world-building trims the page before saving.
- Edition moved out of "Campaign Identity" into a "Rules" section so it hides with the other rules settings.

## Open threads

- **World items** (Robert wants it): lore list of notable items — description, picture, linked NPCs — visible in world-building mode while the stat block hides. New module; undecided whether it is its own sidebar page and whether it also links to locations/timeline. Logged in CLAUDE.md "Not Yet Built".
- Create-campaign modal does not offer `campaign_mode` yet (API accepts it; Settings can switch it).
- `FeatureRoute` reads the SELECTED campaign from context, not the URL's `campaignId` — app-wide pattern, but a deep link into another campaign is judged by the stored one.
- Stale empty branch `feature/worldbuilding-mode` (no commits) — delete when convenient.

## Turn log

<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->

### 1. 2026-11-15 12:57

**Robert:**
> I want to add a feature another toggle. 
> 
> If the GM only wants the world building functionality. So they dont need player character sheets, enounters, or the encyclopedia on the d&d rules. 
> 
> Any other features that should be toggled off if they only want the world building functionality?

**Claude:**
> Here's what else is tied to the rules engine and should go dark in a world-building-only campaign. I read the sidebar ([Sidebar.jsx:14-35](frontend/src/shared/components/layout/Sidebar.jsx#L14-L35)) and the schema to check.
> 
> ## Turn off along with the three you named
> 
> | Feature | Why it goes |
> |---|---|
> | **Rules settings in Campaign Settings**: edition, alignment, ability-score method, reroll 1s, leveling type, currency type, starting equipment, ASI/feat mode | Every one of these only affects character sheets. Without sheets they're settings that do nothing. |
> | **Rest and initiative endpoints** (`/rest`, `/initiative-options`) | They only act on characters and encounters. |
> | **"Characters present" on Session Notes** (`session_note_characters`) | Characters are the party's sheets, so there's nothing to link. Hide that section on the session page. |
> | **NPC combat `stats` block** | A st …

### 2. 2026-11-15 13:02

**Robert:**
> 1: Lets have it but the toggle turns off the stat block of it not the narrative stuff like description, picture, linking it to an npc, ect. 
> 2: Yes they should be able to toggle it on and off anytime they want 
> 3: I think hide only is fine. When toggled off the GM and users wont have access to those features until its toggled back on.

**Claude:**
> You've hit your 5-hour limit · resets 5:10pm (America/New_York)

**Commands run:** 12

### 3. 2026-11-15 17:19

**Robert:**
> continue

**Claude:**
> World-building mode is built on the `feature/worldbuilding-mode` branch and not committed. The backend campaign tests pass (42), and all 3,912 frontend tests pass across 170 files. I haven't clicked through it in the running app yet.
> 
> **What the GM gets:** Campaign Settings has a new **Campaign Mode** section ("Full D&D campaign" / "World-building only"), and it can be switched at any time. Switching only hides things: no data is deleted, and switching back brings everything back with its old values.
> 
> **What world-building mode hides, for the GM and players:**
> - **Characters / My Characters, Encounters and Encyclopedia** disappear from the sidebar. Typing their web address directly sends you to the dashboard.
> - **The rules settings** (edition, alignment, ability scores, leveling, currency, starting equipment and ability score improvements) disappear from Settings.
> - **"Characters Present …

**Commands run:** 37

### 4. 2026-11-15 17:39

**Robert:**
> <pasted_content id="1d6f">
> Heads-up from a parallel session that shares this working tree (2026-11-15):
> 
> 1. Your uncommitted work is now on branch `feature/world-building-only-toggle`, not `main`.
>    I branched it from the new `main` (63bd96a) so you can commit and /ship normally.
>    Run `git branch --show-current` to confirm.
> 
> 2. None of your files were committed, staged or edited. Everything you had in progress is
>    still uncommitted: backend/gm/campaigns/{models,schemas,service}.py,
>    backend/tests/test_campaigns.py, the new migration b7c8d9e0f1a2_add_campaign_mode_to_campaigns.py,
>    the …

**Claude:**
> Confirmed: I'm on `feature/world-building-only-toggle`, which starts from `63bd96a`, and all of my world-building work is still there uncommitted.
> 
> - **Nothing outside my work is changed by me.** The one exception is `docs/sessions/2026-11/14/1135_fighter-subclass-code-simplification-review.md`, which is modified but not by me; it belongs to the other session.
> - **My `CLAUDE.md` changes are small:** four lines added and one changed (the `campaign_mode` schema line, the PUT/POST note, and the world-items "not built" entry). The file is now 97.4 KB, under the 100 KB cap, and the budget test passed after my edits.
> - **The other docs updates are in place:** `docs/frontend-map.md`, `docs/backend-tests.md`, `docs/schema-notes.md` and the frontend-page agent file.
> - **`docs/sessions/INDEX.md`** will go into the ship commit as the note asks.
> - **I won't switch branches.** We share one working tr …

**Commands run:** 1

### 5. 2026-11-15 17:41

**Robert:**
> Lets move campaign settings up to the top of of the row.

**Claude:**
> **Campaign Settings** is now the first item in the GM sidebar, above Dashboard. All 3,913 frontend tests pass, including a new one that checks the order.
> 
> - Players' sidebars don't change, because they have no Campaign Settings item.
> - The change is in [Sidebar.jsx:15](frontend/src/shared/components/layout/Sidebar.jsx#L15). I also noted the new order in [docs/frontend-map.md](docs/frontend-map.md).
> - It's still uncommitted on `feature/world-building-only-toggle`.
> - The dev server should pick it up on its own; refresh the page if it doesn't.

**Commands run:** 3
