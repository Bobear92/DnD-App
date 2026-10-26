---
session_id: c06706d4-db72-4707-9552-132c511e72f8
title: Rune Knight finished to level 20
date: 2026-10-26
started: 14:28
branch: feature/rune-knight-qa
area: character-system
tags: [build, qa, fighter, rune-knight, bonus-proficiencies, subclass-proficiencies, fire-rune, tool-checks, runic-juggernaut, runic-shield, great-stature, giants-might, weapon-reach, active-effects, items-tab, action-economy, guard-test, prose-signoff, surprise, 5e]
issues: [raw-correction, computed-not-shown, mechanism-extended, prose-to-mechanic]
summary: Rune Knight L3-20 audit: RAW text fixes, Bonus Proficiencies, Fire Rune tool doubling, Juggernaut reach + Large/Huge pick
turns: 4
stepped_in: true
last_uuid: 3ca872f5-749e-4a4c-a27e-7ebfec3bacc5
---

# Rune Knight finished to level 20

## Summary

- Audited every Rune Knight feature L3-20 against RAW, using the Fighter subclass retro's lessons.
- RAW text corrected at the source (`subclassData/fighter.js`, `runesData.js`) and pinned by tests: Runic Shield (attacker uses the NEW roll), Great Stature (one-time 3d4 inches, invented "equipment adjusts" removed), Fire Rune passive (DOUBLES PB on proficient tool checks).
- Bonus Proficiencies built as a row in `SUBCLASS_PROF_GRANTS_5E`: smith's tools → Tools banner, Giant → "From Subclass" languages + pickers' known sets (derived, no migration).
- Fire Rune passive real: `inventory/toolChecks.js` + `tool-check-proficiency` line on the Tools sub-tab.
- Runic Juggernaut reach real: `weaponReach` + shared `WeaponReachBadge` on Items + Action Economy (also shows Reach 10 ft for Reach weapons, all classes).
- Large/Huge choice on the Giant's Might toggle at L18 (`giants_might_size`, generic `choice` on effect definitions via `activeEffectChoice`); +5 ft reach only while Huge.
- Producer/consumer guard `runeFieldReaders.test.js` (retro proposal #3) — found and removed 3 dead fields.
- Full suite 3484 green; build green; Robert QA'd in-app.

## Where Claude struggled / where Robert stepped in

- `raw-correction`: three stored blurbs were wrong (Runic Shield "lower of two", Great Stature invented clause, Fire Rune "add PB" which granted nothing) — the original build trusted the stored text instead of RAW.
- `computed-not-shown`: Juggernaut's `reachBonus` and Fire Rune's `toolBonus` were produced with no reader since the original build; the guard test also surfaced `passive.saveAdvantage`, `passive.note`, `grants.attackDie` as dead.
- `mechanism-extended`: active effects needed a `choice` field and `grants/summary(level, characterData)` for the Large/Huge pick; `getAttacks` gained a `characterData` arg for reach.
- `prose-to-mechanic`: Bonus Proficiencies, Fire Rune passive and Juggernaut reach had been left as prose/"not modeled"; all buildable.
- Tooling slips: a python heredoc turned `` into backspace bytes in a regex; a test title with a nested apostrophe broke esbuild — both caught by tests.
- Robert stepped in to rule on the prose-only list (see Decisions); one early interruption mid-turn 1.

## Decisions

- Surprised condition: NOT built; keep a running watchlist (memory) and revisit when enough features need it (~7 today).
- Runic Juggernaut Huge is optional → add a Large/Huge toggle (default Huge).
- Great Stature height stays narrative text in the feature; never computed.
- Re-inscribing runes on a long rest and jewelry as rune-bearers stay as existing scope limits.
- Fixed subclass grants are derived (table row), not stored, so existing characters get them with no migration.

## Open threads

- Surprise model deferred — watchlist in memory `project_surprised_condition_watchlist.md`.
- Rune-bearing jewelry/worn objects wait on a worn-item model.
- Channel Rune target-side effects (Cloud/Fire/Stone) have no target model; remain prose on their cards.
- `toolChecks.js` is a source table — Artificer Tool Expertise is the obvious second row.

## Turn log

<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->

### 1. 2026-10-26 14:28 ⚠ interrupted by Robert

**Robert:**
> okay lets take a look at where we are with the rune knight subclass. Look at the fighter subclass retro and see how well you can finish QAing and fixing the subclass to level 20.

**Claude:**
> I'll start by reading the retro and getting the current state of the branch.

**Commands run:** 1

### 2. 2026-10-26 14:54

**Robert:**
> okay continue

**Claude:**
> I've finished the code side of the Rune Knight pass, to level 20. The full suite passes (153 files, 3476 tests). I haven't opened it in the running app, so your QA pass is next.
> 
> **The text that was wrong is now fixed in the source data**, which also feeds the encyclopedia, the rune picker and the item cards. Each fix has a test pinning it:
> - **Runic Shield:** the attacker uses the *new* roll. It said "the lower of the two".
> - **Great Stature:** it's a one-time 3d4-inch height roll. The "equipment automatically adjusts" line wasn't in the rules, so I removed it.
> - **Fire Rune:** it *doubles* your proficiency bonus on tool checks you're proficient in. As written ("add your proficiency bonus") it granted nothing.
> 
> **Built:**
> - **Bonus Proficiencies (level 3):** smith's tools now show in the Items → Tools proficiency banner, and Giant shows under the "From Subclass" languages. I reused the …

**Files edited:** `frontend/src/characters/components/classData/subclassData/fighter.js`, `frontend/src/characters/components/classData/runesData.js`, `frontend/src/characters/components/inventory/inventoryProficiencies.js`, `frontend/src/characters/components/classData/subclassGrants.js`, `frontend/src/characters/pages/CharacterDetail.jsx`, `frontend/src/characters/components/inventory/toolChecks.js`, `frontend/src/characters/components/inventory/inventoryData.js`, `frontend/src/characters/components/inventory/WeaponReachBadge.jsx`, `frontend/src/characters/components/classData/runeFieldReaders.test.js`, `frontend/src/characters/components/inventory/toolChecks.test.js` · **Commands run:** 69

### 3. 2026-10-26 17:35

**Robert:**
> For the my call ones
> 
> 1: Lets take not of this asking about surprised. If we start seeing alot of things calling for a surprised condition then we will look at adding something. 
> 2: Lets add the toggle. 
> 3: Fine this is just narrative. Just have it displayed in the text when it is activated. 
> 4: Sounds good.

**Claude:**
> I've handled all four of your calls. The full suite passes (153 files, 3484 tests). I haven't tried the new toggle in the running app yet.
> 
> **1. Surprised: noted, nothing built.** I saved a running list to memory, and CLAUDE.md now marks the Storm Rune clause as deliberately deferred. About seven features already depend on surprise:
> - Storm Rune
> - Alert (2014)
> - Barbarian Feral Instinct (both editions)
> - Oath of the Watchers
> - Assassin Assassinate
> - Assassin Death Strike
> - Thief's Reflexes
> 
> I'll add to the list as more turn up and tell you the count. I won't build a surprise model until you say so.
> 
> **2. Large/Huge toggle: built.** From level 18, the Giant's Might card in the Action Economy tab shows "Grow to: **Large** | **Huge**" beside its Use/End control. Huge is selected by default.
> - The pick is saved on the character as `giants_might_size`. Size, the grapple/shove limits and the c …

**Files edited:** `../../../.claude/projects/c--Users-rober-Documents-Projects-dnd-app/memory/project_surprised_condition_watchlist.md` · **Commands run:** 21

### 4. 2026-10-26 17:43

**Robert:**
> Sure start the servers

**Claude:**
> Both servers are running and responding:
> - **Frontend:** http://localhost:5173
> - **Backend:** http://localhost:8000
> 
> The new pieces only show up for a level-18 Rune Knight with Giant's Might, Fire Rune and Stone Rune set up:
> - **Large/Huge choice:** in the Action Economy tab, the Giant's Might card's Use control has the choice beside it at level 18 or higher.
> - **Reach badge:** with Giant's Might on and Huge picked, attack cards show "Reach … +5 ft (Runic Juggernaut)". Switching to Large should remove it.
> - **Fire Rune:** in Items → Tools, the line about proficient tool checks shows the doubled bonus while the Fire Rune is carved on an equipped item.
> - **Bonus Proficiencies:** smith's tools appear in the Tools proficiency banner and Giant appears under "From Subclass" languages.
> - **Text fixes:** Runic Shield, Great Stature and the Fire Rune description should read correctly.
> 
> I'll wait …

**Commands run:** 2
