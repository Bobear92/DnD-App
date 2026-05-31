---
description: Apply a change consistently across all 24 class sheets (5e and 2024 editions)
---

Apply the requested change across all 24 class sheets. Argument: description of the change to make.

## Step 1 — Plan first (no edits yet)

Before touching any file, produce a checklist:
- Every file that needs editing (all 24 sheets: 12 × `frontend/src/characters/components/` + 12 × `frontend/src/characters/components/5e2024/`)
- The exact change per file, noting any class-specific exceptions
- Which tests will be updated or added
- What CLAUDE.md line(s) will be updated

Post this checklist and wait for confirmation if the scope is ambiguous.

## Step 2 — Validate class constraints before writing code

- **Fighter skill picker**: restricted to exactly 8 skills — Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Survival. Never "all 18."
- **Rogue skill proficiency picker**: restricted to 11 Rogue skills (Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth). Expertise picker uses ALL 18 skills.
- **Skill counts**: Bard/Ranger pick 3; Rogue picks 4; all others pick 2.
- **Half-casters**: Paladin 5e starts spells at L2; Ranger/Paladin 2024 starts at L1.
- **Subclass unlock levels**: 5e — Cleric/Sorcerer/Warlock L1, Druid/Wizard L2, all others L3. 2024 — all classes L3.
- **Section prop routing**: every sheet must handle `section: 'all' | 'stats' | 'features' | 'spells'`. Non-spellcasting sheets return null for `section === 'spells'`.
- **Creation gating**: HP grid, HitDiceTracker, AC, Speed row are hidden when `creation=true`.
- **Prepare-caster Spells tab**: Cleric/Druid/Paladin/Ranger (5e + 2024) + Wizard (5e + 2024) use a two-sub-tab layout inside the Spells tab. Use **button-based state switching** (`useState('prepared')`), NOT shadcn `<Tabs>` (avoids nested Radix context bug). "Prepared" sub-tab is the default (read-only reference). "Prepare Spells" sub-tab has the interactive selection UI + lock/unlock + encyclopedia link. Cleric/Druid/Paladin/Ranger use `ClassSpellBrowser`; Wizard uses spellbook chips. Lock state stored in `data.prepared_locked`. Sheets receive `campaignId` and `isGm` props.
- **SkillPicker race + background props**: every sheet's inline `SkillPicker` (or `SkillProficiencyPicker` in Fighter 5e) accepts both `backgroundSkills = []` (amber, non-clickable) and `raceSkills = []` (emerald, non-clickable). Race skills come from `getRaceGrantedSkills(race, subrace)` in `raceProficienciesData.js` (Keen Senses → Perception for all Elves; Menacing → Intimidation for Half-Orc). Bg vs race priority: a skill in both is amber (bg wins). Skills not in the class's allowed list still render as extra disabled buttons in their respective color after the main list. Two legends appear independently when either array is non-empty. Race skills must also be threaded through to the main sheet's prop signature: `export default function XxxSheet({ ..., backgroundSkills = [], raceSkills = [], ... })`. Sheets that combine `skill_proficiencies` with `expertise` (Bard, Rogue) must dedup race + bg skills into the `pool` array used to filter expertise.

## Step 3 — Determine scope: shared components vs individual sheets

Some changes affect **shared subclass components** rather than the 24 individual sheets:
- `SubclassOverview.jsx` — the info dialog (used in ClassOverview + SubclassPickerWithDetail)
- `SubclassDetails.jsx` — the locked-subclass inline panel (used in all 24 sheets via the `!(readOnly || (!creation && !!data.subclass))` guard — the lock applies only outside character creation)

If the change is to how subclass features/traits are displayed, edit these two shared files instead of (or in addition to) the 24 sheets. The effect still applies to all 24 sheets since they all render `SubclassDetails` for locked subclasses.

**Subclass / racial rest-resource trackers** — interactive resources tied to a *subclass* or *race* (not a class) live in dedicated tracker components, NOT inline in the 24 sheets:
- `PortentTracker.jsx` — Divination Wizard (`School of Divination`/`Diviner`); roll 2 d20s (3 at L14), expend per-die; stores `data.portent_rolls`; rendered in `WizardSheet`'s Features section under the subclass panel (5e + 2024), gated by `showFeatures`. Returns null for non-Divination subclasses.
- `RacialResourceTracker.jsx` + `racialRestResources.js` — rest-rechargeable racial traits (Breath Weapon, Relentless Endurance, Drow Magic, Infernal Legacy); use-counter widget keyed off `character_data.race_traits`; each resource has a "Use" button that opens a confirmation dialog naming its recharge (short/long rest) before expending, plus a "−" recover button; optional `includeKeys`/`excludeKeys` props split resources across tabs — Breath Weapon renders in the CharacterDetail "Weapons & Armor" tab, all other racials in the Stats tab "Racial Features" card. Returns null when no resources apply.

When adding a rest-gated subclass or racial feature: (1) add it to the relevant data table (`racialRestResources.js` for race, or the subclass-specific tracker), (2) **mirror it in the backend** `_compute_rest_patch` (`backend/players/characters/service.py`) so the GM rest buttons reset it, and (3) reflect it in `getRestSummary` (`CharacterList.jsx`). The backend `_RACIAL_REST_RESOURCES` and `_DIVINATION_SUBCLASSES` constants must stay in sync with the frontend tables.

**Cross-cutting HP / AC bonuses** (not rest resources) — passive bonuses to max HP or alternate AC formulas that come from a subclass, race, or class feature use **shared helpers + render slots**, so the per-sheet edit is mechanical and the logic stays centralized:
- `combatBonuses.js` — pure helpers `getHpBonuses` / `getAcOptions` / `isDraconicSorcerer`. Add a new source here (e.g. a +HP-per-level subclass, a non-armor AC formula) and it appears in every sheet automatically.
- `CombatBonusInline.jsx` — exports `MaxHpValue` (the Max HP cell's value: effective max HP = stored `hp_max` + bonuses, with a "+N Source" note; **display-only**, never mutates `hp_max`, which would double-count on the next level-up) and `AcOptionsLine` (non-armor AC formulas under the AC field). NOTE the filename differs from `combatBonuses.js` by more than case to avoid the Windows case-insensitive self-import trap.
- **Render-slot pattern (all 25 sheets):** every sheet's signature ends with `acExtra = null, maxHpNode = null`. The Max HP cell renders `{maxHpNode ?? (data.hp_max ?? '—')}` (so the bonus is folded into the displayed value, not a separate row), and `{showCombat && acExtra}` sits immediately after the Armor Class field. The sheets stay dumb — they don't import the helpers or compute anything. **CharacterDetail** builds `<MaxHpValue .../>` + `<AcOptionsLine .../>` and passes them as `maxHpNode`/`acExtra` only to the stats-section `ClassSheet`. Non-stats contexts (CharacterCreate) stay bonus-free since the slots default to null. (AC stays a manual input — it depends on worn armor — so AC options are shown as a helper under the field rather than auto-filled.)
- `AcOptionsLine` reads ability scores from the `scores` prop, so CharacterDetail threads `scores={identity.draft}` to the stats/features `ClassSheet` renders (this also fixes the Barbarian/Monk inline unarmored-AC boxes).
- These files are CRLF — a scripted multi-sheet insert must use `\r?\n` (not `\n`) in its anchors. Reliable anchors used for this change: the Max HP cell is exactly `{data.hp_max ?? '—'}` in all 25 (em dash is a literal unicode char); the `value={data.armor_class ?? ''}` Input is identical in all 25 (followed by `</Field>` or `</div>` then `)}`); `<HitDiceTracker` is uniformly preceded by `{showCombat && (`. Watch for **multiline signatures** (e.g. ArtificerSheet) where a single-line signature regex won't match — handle those by hand.
- No backend change is needed (passive bonuses are recomputed at render, not stored as `_used` counters).

**Subclass-chosen flavor data** (e.g. the Draconic Bloodline dragon type) — a one-off choice tied to a subclass lives in a dedicated picker component (`DraconicAncestorPicker.jsx`), rendered in the owning sheet's Features section gated by `showFeatures` + a subclass check, storing into a distinct `character_data` key. Display the chosen value wherever relevant (CharacterDetail Stats identity block + the Features section).

## Step 4 — Edit all 24 sheets (when needed)

Apply the change to each file. Preserve:
- Class-specific resource trackers (`rages_used`, `ki_used`, `bardic_inspiration_used`, etc.)
- Edition differences (5e vs 2024 mechanics — see CLAUDE.md "5.5e key differences" section)
- Subclass locking logic: `!(readOnly || (!creation && !!data.subclass))` — never remove this guard (the `!creation` clause keeps the picker unlocked during character creation so players can compare/deselect subclasses before review)

Work through the 5e sheets first (components/), then 2024 (components/5e2024/), same order both times:
Barbarian → Bard → Cleric → Druid → Fighter → Monk → Paladin → Ranger → Rogue → Sorcerer → Warlock → Wizard

## Step 4 — Run tests

```bash
cd frontend && npm test -- --run
```

Fix any failures before proceeding. Pay attention to `CharacterCreate.test.jsx` and `CharacterDetail.test.jsx` — they cover cross-sheet behavior.

## Step 5 — Update CLAUDE.md

Update the class sheet descriptions in the frontend file tree section to accurately reflect the change.

## Arguments
$ARGUMENTS
