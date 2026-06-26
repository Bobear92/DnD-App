---
description: Audit a subclass's features (both editions), triage which need real mechanics vs. prose, then build + QA them. Front-loads the discovery that otherwise happens feature-by-feature.
---

Given a **subclass name**, do the full loop: read every feature for BOTH editions, triage each one
into an *existing* mechanism (or flag that none fits), get the plan approved, then build + QA one
mechanic at a time. Argument: a subclass name (e.g. `Battle Master`, `Echo Knight`, `Circle of the Moon`).

**Why this skill exists:** subclass features land in the app as flavor text first. The recurring pain is
discovering the mechanical gaps *reactively*, one feature at a time, mid-conversation. This skill
front-loads the audit so the whole worklist is visible before any code is written.

**Status / the hard rule:** subclass mechanics are **spread across a few mechanisms** (table below).
The level-up *choice* kinds are now consolidated into `subclassGrants.js` (proficiency picks + class-pool
picks); interactive resource panels still each need their own component (`BattleMasterPanel` is the only
proven one). **Proven so far: Battle Master + Champion (Fighter).** So: triage each feature into a
mechanism that already exists. When a feature fits *nothing*, **STOP and flag it** — propose a new shared
mechanism and get a decision. Do **not** fork another bespoke per-subclass panel just to ship a feature
(that's the breadth-before-vertical / skill-as-band-aid tripwire in CLAUDE.md — the 24×-rework trap). When
two mechanisms start looking near-identical, flag the consolidation **while few consumers are wired** —
that's exactly how `subclassProficiencyData` + `subclassLevelChoices` became `subclassGrants`.

## The input: where the feature text lives
`frontend/src/characters/components/subclassData/<class>.js` →
`SUBCLASS_DATA[ClassName][edition][SubclassName] = { flavorText, features: [{level, name, description}] }`
(edition keys: `'5e'` and `'5.5e'`). This is the source of truth for the audit. If the subclass name
maps to more than one class, or you can't find it, ask the user which class. A subclass may exist in only
one edition — note that in the diff.

## Mechanism routing table (triage each mechanical clause into ONE of these)
| Feature shape | Goes to | Notes |
|---|---|---|
| **Subclass CHOICE at a level** — a proficiency (tool/skill/language) OR a pick from a class pool (a 2nd Fighting Style, etc.) | `subclassGrants.js` → `SUBCLASS_GRANTS[class][edition][sub]` (one model for both) | Class-agnostic; the LevelUpWizard `subclass-grants` step prompts it. Each grant has a `heldFrom` resolver + `surface:'sheet'\|'banner'`. Student of War (tool, banner), Champion Additional Fighting Style (sheet), Cavalier/Samurai "Bonus Proficiency". |
| **Fixed proficiency** (auto-granted, no choice) | currently auto-conferred / not modeled | Rune Knight smith's tools + Giant. Flag if it needs surfacing. |
| **Rest-recharging resource pool** (uses/dice per short/long rest) | data-driven class → config `restResources`; otherwise a **subclass panel** (`config.subclassPanels`) or tracker | Fighting Spirit, Arcane Shot uses, Psionic Energy dice, Giant's Might, Combat Superiority. Mirror reset in backend `_compute_rest_patch` + `getRestSummary`. **Only `BattleMasterPanel` is proven** — a new panel = flag it. |
| **Action / bonus action / reaction** | `actionEconomyData.js` → `CLASS_FEATURE_ACTIONS_*` (keyed by feature name; `resourceKey` links to a tracker) | Manifest Echo (bonus), Warding Maneuver (reaction), Telekinetic Movement. Currently Fighter-only — adding a subclass feature here is data entry. |
| **"Learn N from a *class-wide* pool"** (class-scoped, cumulative) | `levelChoicesData.js` | Metamagic, Eldritch Invocations. NOT the same as a subclass grant — class-scoped + cumulative knownAtLevel + replace + minLevel. Maneuvers have their own dedicated step. |
| **Passive ability/skill/init bonus** | `combatBonuses.js` (e.g. `remarkableAthlete` already exists) | Add a descriptor + wire the consumer (skills panel / derived row). |
| **Subclass spellcasting** (Eldritch Knight, Arcane Trickster) | the caster block / config `caster` | **Large** — flag as its own effort, don't fold into a multi-feature pass. |
| **Spell grant** (learn a specific cantrip/spell) | mirror the feat `spell_grant` pattern (`featEffects.js`) | Arcane Archer's cantrip. Flag if no consumer exists. |
| **Pure rules text** (crit range, resistance, advantage on X, "can't be disarmed") | prose-only → leave as the feature description | Honest "flavor, not forgotten". Most "Improved Critical"-type features. |

## Phase 1 — Audit (always do this first, present before any code)
1. Resolve the class from the subclass name (ask if ambiguous).
2. Read `SUBCLASS_DATA[class]['5e'][sub]` and `['5.5e'][sub]`.
3. Produce a **triage table**: one row per feature × edition →
   `level | feature | edition(s) | mechanical clause(s) | → mechanism (from the table) | status`
   where status ∈ `already built` / `to build (existing mechanism)` / `NEEDS NEW MECHANISM (flag)` / `prose-only`.
4. Produce the **5e ↔ 2024 diff**: which features differ, renamed, moved level, or edition-exclusive.
   (Check `SUBCLASS_DATA`, the feature tables, and `classChoicesData.js` `SUBCLASS_*`.)
5. Cross-check what's *already* wired: grep `subclassGrants.js`, `actionEconomyData.js`,
   `levelChoicesData.js`, `config.subclassPanels`, `combatBonuses.js`, and run
   `npm run report:class-coverage` for the class's mechanized-vs-prose baseline.

## Phase 2 — Plan (CLAUDE.md plan-first rule: ≥3 files = state the plan)
List, per to-build feature: which file(s) change, which mechanism, which tests, which CLAUDE.md sections.
**Surface every `NEEDS NEW MECHANISM` row explicitly** and get a decision before building it. Then proceed.

## Phase 3 — Build + QA (one mechanic at a time)
For each approved feature:
1. Author into the mechanism (data entry where possible; build the consumer in the same change — never
   ship a tracker/chip that does nothing).
2. **Snapshot pattern** for choices made at level-up (proficiency picks, learned options): mirror the
   inventory/feat-snapshot model — store the picked value onto `character_data` so consumers resolve
   synchronously. Acquisition step is the LevelUpWizard (+ creation where relevant).
3. If a resource recharges on rest: **backend** `_compute_rest_patch` (`players/characters/service.py`) +
   `getRestSummary` (`CharacterList.jsx`) — both, or rest looks like it "restores" an un-persisted value.
4. Write/extend tests alongside (mandatory — backend pytest + frontend Vitest). Run them. QA the feature
   in isolation before moving to the next.

### Interaction-nuance checklist (probe these during QA — the Phase 1 audit usually misses them)
The triage table tells you *what* to mechanize; these are the RAW edges + cross-feature couplings that the
audit can't see from a subclass's own feature list, and that otherwise surface only mid-build (they're what
the Battle Master QA actually turned up):
- **Replace-on-level-up:** does the feature let the player *swap* a previously-chosen option when leveling
  (maneuvers at 7/10/15, invocations, metamagic)? Use the `ReplaceOneSelect` pattern, not add-only.
- **Owed / under-filled slots + locking:** a character who knows fewer than they should (pre-feature, GM
  import) can fill owed slots; chosen options lock outside creation; GM Edit (`gmEdit`) unlocks a swap.
- **Cross-feature interactions:** does a **feat** or **another feature** feed the *same* pool/resource?
  (Martial Adept folds +die/+maneuvers into Combat Superiority; a fighting style, racial trait, or item may
  stack.) These are invisible from the subclass's own feature text — grep the resource key across
  `featEffects.js`, other configs, and `actionEconomyData.js` before calling a pool "done".
- **Level-keyed vs name-keyed scaling:** when a feature is renamed across editions but only its numbers
  change (Improved → Ultimate Combat Superiority), key the logic on level, not feature name.
- **RAW vs loose prose:** the feature *description* may be imprecise (e.g. "dice equal to your proficiency
  bonus" when RAW is a fixed 4/5/6 table). Implement RAW; don't transcribe the blurb.

## Run tests
```bash
cd frontend && npm test -- --run
cd backend && source venv/Scripts/activate && pytest -q     # if any .py changed
```
Restart uvicorn after any `.py` change (`bash scripts/restart-backend.sh`) — stale workers serve old
rest logic. Re-run `npm run report:class-coverage` to confirm the mechanized count moved.

## Update CLAUDE.md
Reflect each newly-mechanized subclass feature in the relevant frontend section (subclass panels /
`subclassGrants` / `actionEconomyData` / `levelChoicesData` listing), the test listing + counts,
and the "Frontend Not Yet Built" subclass/action-economy bullets.

## Don't
- Don't build a new per-subclass JSX panel pattern without flagging it — `BattleMasterPanel` is the only
  proven one; a second one may signal the need for a consolidated model (raise it).
- Don't copy 5e mechanics to 2024 blind — features get renamed, moved levels, or reworked (Champion's
  Remarkable Athlete is a different feature in each edition).
- Don't re-introduce anything a previous pass deliberately left prose-only without saying why.

## Arguments
$ARGUMENTS
