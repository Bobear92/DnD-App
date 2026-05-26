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

## Step 3 — Edit all 24 sheets

Apply the change to each file. Preserve:
- Class-specific resource trackers (`rages_used`, `ki_used`, `bardic_inspiration_used`, etc.)
- Edition differences (5e vs 2024 mechanics — see CLAUDE.md "5.5e key differences" section)
- Subclass locking logic: `!(readOnly || !!data.subclass)` — never remove this guard

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
