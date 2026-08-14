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
picks + skill/cantrip grants); a subclass **option pool** is a `subclassGrants` sibling in `levelChoicesData.js`
(a choice with a `subclass` field), displayed by the shared, pool-agnostic `KnownOptionsBlock` — reach for
that before writing JSX. Only a genuinely *interactive* panel still needs its own component, and
`BattleMasterPanel` remains the only one — note that `CompanionPanel` is NOT a counter-example: it is
data-driven off `companionData.js` and registered nowhere, so it serves every subclass at once.
**Proven so far: Battle Master + Champion + Eldritch Knight + Arcane Archer + Cavalier + Echo Knight
(Fighter).** So: triage each feature into a
mechanism that already exists. When a feature fits *nothing*, **STOP and flag it** — propose a new shared
mechanism and get a decision. Do **not** fork another bespoke per-subclass panel just to ship a feature
(that's the breadth-before-vertical / skill-as-band-aid tripwire in CLAUDE.md — the 24×-rework trap). When
two mechanisms start looking near-identical, flag the consolidation **while few consumers are wired** —
that's exactly how `subclassProficiencyData` + `subclassLevelChoices` became `subclassGrants`.

## The input: where the feature text lives
`frontend/src/characters/components/classData/subclassData/<class>.js` →
`SUBCLASS_DATA[ClassName][edition][SubclassName] = { flavorText, features: [{level, name, description}] }`
(edition keys: `'5e'` and `'5.5e'`). This is the source of truth for the audit. If the subclass name
maps to more than one class, or you can't find it, ask the user which class. A subclass may exist in only
one edition — note that in the diff.

## Mechanism routing table (triage each mechanical clause into ONE of these)
| Feature shape | Goes to | Notes |
|---|---|---|
| **Subclass CHOICE at a level** — a proficiency (tool/skill/language), a cantrip, OR a pick from a class pool (a 2nd Fighting Style, etc.) | `subclassGrants.js` → `SUBCLASS_GRANTS[class][edition][sub]` (one model for all) | Class-agnostic; the LevelUpWizard `subclass-grants` step prompts it. Each grant has a `heldFrom` resolver + `surface` — `'sheet'` (the ClassSheet block; the default and the ONLY one rendered there) \| `'banner'` (Items proficiency banners) \| `'skills'` (Abilities & Skills) \| `'spells'` (the Spells tab's Subclass source). Student of War (tool, banner), Champion Additional Fighting Style (sheet), Arcane Archer Lore (skill + cantrip), Cavalier "Bonus Proficiency" (**split destination** — a skill OR a language, via a per-option `storeField` that `applyGrant` groups by; Samurai's identical grant is now pure data entry). |
| **Fixed proficiency** (auto-granted, no choice) | currently auto-conferred / not modeled | Rune Knight smith's tools + Giant. Flag if it needs surfacing. |
| **Rest-recharging resource pool** (uses/dice per short/long rest) | data-driven class → config `restResources` (a **`subclass` field** gates the entry to one subclass — Arcane Shot uses, proven); otherwise a **subclass panel** (`config.subclassPanels`) or tracker | Fighting Spirit, Psionic Energy dice, Giant's Might, Combat Superiority. Mirror reset in backend `_compute_rest_patch` + `getRestSummary`. Prefer the config entry — **only `BattleMasterPanel` is proven** and a new panel = flag it. |
| **Action / bonus action / reaction** | `actionEconomyData.js` → class features in `CLASS_FEATURE_ACTIONS_*`; **subclass features in `SUBCLASS_FEATURE_ACTIONS_*[class][subclass]`** (level-gated from `SUBCLASS_DATA` via `subclassFeaturesKnownAtLevel`; `resourceKey` links to a tracker) | Manifest Echo (bonus), Warding Maneuver (reaction), Weapon Bond (proven). Adding a subclass feature is data entry. An Action+Bonus **combo** (War Magic) or a rider on another entry (Arcane Charge → Action Surge) is a small curated block in `buildActionEconomy` — follow the War Magic/Charger pattern. |
| **"Learn N from a pool"** (cumulative, replaceable) | `levelChoicesData.js` | Metamagic, Eldritch Invocations (class-scoped); **Arcane Shot (subclass-scoped — set `subclass` on the choice)**. NOT the same as a subclass grant: cumulative knownAtLevel + replace-on-level-up + minLevel. The sheet display is the shared `KnownOptionsBlock` (owed slots, GM-Edit remove, `improvementAt`, `derived(level, scores)`) — never a new panel. Reference data (the option list + progression) goes in its own pure-data module, like `maneuversData` / `arcaneShotData`. Maneuvers keep their dedicated step. |
| **Passive ability/skill/init bonus** | `combatBonuses.js` (e.g. `remarkableAthlete` already exists) | Add a descriptor + wire the consumer (skills panel / derived row). |
| **Subclass spellcasting** (Eldritch Knight, Arcane Trickster) | `classData/subclassCasterData.js` → `SUBCLASS_CASTERS[class][edition][sub]` + `getSubclassCaster` | **Built (EK proven, both editions).** A `kind:'known'` caster: third-caster slot table + cantrips/spells-known progressions. ClassSheet resolves `config.caster ?? getSubclassCaster(...)` → CasterSpellBlock's known-caster block; LevelUpWizard adds the New Spells step (targets from the subclass progression, even when the subclass is chosen that same run); CharacterDetail `hasSpells`; backend `_compute_rest_patch` long-rest slot reset + `getRestSummary`. Arcane Trickster = data entry here + the same wiring on the hand-written Rogue sheets (flag that part). |
| **Spell grant** (learn a specific cantrip/spell) | a `subclassGrants` grant with `surface:'spells'` → `character_data.subclass_cantrips` | **Built (Arcane Archer Lore proven).** The Spells tab renders a **Subclass** source for it and `hasSpells` counts it, so a granted cantrip alone gives a non-caster the Spells tab. A *leveled* spell grant has no consumer yet — flag that. |
| **A summoned entity with its own numbers** (an echo, a familiar, a Steel Defender, a drake) | `companions/companionData.js` → a `COMPANIONS` entry + the shared `CompanionPanel` | **Built (Echo Knight's echo proven).** Class-agnostic table: `count(level)`/`stats(level)`/`traits(level)`; a stat is a string or a `buildBreakdown` (clickable number). Rendered in the ClassSheet's subclass area with NO config entry, so any config-driven class gets it. Stateless by design — no current HP, no position, no "is it out". A companion with real hit points needs the Bestiary tie-in; flag that rather than growing this table. Export the derived number (like `echoArmorClass`) if an Action Economy card shows it too. |
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
