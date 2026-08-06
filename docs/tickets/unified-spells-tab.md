# Unified Spells tab — ticket worklist

**Goal:** every caster character's Spells tab renders through the one shared layout — a single level
strip (Cantrips · 1st · 2nd …) spanning sources, with a per-level Class / Racial / Feats source
toggle — instead of 15 hand-rolled spells sections.
**Source list:** filesystem enumeration of `characters/components/sheets/*.jsx` + `2024/*.jsx` with a
spells section (15 sheets); no coverage report enumerates this because it is layout, not mechanization.
**Status:** 2/19 done (T1 the mechanism + Cleric 5e, T2 the contract test). The other 17 are
per-class conversions and closeout.

## Known issue found during T1 verification (pre-existing — not caused by this work)

Rendering **feat-granted spells** logs a React `Each child in a list should have a unique "key" prop`
warning (attributed to `SpellList`). Confirmed pre-existing: a **Wizard** — a path this work never
touched — produces the identical warning as soon as it has a Magic Initiate-style feat, and a Cleric
with no feats is clean. Cosmetic only (nothing renders wrong), so it was deliberately left alone
rather than fixed inside a layout ticket. Worth fixing during whichever class QA pass first cares
about feat spells; the culprit is the feat branch of `SpellSourceLevelView` / `FeatSpellsSection`,
not the class list.

## Sequencing — READ FIRST

**This worklist is not a sprint. It is deferred behind the Fighter subclasses.** Finish those before
moving on to other classes.

After that, the per-class conversion tickets below are meant to be picked up **during that class's QA
pass** — when you sit down to QA the Druid, do `SPELLS-DRUID-5E` and `SPELLS-DRUID-2024` as part of
it. Each is self-contained (one sheet, one descriptor entry, one test file) and depends only on the
mechanism, which already landed. There is no reason to batch them, and batching is what produced the
24× rework this project already paid for once.

T1 (the mechanism) is done, so **any class ticket can be picked up in any order** — except Warlock,
which needs `kind:'pact'` built first (see `SPELLS-WARLOCK-5E`). Do T2 (the contract test) before the
first batch of conversions.

## Decisions (from `/grill` — GO, consolidation-first)

- **Route: shared spells section.** Extend `CasterSpellBlock` (already the spells section for
  config-driven casters) with the missing caster *kinds* + an `extras` slot. Each hand-written sheet
  then DELETES its ~90-line section and delegates via a ~10-line caster descriptor. End state: one
  spells layout in the codebase. Rejected: 15× in-place fan-out (the tripwire this exists to prevent)
  and a full `/class-config` migration (rewrites stats/features/combat too — far beyond the ask).
- **Descriptors are not throwaway** — same shape as the `caster` field a class config needs, so this
  is a stepping stone to `/class-config`, not a detour.
- **School split stays EK-only.** Per the user: no class separates spells by school except the
  Eldritch Knight (Abj/Evo) and, when built, the Arcane Trickster (Ench/Illu). Do NOT generalize
  `restrictedSchools` to anything else — it is deliberately not expressible in a class descriptor.
- **Arcane Trickster is out of scope** (`SPELLS-ARCANE-TRICKSTER` below, flagged only).

### Caster shapes

| Kind | Sheets | Status |
|---|---|---|
| `spellbook` | Wizard (config) | ✅ pre-existing |
| `known` + school split | Eldritch Knight (config) | ✅ pre-existing |
| `prepare` | Cleric ×2, Druid ×2, Paladin ×2, Ranger 2024, Artificer (**8**) | ✅ built in T1 |
| `known` + add-picker | Bard ×2, Sorcerer ×2, Ranger 5e (**5**) | ⬜ near-clone of `known` |
| `pact` | Warlock ×2 (**2**) | ⬜ built in `SPELLS-WARLOCK-5E` |

### Preserved-intent hazards — CHECK ON EVERY CONVERSION

1. **Spell-adjacent trackers must survive.** Only these sheets keep a tracker INSIDE the spells
   section and so need the `extras` slot: **Cleric 5e + 2024** (Channel Divinity), **Sorcerer 5e +
   2024** (Sorcery Points), **Artificer** (Spell-Storing Item). Everything else — Wild Shape, Lay on
   Hands, Magical Cunning, Mystic Arcanum, Flash of Genius, Warlock pact slots — lives in the
   **Features** section and must stay there, untouched.
2. **The top-level Class/Racial/Feats toggle must remain** for characters with only racial/feat
   spells and no class spellcasting (a Fighter with Magic Initiate). Only *casters* fold.
3. **Per-sheet GM-edit gating differs** (`canEditSpellLists`, `prepared_locked`, per-sheet readOnly
   rules). Carry it through the descriptor — do not homogenize silently.
4. **Data keys are not inferable.** 5e Ranger stores a 2014 *spells-known* list under
   `prepared_spells` (2014 Rangers know spells; 2024 Rangers prepare them). The descriptor carries the
   key explicitly. Do not "fix" that data model as part of a layout conversion.
5. **Casting start level varies** (Paladin/Ranger L2, Artificer L1, Warlock L1) — descriptor's
   `startsAtLevel`; the sheets express it today as `hasCasting &&` guards.

### What T1 learned (applies to every ticket below)

- **Cleric already rendered Channel Divinity TWICE** (Features *and* Spells) before this work.
  Pre-existing and deliberately preserved — do not "clean it up" during a conversion. Expect other
  sheets to have similar pre-existing quirks; preserve, don't tidy.
- **The prepared list, and its `n/limit` label, only shows on LEVELED tabs** — the cantrip tab shows
  cantrips. Matches the Wizard/EK layout; keep it consistent rather than special-casing.
- **Async anchoring bites here.** The block renders a flat fallback until the spell catalog resolves,
  so a `findByText` on a spell name resolves against the fallback and is then torn out by the
  re-render that builds the strip. Anchor on `findByTestId('spell-level-tab-0')` first, then assert
  synchronously. Run the new test under `SLOW_MOCKS=1`.
- **Conversion recipe** (each class ticket is this, ~30 min): add a descriptor entry → delete the
  sheet's spells section + any private slot table → render `<CasterSpellBlock caster={DESCRIPTOR} …/>`
  passing `extras` if hazard 1 applies → add `gmEdit`/`raceGrantedCantrips`/`featSpells`/`featTrackers`
  to the sheet's props → drop now-unused imports → write the test.

---

## Infrastructure

### T1 — Mechanism: `kind:'prepare'` + `extras`, proven on Cleric 5e ✅

- deps: none
- scope (as built): `sheets/classSheet/CasterSpellBlock.jsx` (`prepare` kind, `extras` slot,
  descriptor-driven `listKey`/`prepareLimit`/`startsAtLevel`/`cantripPicker`);
  `classData/casterDescriptors.js` (table + `getCasterDescriptor`) — landed in `classData/`, not
  `sheets/`, to sit with the other pure-data tables and the `configContracts` validators;
  `classData/classProgressionTables.js` (exported `FULL_CASTER_SLOTS` / `HALF_CASTER_SLOTS` /
  `HALF_CASTER_SLOTS_FROM_L1` + new `PACT_MAGIC_SLOTS`); `sheets/ClericSheet.jsx`;
  `pages/CharacterDetail.jsx` (`foldSources` also true for a class with a descriptor)
- guard: `sheets/ClericSheet.test.jsx` (17 tests), green under `SLOW_MOCKS=1`; ratchet unmoved
- done: full suite green. **Still to eyeball in the running app during the Cleric QA pass.**

### T2 — Descriptor contract test ✅

- deps: T1
- scope: `classData/configContracts.js` (`validateCasterDescriptor` + `validateCasterDescriptorTable`
  + exported `CASTER_KINDS`; slot-row check accepts 9-wide full / 5-wide half / `[count, level]` pact),
  `classData/casterDescriptors.test.js` (32 tests)
- guard: walks the shipped table (contract, class names real, slots exist by `startsAtLevel`, slot
  totals non-decreasing), covers `getCasterDescriptor` (incl. **null for an unconverted class** — the
  fold switch), and feeds deliberately-broken input per the sibling fixture's convention
- done: green. Duplicate class+edition entries and malformed kinds now fail the build.

---

## Per-class conversions — do each during that class's QA pass

Each: deps T1 (+T2 recommended) · scope = that sheet + 1 descriptor entry + its test · guard = a test
asserting the strip renders AND the sheet's own trackers are untouched · done = strip visible in the
real app, class-specific behaviour unchanged.

### SPELLS-CLERIC-2024 ⬜

- `2024/ClericSheet.jsx` · `kind:'prepare'` · **needs `extras`** (Channel Divinity)
- The 5e sibling is the worked example — this should be close to a copy.

### SPELLS-DRUID-5E ⬜

- `DruidSheet.jsx` · `kind:'prepare'` · no extras (Wild Shape stays in Features)

### SPELLS-DRUID-2024 ⬜

- `2024/DruidSheet.jsx` · `kind:'prepare'` · no extras

### SPELLS-PALADIN-5E ⬜

- `PaladinSheet.jsx` · `kind:'prepare'`, `startsAtLevel: 2` · no extras (Lay on Hands stays in
  Features) · verify nothing renders below L2 (sheet uses a `hasCasting &&` guard today)

### SPELLS-PALADIN-2024 ⬜

- `2024/PaladinSheet.jsx` · `kind:'prepare'`, slots from **L1** (`HALF_CASTER_SLOTS_FROM_L1`) ·
  no extras (Lay on Hands + Channel Divinity stay in Features)

### SPELLS-RANGER-2024 ⬜

- `2024/RangerSheet.jsx` · `kind:'prepare'`, `startsAtLevel: 2` · no extras

### SPELLS-RANGER-5E ⬜

- `RangerSheet.jsx` · `kind:'known'`, **`listKey:'prepared_spells'`** — hazard 4: 2014 Rangers KNOW
  spells but this sheet stores them under the prepared key. Assert the key is unchanged in the test.
  No `ClassSpellBrowser` today; it edits the list directly.

### SPELLS-ARTIFICER-5E ⬜

- `ArtificerSheet.jsx` · `kind:'prepare'`, half-caster from **L1** · **needs `extras`**
  (Spell-Storing Item) · infusions + Flash of Genius stay in Features

### SPELLS-BARD-5E ⬜

- `BardSheet.jsx` · `kind:'known'` + add-picker · no extras

### SPELLS-BARD-2024 ⬜

- `2024/BardSheet.jsx` · `kind:'known'` + add-picker · no extras

### SPELLS-SORCERER-5E ⬜

- `SorcererSheet.jsx` · `kind:'known'` + add-picker · **needs `extras`** (Sorcery Points) ·
  `SorcererSheet.test.jsx` already asserts Sorcery Points is in Spells and not Features — that test
  is the regression guard; extend rather than replace it.

### SPELLS-SORCERER-2024 ⬜

- `2024/SorcererSheet.jsx` · `kind:'known'` + add-picker · **needs `extras`** (Sorcery Points)

### SPELLS-WARLOCK-5E ⬜  *(builds `kind:'pact'` — do before Warlock 2024)*

- `WarlockSheet.jsx` + `CasterSpellBlock.jsx`
- Pact Magic is a genuinely different slot model: all slots at ONE level, short-rest recovery,
  a scalar `pact_slots_used` rather than the `spell_slots` map. Use the exported `PACT_MAGIC_SLOTS`.
- **Render NO slot grid in the spells section** — the Warlock's Pact Magic Slots tracker lives in the
  Features section and stays there. Mystic Arcanum likewise.
- guard: extend `WarlockSheet.test.jsx`.

### SPELLS-WARLOCK-2024 ⬜

- `2024/WarlockSheet.jsx` · `kind:'pact'` · deps: `SPELLS-WARLOCK-5E` · Magical Cunning stays in
  Features

---

## Closeout (after all 14 class conversions)

### SPELLS-RETIRE-TOP-TOGGLE ⬜

- `pages/CharacterDetail.jsx` — with every sheet folding, remove the now-dead caster branch of the
  top-level Class/Racial/Feats toggle, **keeping it for racial/feat-only non-casters** (hazard 2)
- guard: `CharacterDetail.test.jsx` — a Fighter with Magic Initiate still gets the top-level toggle;
  a Cleric with the same feat gets the folded per-level toggle instead
- done: no caster shows two levels of source toggle; no non-caster loses theirs

### SPELLS-DOCS ⬜

- `docs/frontend-map.md` (per-sheet Spells-tab entries + the "Prepare-caster Spells tab" behaviours
  section + test-file listing/counts), `CLAUDE.md` if any note goes stale
- guard: full `npm test`; confirm `scripts/coverage-baseline.json` unchanged (layout work must not
  move mechanization coverage in either direction)

---

## SPELLS-ARCANE-TRICKSTER ⬜ *(flagged — its own feature, own `/grill`)*

Rogue has **no spellcasting built at all**. This is not a layout conversion; it is a vertical slice:
a `subclassCasterData.js` entry (Ench/Illu restricted known caster, both editions, third-caster
progression with per-slot school recording like `ek_spell_slots`), wiring on both hand-written Rogue
sheets, a LevelUpWizard New Spells path, and tests. The shared block's `restrictedSchools` support
(built for the EK) is what it will plug into — the only reason it appears in this file.
