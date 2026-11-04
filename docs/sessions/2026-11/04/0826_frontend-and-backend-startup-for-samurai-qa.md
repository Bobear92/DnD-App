---
session_id: 1c2a3f70-e77c-4bf1-bcb9-ea11648ba330
title: Samurai QA and Fighter retro update
date: 2026-11-04
started: 08:26
branch: feature/wizard-prework-todos
area: character-system
tags: [qa, docs, retro, tooling, fighter, samurai, elegant-courtier, tireless-spirit, rapid-strike, strength-before-death, starting-equipment, race-traits, save-features, save-proficiencies, auto-effects, character-create, level-up-wizard, stats-tab, encounters, theme, claude-md, 5e]
issues: [computed-not-shown, presentation, mechanism-extended]
summary: Samurai QA (no mechanic bugs); equipment picker, racial save traits, wizard auto-effects, save provenance; dark: on
turns: 17
stepped_in: true
last_uuid: e370043f-1d3f-4699-965f-b0bc20060d05
---

# Samurai QA and Fighter retro update

<!-- Claude fills the sections below with /log. area is one of: character-system, campaign-tools, encyclopedia, backend, tooling -->

## Summary

- Robert QA'd the Samurai in the running app. **No Samurai mechanic was wrong**: Tireless Spirit (encounters initiative flow, 85 backend initiative tests), Rapid Strike (attack rider) and Strength Before Death (reaction) were all checked and left as built.
- Starting-equipment weapon picker (`StartingEquipmentStep`, `weaponPropertyData`): Melee/Ranged facets replace the Ammunition filter chip (`weaponFilterFacets`); fixed "lb. lb"; range band shown on cards; a "Your choices" summary under the weapon grids with × to deselect.
- Racial save traits (Brave, Lucky, Stout/Dwarven Resilience, Fey Ancestry, Gnome Cunning) in the Features Affecting Saves panel via `RACE_SAVE_TRAITS`.
- Level-up wizard: new `leveling/levelUpAutoEffects.js` diffs the derived registries (feature save proficiencies, skill bonuses), so the Features step and Confirm show Elegant Courtier's WIS save and +WIS Persuasion as "Applied to your sheet automatically".
- Saves grid colours each proficiency by source (`saveProficiencySource`: Gold class · Blue feat · Rose feature · Slate by hand) with a `saves-source-legend`.
- `<html class="dark">`: all ~550 `dark:` classes were dead (the theme is dark at `:root`, but the variant keys on `.dark`); guarded by `src/test/darkTheme.test.js`.
- `docs/fighter-subclass-retro.md`: §4 status table, §5 (Rune Knight finish + Samurai, measured from session logs), §6 (Wizard carry-over and predicted missing models). Phase 0 RAW check, moment-of-use and contract-fit columns, the derived-effect check and the player read-through written into `/subclass-features`.
- Shipped as `3bd8c3a`. Follow-up: the open items became the Wizard pre-work worklist `docs/tickets/wizard-subclasses.md`.
- Verified in the running app (read-only Playwright, GM account): html has `dark`, the WIS save shows source `feature` with the legend, racial save traits listed, 0 console errors. Frontend 3,562 tests; build green.

## Where Claude struggled / where Robert stepped in

- Robert found every issue this session; none came from Claude's own checks. They were all presentation or adjacent-surface issues: the Samurai build's audit had held up.
- `presentation`: the Ammunition filter read as "show me ammunition"; "lb. lb"; the two stacked weapon grids were hard to read; **the new wizard box shipped unreadable** (light emerald palette + `dark:` variants that never applied). The player read-through would have caught the first three. The last needed one look at the running app.
- `computed-not-shown`: Halfling Brave and the other racial save traits were stored and described on Identity but absent from the saves surface. Elegant Courtier's derived effects were applied but never announced in the wizard ("derived-not-announced", a new sibling category). Save proficiency source wasn't shown, though skills showed theirs.
- `mechanism-extended`: `saveFeatures` gained a race-trait route; `saveProficiencies` gained `saveProficiencySource`; the wizard gained the auto-effects diff.
- Tooling slips again: Python heredocs broke on `\d`/`\s`/`\+` escapes, a nested apostrophe in a test title broke esbuild, and one heredoc failed outright while writing the retro section *about* heredocs. Write/Edit tools fixed each one. Should have been the first choice.
- A test asserted "Wisdom" against text rendered lowercase with CSS `capitalize`.
- Robert declined two offers: a standalone Rapid Strike card (kept as a rider) and rewording Strength Before Death's text to say "use your reaction".

## Decisions

- Ammunition stays a card badge (it's the rules property) but not a filter; Ranged/Melee are the filters.
- Racial save traits are all situational, so none tags a save row; panel-only.
- Derived effects are announced by diffing the registries, not by naming features, so new rows appear free.
- Save provenance colours: Gold/Blue match the skills grid; Rose (feature) and Slate (by hand) are saves-only; precedence class → feat → feature → hand.
- Rapid Strike stays an attack rider; Strength Before Death stays a reaction card with its current text (Robert).
- Dark mode: turn `dark:` on globally via `<html class="dark">` rather than sweeping files (Robert approved).
- Retro proposals 1, 2, 5, 6 codified in `/subclass-features` before the Wizard work (Robert approved).

## Open threads

**All of the below are now checkboxes in `docs/tickets/wizard-subclasses.md`** (linked from retro §6). Start the Wizard work there.

- Light-palette classes with **no** `dark:` partner still render pale (unchanged by the switch). Sweep them when touched.
- Retro proposal 4 (model-size estimate on prose sign-offs) is still not done.
- Wizard subclasses next: per retro §6b, `/grill` the concentration-state and spell-cast-event models before the first school; prove one school (Abjuration or Evocation) end-to-end first.
- Items-tab attack rows still don't show Fighting Spirit's advantage (only Action Economy cards do), carried from the Samurai build session.

## Turn log

<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->

### 1. 2026-11-04 08:26

**Robert:**
> Start the frontend and backend. I will QA the Samurai.

**Claude:**
> Both servers are running and ready for your Samurai QA:
> 
> - **Frontend:** http://localhost:5173
> - **Backend:** http://localhost:8000 (API docs at `/docs`)
> 
> I created the branch `feature/samurai-qa` from an up-to-date `main` before starting. The uncommitted session-log edits that were already on `main` moved onto the branch with it. I'll wait for your findings.

**Commands run:** 3

### 2. 2026-11-04 08:36

**Robert:**
> These are nor ammunitions they are ranged weapons.

**Claude:**
> I've fixed it on `feature/samurai-qa`, and all 3,535 frontend tests pass. Vite hot-reloads, so refresh the Equipment step to see it.
> 
> **What changed in the weapon filter**
> - **The "Ammunition" filter chip is gone.** In its place are **Melee** and **Ranged** chips, read from the weapon's type. "Ranged" now shows bows, crossbows, the blowgun and the sling, plus darts and nets.
> - **Each card now has a Melee/Ranged tag** next to Martial/Simple, with an ⓘ explanation like the other tags.
> - **The "Ammunition" tag stays on the cards themselves.** It's the official name of the rule that says the weapon needs arrows or bolts. It's only gone as a filter. If it still reads wrong on the cards, I can relabel it, for example "Uses ammunition".
> 
> **Two other bugs on the same cards, fixed while I was there**
> - The weight read "1 lb. lb" because the item list already stores "lb." and the card added a seco …

**Commands run:** 12

### 3. 2026-11-04 08:42

**Robert:**
> When selecting weapons during character creation, for fighter for example either one martial weapon and a shield or two martial weapons 
> 
> Lets have their choices displayed at the bottom. When trying to select two it can be confusing which one you already have selected.

**Claude:**
> I added a **"Your choices"** box at the bottom of the weapon-picking panel. All 3,537 tests pass.
> 
> It has one line per weapon you have to pick. For "Two martial weapons" it reads:
> 
> - **First martial weapon:** Longsword
> - **Second martial weapon:** *Not chosen yet*
> 
> Each line updates as soon as you click a card. It also keeps naming your pick when a filter hides that card. For example, if you choose a Longsword and then filter to Ranged, it still says Longsword. If you switch to "A martial weapon and a shield", the box changes to that option's single slot.
> 
> The change is in `StartingEquipmentStep.jsx`, with two new tests. Refresh the Equipment step to see it.

**Files edited:** `frontend/src/characters/components/inventory/StartingEquipmentStep.jsx` · **Commands run:** 7

### 4. 2026-11-04 08:46

**Robert:**
> okay also for this bottom section lets allow the user to also deselect their choice from there. So that if they want to change they dont need to find it again in the options.

**Claude:**
> Each chosen weapon in the "Your choices" box now has a small **×** next to it. Clicking it clears that pick: the line goes back to *Not chosen yet*, the card in the grid is no longer highlighted, and the weapon is dropped from your starting inventory. Then click any card to pick again.
> 
> The × only appears on lines that have a pick. All 3,538 tests pass, including a new one for this. Refresh the Equipment step to try it.

**Files edited:** `frontend/src/characters/components/inventory/StartingEquipmentStep.jsx` · **Commands run:** 3

### 5. 2026-11-04 11:45

**Robert:**
> For halfings lets add a little note at the saving throws section for brave

**Claude:**
> Brave now shows on a Halfling's sheet in the **Features Affecting Saves** list under the Saving Throws grid. It's in the Stats → Abilities & Skills sub-tab. It's labelled "Racial", and clicking it shows the trait's text: "You have advantage on saving throws against being frightened."
> 
> The new code reads the character's stored racial traits, so I added the other racial traits that affect saves at the same time:
> - **Lucky** (Halfling): reroll a 1 on a saving throw.
> - **Stout Resilience** (Stout Halfling, your character's subrace) and **Dwarven Resilience** (Dwarf): advantage against poison.
> - **Fey Ancestry** (Elf, Half-Elf): advantage against being charmed.
> - **Gnome Cunning** (Gnome): advantage on Intelligence, Wisdom and Charisma saves against magic.
> 
> None of them adds an "adv" tag to a save row. Each one only applies in a specific situation, so tagging a whole save would be wrong. Tell …

**Commands run:** 11

### 6. 2026-11-04 11:54

**Robert:**
> Lets take time to make sure we have all this functionality during the level up wizard. 
> 
> The wisdom added to the persuasion check, the proficiency in widsom saving throw, and the choosing of int or cha for proficiency if the user already has a proficiency in wisdom.

**Claude:**
> All three parts of Elegant Courtier now show in the level-up wizard. Two of them were already being applied to the sheet; the wizard just never said so. All 3,553 tests pass.
> 
> | Part | What the wizard does now |
> |---|---|
> | **+Wisdom modifier to Persuasion** | Was already applied to the sheet, but the wizard never mentioned it. The New Features step now says e.g. "Persuasion checks: +2 (Elegant Courtier (WIS modifier))", and Confirm repeats it. |
> | **Wisdom-save proficiency** | Was already applied to the sheet, but not mentioned. The New Features step now says "Wisdom saving throws: you become proficient — your save is now +5 (+2 WIS, +3 proficiency)", and Confirm shows it too. |
> | **Intelligence or Charisma instead** | Was already handled: a step appears only for a Samurai who already has Wisdom-save proficiency. The New Features step now says "You're already proficient in Wisdom saving …

**Files edited:** `frontend/src/characters/components/leveling/levelUpAutoEffects.js`, `frontend/src/characters/components/leveling/LevelUpWizard.test.jsx` · **Commands run:** 16

### 7. 2026-11-04 12:08

**Robert:**
> Cant read this

**Claude:**
> I fixed the unreadable box. It was using light-mode green colours with a dark-mode override, and the override never kicked in, so you got a light grey box with pale text. It now uses the app's own colours, so it should look like the other cards in the wizard: a dark background, gold title and border, normal text, and the breakdowns in the usual muted colour. All 3,553 tests pass.
> 
> Refresh and level the Samurai to 7 again to check it.

**Commands run:** 2

### 8. 2026-11-04 12:11

**Robert:**
> Lets have some notation, like a different color similar to in skills, for when a saving throw proficiency isnt from the base class proficiencies.

**Claude:**
> The Saving Throws grid now colours each proficiency checkbox by where the proficiency comes from. All 3,560 tests pass.
> 
> | Colour | Meaning |
> |---|---|
> | **Gold** | One of the class's own saves (same gold as the skills grid) |
> | **Blue** | From a feat, e.g. Resilient (same blue as the skills grid) |
> | **Rose** | From a class or subclass feature, e.g. Elegant Courtier |
> | **Slate** | Ticked by hand on a save the class doesn't give |
> 
> - **Legend:** it appears under the grid only when at least one save isn't a class save, and it names the sources. For your Samurai at level 7 it reads "Gold = class save · Rose = from Elegant Courtier". A plain Fighter gets no legend.
> - **Breakdown:** clicking a save's number also names the source, e.g. "Proficient — Resilient (feat)" or "Proficient — set by hand (not a class save)".
> - **Overlaps:** if two sources cover the same save, the colour follows the f …

**Commands run:** 12

### 9. 2026-11-04 12:19

**Robert:**
> Make sure this functionality works with the encounters table mechanic we have built out

**Claude:**
> I checked it, and Tireless Spirit already works with the encounters flow. I didn't need to change any code.
> 
> When the GM presses **Start Combat** on the Encounters page, the backend checks each character in the encounter. For a 5e Samurai who is level 10 or higher and has no Fighting Spirit uses left, it gives one use back. The sheet's Fighting Spirit tracker and its Action Economy card read that same counter, so both show the regained use. Both sides use 3 uses per long rest. If the Samurai still has a use left, nothing changes, which matches the rules wording ("have no uses of Fighting Spirit remaining").
> 
> All 85 backend initiative tests pass, including the three for Tireless Spirit:
> - regains a use when the character is out of uses
> - does nothing when a use is left
> - does nothing below level 10
> 
> **To check it yourself:**
> 1. Take your level-10 Samurai and spend all 3 Fighting Spirit us …

**Commands run:** 4

### 10. 2026-11-04 12:26

**Robert:**
> Do you think we should have this as an action card?
> Just so it doesnt get lost deep in the subclass info?

**Claude:**
> I'd keep it off its own card, because it's already on the attack cards. In the Action Economy tab, every weapon attack card for a level-15 Samurai has a collapsed **Rapid Strike** note. Click the name to read it. When Fighting Spirit is switched on, the note changes to say "You have advantage now (Fighting Spirit)…".
> 
> **Why not a separate card:** Rapid Strike isn't an action. It costs no action, no bonus action and no use; it changes an Attack action you're already taking. Under Actions, a card would suggest you pick it *instead of* attacking, which is wrong. That's the same reason Unwavering Mark and Giant's Might are notes on the attack cards rather than cards of their own.
> 
> **If you want it harder to miss, I'd suggest either or both of these:**
> 1. **Open it automatically while Fighting Spirit is running.** That's the moment you know you have advantage, so the note would show its full …

**Commands run:** 1

### 11. 2026-11-04 12:28

**Robert:**
> okay yeah it is good where it is.

**Claude:**
> Okay, Rapid Strike stays as it is.
> 
> So far this session I've changed these on `feature/samurai-qa`, all with tests passing:
> - **Starting-equipment weapon picker:** Melee/Ranged filters instead of the Ammunition filter, the weight and range fixes, and the "Your choices" summary with × to deselect.
> - **Saves:** Halfling Brave and the other racial save traits now appear under the saves.
> - **Level-up wizard:** Elegant Courtier's automatic effects are now listed in the wizard.
> - **Save colouring:** save proficiencies are coloured by where they come from.
> 
> Tireless Spirit needed no change.
> 
> Ready for the next finding.

### 12. 2026-11-04 12:30

**Robert:**
> Is this feature a reaction?

**Claude:**
> Yes, it's a reaction. The Xanathar's text for Strength Before Death says: *"If you take damage that reduces you to 0 hit points and doesn't kill you outright, **you can use your reaction** to delay falling unconscious, and you can immediately take an extra turn, interrupting the current turn."*
> 
> So the **REACTION** badge and its place in the Reactions tab are correct. It's also once per long rest, and that limit really is part of the feature. The 1 / 1 counter is the once-per-long-rest limit, separate from your normal one reaction per round.
> 
> The card's own text says "delay falling unconscious…" but never says it uses your reaction, so the description doesn't back up its own badge. Want me to change it to start "Use your reaction to delay falling unconscious…"?

### 13. 2026-11-04 12:35

**Robert:**
> okay sounds good then its in the right place.

**Claude:**
> Okay, Strength Before Death stays as it is. Ready for the next finding.

### 14. 2026-11-04 12:38

**Robert:**
> okay samuari looks good. That is the last of the fighter subclasses. Take all the learnings and lets update the fighter subclass retro so we have some data for when we start building out the wizard subclass stuff.

**Claude:**
> I've updated [docs/fighter-subclass-retro.md](docs/fighter-subclass-retro.md). It now covers all nine Fighter subclasses up to today, and the new parts come from this session's logs rather than reconstructed from commits.
> 
> Written for: you, and Claude at the start of the Wizard subclass work.
> 
> **What I changed**
> - **Header:** now says which sections came from commits only (the original §1–§4) and which come from session logs (the new §5).
> - **Fixed items marked in place:** the Runic Shield and Fire Rune text, and the two fields nothing read.
> - **§4, new status table:** whether each proposed process change was carried out and written into the `/subclass-features` skill.
> - **§5, Rune Knight finish and Samurai:**
>   - **Audit-first worked.** Samurai took one session and one commit, the bad stored text was caught before any code, and the QA pass found no wrong Samurai mechanic.
>   - **What sti …

**Files edited:** `docs/fighter-subclass-retro.md`, `../../../AppData/Local/Temp/claude/c--Users-rober-Documents-Projects-dnd-app/1c2a3f70-e77c-4bf1-bcb9-ea11648ba330/scratchpad/retro_status.md`, `../../../AppData/Local/Temp/claude/c--Users-rober-Documents-Projects-dnd-app/1c2a3f70-e77c-4bf1-bcb9-ea11648ba330/scratchpad/retro_tail.md` · **Commands run:** 13

### 15. 2026-11-04 12:42

**Robert:**
> 1: yes
> 2: yes

**Claude:**
> Both are done, and all 3,562 tests pass.
> 
> **1. The process lessons are now in the `/subclass-features` skill**, so the Wizard work gets them without anyone pointing at the retro:
> - **New Phase 0, a rules-text check before planning.** Compare every feature description and every pool option to the rulebook, and assume all of them are wrong. Fix the stored text itself and pin it with a test. Ask you when unsure of the exact wording. Don't trust CLAUDE.md's claims about the subclass being audited.
> - **Two new planning columns.**
>   - *Moment of use*: what the player is looking at when they reach for the feature. This decides where it goes, ahead of its cost badge.
>   - *Contract fit*: whether the clause matches the existing mechanism exactly, so any needed extension is planned up front instead of found in QA.
> - **Default to the full rules version** and offer the simpler version as the alternat …

**Files edited:** `.claude/commands/subclass-features.md`, `frontend/index.html`, `frontend/src/test/darkTheme.test.js`, `docs/fighter-subclass-retro.md`, `CLAUDE.md` · **Commands run:** 4

### 16. 2026-11-04 12:47

**Robert:**
> okay lets /ship and merge to main

**Claude:**
> Shipped. The work is on `main` at **`3bd8c3a`** and pushed, and the `feature/samurai-qa` branch is deleted.
> 
> - **Tests and build:** all 3,562 frontend tests pass and the production build succeeds. Nothing in the backend changed, so the backend checks didn't apply.
> - **Checked in the running app:** I logged in as the test GM and only looked, changing nothing. The Samurai's Wisdom save shows the Elegant Courtier colour with the legend "Gold = class save · Rose = from Elegant Courtier". The Halfling traits Brave, Lucky and Stout Resilience appear in Features Affecting Saves. Dark mode is on and there were no console errors.
> - **Agent fix:** the `frontend-page-expert` agent recommended a pale amber background for GM Notes cards, the kind that renders as a light box on the dark page. It now points to the faint amber tint NPC Detail actually uses.
> - **Session log:** written. It records that yo …

**Files edited:** `../../../AppData/Local/Temp/claude/c--Users-rober-Documents-Projects-dnd-app/1c2a3f70-e77c-4bf1-bcb9-ea11648ba330/scratchpad/verify.mjs`, `docs/sessions/2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md` · **Commands run:** 15

### 17. 2026-11-04 12:52

**Robert:**
> Put the still open items as todos for when we start to build out the wizard

**Claude:**
> The open items are now a to-do list in [docs/tickets/wizard-subclasses.md](docs/tickets/wizard-subclasses.md), and retro §6 links to it.
> 
> **Before the first Wizard school:**
> - [ ] **Concentration:** use `/grill` to decide how to handle concentration (Durable Magic, Bladesong, War Caster).
> - [ ] **Spell-cast event:** use `/grill` to decide on a "when you cast a spell of school X" event (Arcane Ward, Grim Harvest, the Evocation features).
> - [ ] **Proving school:** pick one school to build end to end first. The retro suggests Abjuration or Evocation.
> - [ ] **Size estimates:** add the "how big would this be to build" estimate to the skill's skipped-mechanics list (the retro's proposal 4).
> 
> **Cleanups, to do as the files come up:**
> - [ ] **Pale boxes:** fix the boxes that use a light colour with no dark-mode version, a file at a time rather than one big sweep.
> - [ ] **Feat-spell key warning:* …

**Files edited:** `docs/tickets/wizard-subclasses.md`, `docs/fighter-subclass-retro.md` · **Commands run:** 2
