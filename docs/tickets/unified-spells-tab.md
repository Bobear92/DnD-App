# Unified Spells tab — ticket worklist

**Goal:** every caster character's Spells tab renders through the one shared layout — a single level
strip (Cantrips · 1st · 2nd …) spanning sources, with a per-level Class / Racial / Feats source
toggle — instead of 15 hand-rolled spells sections.
**Source list:** filesystem enumeration of `characters/components/sheets/*.jsx` + `2024/*.jsx` with a
spells section (15 sheets); no coverage report enumerates this because it is layout, not mechanization.
**Status:** 1/9 done (T1 landed — the mechanism is proven; T2 onward is the remaining work).

## Decisions (from `/grill` — GO, consolidation-first)

- **Route: shared spells section.** Extend `CasterSpellBlock` (already the spells section for
  config-driven casters) with the missing caster *kinds* + an `extras` slot. Each hand-written sheet
  then DELETES its ~90-line section and delegates via a ~10-line caster descriptor. End state: one
  spells layout in the codebase. Rejected: 15× in-place fan-out (the tripwire this exists to prevent)
  and a full `/class-config` migration (rewrites stats/features/combat too — far beyond the ask).
- **Descriptors are not throwaway** — they are the same shape as the `caster` field a future class
  config needs, so this is a stepping stone to `/class-config`, not a detour.
- **School split stays EK-only.** Per the user: no class separates spells by school except the
  Eldritch Knight (Abj/Evo) and, when built, the Arcane Trickster (Ench/Illu). Do NOT generalize
  `restrictedSchools` to anything else.
- **Arcane Trickster is out of scope** (T-AT below, flagged only). Rogue has no spellcasting built at
  all; that is its own vertical slice.

### Caster shapes (the whole unit list)

| Kind | Sheets | Covered before this work |
|---|---|---|
| `spellbook` (prepare from spellbook) | Wizard (config) | ✅ `CasterSpellBlock` |
| `known` + school split | Eldritch Knight (config) | ✅ `kind:'known'` |
| `prepare` (prepare from full class list) | Cleric ×2, Druid ×2, Paladin ×2, Ranger 2024, Artificer (**8**) | ❌ — built in T1 |
| `known` + add-picker | Bard ×2, Sorcerer ×2, Ranger 5e (**5**) | ~ near-clone of `known` |
| `pact` (pact magic slots) | Warlock ×2 (**2**) | ❌ — built in T2 |

### Preserved-intent hazards (verify on EVERY conversion)

1. **Spell-adjacent trackers must survive.** Only these 5 sheets keep a tracker INSIDE the spells
   section (the rest — Wild Shape, Lay on Hands, Magical Cunning, Mystic Arcanum, Flash of Genius —
   live in the Features section and must stay there, untouched):
   Cleric 5e + 2024 (Channel Divinity), Sorcerer 5e + 2024 (Sorcery Points), Artificer (Spell-Storing Item).
2. **The top-level Class/Racial/Feats toggle must remain** for characters with only racial/feat
   spells and no class spellcasting (e.g. a Fighter with Magic Initiate). Only *casters* fold.
3. **Per-sheet GM-edit gating differs** (`canEditSpellLists`, `locked`/`prepared_locked`, per-sheet
   readOnly rules). Carry it through the descriptor — do not homogenize silently.
4. **Data keys are not inferable.** 5e Ranger stores a 2014 *spells-known* list under
   `prepared_spells` (2014 Rangers know spells; 2024 Rangers prepare them). The descriptor carries the
   key explicitly. Do not "fix" the 5e Ranger data model in this work — flag it (see T6).
5. **Casting start level varies** (Paladin/Ranger start at L2, Artificer L1, Warlock L1). Descriptor
   carries it; sheets currently express it as `hasCasting &&` guards.

---

## T1 — Vertical slice: `kind:'prepare'` + `extras`, proven on Cleric 5e  ✅
- deps: none
- scope (as built): `sheets/classSheet/CasterSpellBlock.jsx` (`prepare` kind, `extras` render slot,
  descriptor-driven `listKey`/`prepareLimit`/`startsAtLevel`/`cantripPicker`),
  `classData/casterDescriptors.js` (table + `getCasterDescriptor`) — note: landed in `classData/`,
  not `sheets/`, to sit with the other pure-data tables (`subclassCasterData`, `levelChoicesData`)
  and the `configContracts` validators; `classData/classProgressionTables.js` (exported the shared
  `FULL_CASTER_SLOTS` / `HALF_CASTER_SLOTS` / `HALF_CASTER_SLOTS_FROM_L1` / new `PACT_MAGIC_SLOTS`);
  `sheets/ClericSheet.jsx` (deleted its ~65-line spells section + its private copy of the full-caster
  slot table → delegates); `pages/CharacterDetail.jsx` (`foldSources` now also true for a class with
  a descriptor — the mechanism that makes every later conversion pure data entry)
- guard: new `sheets/ClericSheet.test.jsx` (17 tests) — strip renders per level with counts, tab
  switching filters the prepared list, racial + feat spells fold in as a per-level source toggle,
  Channel Divinity survives in the spells section, prepare limit, browser on the Prepare sub-tab,
  player-vs-GM slot controls, section routing. Passes under `SLOW_MOCKS=1`. Ratchet: unmoved.
- done: full suite green (2172). **Not yet eyeballed in the running app** — do that before T4+.

### What T1 learned (feeds the rest)
- **Channel Divinity was already rendered TWICE** (Features *and* Spells) before this work. That is
  pre-existing and was deliberately preserved — do not "clean it up" during a conversion.
- **The Warlock's Pact Magic Slots tracker lives in the FEATURES section**, so `kind:'pact'` must NOT
  render a slot grid in the spells section; the tracker stays where it is (T2).
- **The prepared list, and so its `n/limit` label, only shows on LEVELED tabs** — the cantrip tab
  shows cantrips. Matches the Wizard/EK layout; keep it consistent rather than special-casing.
- **Async anchoring bites here**: the block renders a flat fallback until the spell catalog resolves,
  so a `findByText` on a spell name resolves against the fallback and is then torn out by the
  re-render. Anchor on `findByTestId('spell-level-tab-0')` first, then assert synchronously.

## T2 — `kind:'pact'`, proven on Warlock 5e  ⬜
- deps: T1
- scope: `CasterSpellBlock.jsx` (pact slot model — all slots one level, short-rest recovery, casting
  decrements the scalar `pact_slots_used` rather than the `spell_slots` map, and renders NO slot grid
  since the Warlock's tracker lives in the Features section), `casterDescriptors.js` (+1 entry, using
  the already-exported `PACT_MAGIC_SLOTS`), `sheets/WarlockSheet.jsx`
- guard: extend existing `sheets/WarlockSheet.test.jsx` — strip renders, pact slot tracker intact
  (count + level + short-rest note), Mystic Arcanum note still in the **Features** section
- done: a L5 Warlock shows 2 × level-3 pact slots, casts from them, and the strip groups known spells
  by level; short-rest recovery unchanged.

## T3 — Descriptor contract test  ⬜
- deps: T2
- scope: `sheets/casterDescriptors.test.js` (mirrors `classSheet/configs/configContracts.test.js`)
- guard: is itself the guard — every descriptor has a known `kind`, a `spellList` matching a real
  class name, a data key the sheet actually writes, and level-gates that are numbers. Fails the build
  if entry #13 is malformed.
- done: `npm test` fails when a deliberately-broken descriptor is added, passes when reverted.

## T4 — Replication: remaining `prepare` casters  ⬜
- deps: T3
- scope: `2024/ClericSheet.jsx`, `DruidSheet.jsx`, `2024/DruidSheet.jsx`, `PaladinSheet.jsx`,
  `2024/PaladinSheet.jsx`, `2024/RangerSheet.jsx` + 6 descriptor entries
- guard: one test per converted sheet (strip renders + the sheet's Features-section trackers are
  untouched); 2024 Cleric additionally asserts its Channel Divinity extras slot
- done: all 6 show the unified strip; Paladin/Ranger still show nothing before their casting level.

## T5 — Replication: Artificer (prepare + Spell-Storing Item extras)  ⬜
- deps: T3
- scope: `ArtificerSheet.jsx` + 1 descriptor entry
- guard: `sheets/ArtificerSheet.test.jsx` — strip renders AND Spell-Storing Item survives in the
  spells section; infusions + Flash of Genius remain in Features
- done: half-caster progression from L1 intact under the strip.

## T6 — Replication: `known` + add-picker casters  ⬜
- deps: T3
- scope: `SorcererSheet.jsx`, `2024/SorcererSheet.jsx`, `BardSheet.jsx`, `2024/BardSheet.jsx`,
  `RangerSheet.jsx` (5e) + 5 descriptor entries
- guard: extend `SorcererSheet.test.jsx` (+ new Bard/Ranger tests) — strip renders, **Sorcery Points
  tracker survives inside the spells section** for both Sorcerers. 5e Ranger: assert it still reads
  and writes `prepared_spells` (hazard 4 — no data migration in this ticket).
- done: all 5 show the strip; the add-picker still respects max castable level and GM-edit gating.

## T7 — Replication: Warlock 2024  ⬜
- deps: T2, T3
- scope: `2024/WarlockSheet.jsx` + 1 descriptor entry
- guard: test asserting the strip renders and Magical Cunning stays in the Features section
- done: 2024 pact caster matches 5e Warlock behaviour under the strip.

## T8 — Retire the per-caster top-level source toggle  ⬜
- deps: T4, T5, T6, T7
- scope: `pages/CharacterDetail.jsx` — with all 15 sheets folding, remove the now-dead caster branch
  of the top-level Class/Racial/Feats toggle, KEEPING it for racial/feat-only non-casters (hazard 2)
- guard: `CharacterDetail.test.jsx` — a Fighter with Magic Initiate still gets the top-level toggle;
  a Cleric with the same feat gets the folded per-level toggle instead
- done: no caster shows two levels of source toggle; no non-caster loses theirs.

## T9 — Docs + ratchet audit  ⬜
- deps: T8
- scope: `docs/frontend-map.md` (15 per-sheet Spells-tab entries + the "Prepare-caster Spells tab"
  behaviours section + test-file listing/counts), `CLAUDE.md` (drop the "hand-written caster sheets
  don't use the strip yet" note in Frontend Not Yet Built)
- guard: full `npm test` + confirm `scripts/coverage-baseline.json` is unchanged (layout work must
  not move mechanization coverage in either direction)
- done: worklist fully checked; docs describe one spells layout, not 15.

---

## T-AT — Arcane Trickster spellcasting  ⬜ *(flagged, NOT part of this feature's done criteria)*
Rogue has no spellcasting built. Needs: a `subclassCasterData.js` entry (Ench/Illu restricted known
caster, both editions, third-caster progression + per-slot school recording like `ek_spell_slots`),
wiring on the two hand-written Rogue sheets, a LevelUpWizard New Spells path, and tests. The shared
component's `restrictedSchools` support (built for the EK) is what it will plug into — that is the
only reason it is mentioned here. Own `/grill` before starting.
