---
description: Add or modify a data-driven class config (ClassSheet), or migrate a legacy hand-written sheet to a config
---

Work with the data-driven class system (Epic 0). One `ClassSheet.jsx` + a per-class **config object** +
shared hooks renders a class sheet — replacing the hand-written per-class sheets. Argument: a description
of the change, or a class to add/migrate.

**Status:** Fighter + Wizard (both editions) are config-driven. The other 22 classes still use hand-written
sheets in `frontend/src/characters/components/sheets/` (5e) and `.../sheets/2024/` (2024) — migrating each one is the
ongoing work this skill covers.

## Where things live (`frontend/src/characters/components/sheets/classSheet/`)
- `ClassSheet.jsx` — universal renderer. Reads `config` + the standard sheet props
  (`data, onChange, readOnly, level, creation, section, scores, abilityScores, backgroundSkills,
  raceSkills, raceGrantedCantrips, campaignId, isGm, acExtra, maxHpNode`) **plus `gmEdit`**.
  Handles section isolation, the HP/AC/Speed combat block, locked choices, rest resources, notes,
  subclass, Portent, the caster block, the features list, ASI reminder, and the creation skill picker.
- `configs/{fighter,wizard}.js` — the config objects. `configs/index.jsx` — `getClassConfig(class, edition)`
  + bound wrappers (`FighterSheet5e`, `WizardSheet2024`, …) re-exported by the two `components` index files
  as `FighterSheet`/`WizardSheet` so the page maps need no change.
- `hooks/useLockedChoice.js` — `locked = readOnly || (!creation && !gmEdit && hasValue)` (permanent choices).
- `hooks/useSlotCaster.js` — `availableSlots`/`setSlotUsed`/`handleCastSpell`; slots reset only by GM rest.
- `hooks/useRestResource.js` — resolves config `restResources` → rows for the level.
- `RestResourceTracker.jsx`, `CombatBlock.jsx`, `CasterSpellBlock.jsx`, `SkillProficiencyPicker.jsx`,
  `SpellPickerCreation.jsx` — shared blocks driven by config.

## Config shape (reference: `configs/fighter.js`, `configs/wizard.js`)
```js
{
  className, edition, hitDie,
  features,                                  // CLASS_FEATURES_5E[Class] or CLASS_FEATURES_2024[Class]
  extraAttacks,                              // (level)=>number | null  (martial; shown at level >= 5)
  lockedChoices: [{ key, label, options, minLevel }],   // e.g. fighting_style → FIGHTER_FIGHTING_STYLES_*
  weaponMastery: { label, max:(level)=>n, note },       // 2024 martial only (omit/undefined otherwise)
  restResources: [{ key, label, total:(level)=>n, recharge:'short'|'long', minLevel, description }],  // description = short "what it does" line shown under the label (always author one)
  notes: [{ label, text, minLevel }],        // informational (Tactical Mind, Scholar, …)
  subclass: { label, options, unlockLevel, subclassEdition },  // options from classChoicesData *_SUBCLASSES_*
  asiLevels: [4,6,8,...],
  skill: { allowed: [...], count },
  caster: null | {                            // null = martial
    spellcastingAbility,                      // 'intelligence' | 'wisdom' | 'charisma'
    slotsForLevel:(level)=>number[],          // 9-element (full) or 5-element (half) totals
    arcaneRecovery, portent,                  // booleans
    cantrips:  { label, limit, options },     // creation curated picker
    spellbook: { label, limit, options },     // creation curated picker (prepared/spellbook model)
  },
}
```

## Class constraints to honor (these now live in config values)
- **Skill counts:** Bard/Ranger 3, Rogue 4, all others 2. **Skill lists:** Fighter = 8 (Acrobatics, Animal
  Handling, Athletics, History, Insight, Intimidation, Perception, Survival); Rogue prof picker = its 11.
- **Subclass unlock:** 5e — Cleric/Sorcerer/Warlock L1, Druid/Wizard L2, others L3. 2024 — all L3.
  `subclassEdition` is `'5e'` or `'5.5e'`.
- **Half-casters:** Paladin 5e starts slots at L2; Ranger 5e + Paladin/Ranger 2024 at L1.
- **Section isolation + creation gating + `maxHpNode`/`acExtra` slots** are handled by `ClassSheet` — don't
  reimplement them per config.

## Workflow A — modify an existing config (Fighter/Wizard)
1. Edit the config object. If you add a `restResource`, **mirror its reset in the backend**
   `_compute_rest_patch` (`backend/players/characters/service.py`) and in `getRestSummary` (`CharacterList.jsx`).
2. Run tests (below). Add/extend `classSheet/ClassSheet.test.jsx` or `configs/configs.test.js` as needed.

## Workflow B — migrate a legacy hand-written sheet to a config (the 22 remaining)
1. Read the existing `XxxSheet.jsx` (5e) and `5e2024/XxxSheet.jsx` to capture every behavior, label, and
   `data-testid`. The bar: **`CharacterCreate.test.jsx` + `CharacterDetail.test.jsx` must pass unchanged.**
2. Write `configs/xxx.js` exporting `XXX_5E` / `XXX_2024`. Reuse `classChoicesData.js`,
   `classFeatures5e.js`/`classFeatures2024.js`, `classProgressionTables.js` for options/features/slots.
3. If the class needs a block `ClassSheet` doesn't have yet (a class-specific resource tracker, a known-caster
   spell picker, metamagic, etc.), **add a config-driven block to `ClassSheet`/a shared component** — never
   fork per-class JSX back into the config. Subclass/racial trackers stay as their own components
   (`PortentTracker`, `RacialResourceTracker`) and are wired through config flags.
4. Register the class in `configs/index.jsx` (`CONFIGS` map + bound wrappers) and re-export the wrappers from
   `components/sheets/index.js` (5e) and `components/sheets/2024/index.js` (2024) as `XxxSheet`. Delete the old
   `XxxSheet.jsx` files.
5. If a known caster (Bard/Sorcerer/Warlock), confirm the `LevelUpWizard` New-Spells step still works.

## Workflow C — brand-new class
Same as B steps 2–4 but also seed `backend/seed_classes.py`, `classFeatures*.js`, `classChoicesData.js`,
and `classProgressionTables.js`, and add it to `SUPPORTED_CLASSES_*` + the page sheet maps.

## Lock + GM Edit (Epic 1)
Permanent choices (subclass, fighting style, metamagic picks, etc.) belong in `lockedChoices` (or the subclass
slot) so `useLockedChoice` locks them outside creation. The GM Edit toggle in `CharacterDetail`
(`data-testid="gm-edit-toggle"`, default OFF) sets `gmEdit`, which unlocks them for the GM only.

## Run tests
```bash
cd frontend && npm test -- --run
```
`CharacterCreate.test.jsx` / `CharacterDetail.test.jsx` are the acceptance bar; `WizardSheet.test.jsx`,
`classSheet/ClassSheet.test.jsx`, and the `hooks/`/`configs/` tests cover the data-driven layer. Restart
uvicorn if you touched any `.py` (backend rest sync).

## Update CLAUDE.md
Reflect the migrated/added class in the frontend `classSheet/` section + test listing.

## Arguments
$ARGUMENTS
