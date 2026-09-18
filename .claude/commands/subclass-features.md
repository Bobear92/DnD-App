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

### CONTAINER features — the rules text is one level DEEPER than `SUBCLASS_DATA`
`SUBCLASS_DATA` is the source of truth for most features but **not for a feature that grants a POOL**.
That kind of feature only *names* the pool; every rule the player actually reads lives in the pool's own
module. Rune Carving's description says nothing but *"each rune grants a passive benefit while carved,
plus a Channel Rune effect you can invoke once per short or long rest"* — the six runes, **twelve clauses,
three of them reactions**, live in `runesData.js`. Auditing `SUBCLASS_DATA` alone audits none of them.

**This has already shipped as the same bug twice, from two different directions:**
- Storm Rune went out as a bare bonus-action counter — no active state, no reaction card — even though
  this file already carried the Channel hard rule *and used Storm as its worked example*. The rule was
  never reached, because the audit's unit was "Rune Carving": one row for twelve clauses.
- The reaction guard test in `actionEconomyData.test.js` reads the same table, so it stayed green with
  Cloud Rune's reaction card deliberately broken. (Now fixed: it has an option-pool sibling guard.)

**Before auditing, open the pool module.** If a feature's description points at a list instead of stating
a rule, *the list is the input*:

| Container feature | Where its options' real text lives |
|---|---|
| Rune Carving (Rune Knight) | `classData/runesData.js` → `RUNE_OPTIONS` (each has `passive` **and** `channel`) |
| Combat Superiority (Battle Master) | `classData/maneuversData.js` |
| Arcane Shot (Arcane Archer) | `classData/arcaneShotData.js` |
| Metamagic / Eldritch Invocations | `classData/levelChoicesData.js` |
| Any `subclassGrants` pick | that grant's own option list |
| A feat taken through a subclass | backend `seed_feats.py` `effects` — see `/feat-effects` |

The general rule, which outlives this list: **when a feature is a container, the process must look one
level below where it usually looks.** A new pool module is a new place the audit has to reach.

## Mechanism routing table (triage each mechanical clause into ONE of these)
| Feature shape | Goes to | Notes |
|---|---|---|
| **Subclass CHOICE at a level** — a proficiency (tool/skill/language), a cantrip, OR a pick from a class pool (a 2nd Fighting Style, etc.) | `subclassGrants.js` → `SUBCLASS_GRANTS[class][edition][sub]` (one model for all) | Class-agnostic; the LevelUpWizard `subclass-grants` step prompts it. Each grant has a `heldFrom` resolver + `surface` — `'sheet'` (the ClassSheet block; the default and the ONLY one rendered there) \| `'banner'` (Items proficiency banners) \| `'skills'` (Abilities & Skills) \| `'spells'` (the Spells tab's Subclass source). Student of War (tool, banner), Champion Additional Fighting Style (sheet), Arcane Archer Lore (skill + cantrip), Cavalier "Bonus Proficiency" (**split destination** — a skill OR a language, via a per-option `storeField` that `applyGrant` groups by; Samurai's identical grant is now pure data entry). |
| **Fixed proficiency** (auto-granted, no choice) | currently auto-conferred / not modeled | Rune Knight smith's tools + Giant. Flag if it needs surfacing. |
| **Rest-recharging resource pool** (uses/dice per short/long rest) | data-driven class → config `restResources` (a **`subclass` field** gates the entry to one subclass — Arcane Shot uses, proven); otherwise a **subclass panel** (`config.subclassPanels`) or tracker | Fighting Spirit, Psionic Energy dice, Giant's Might, Combat Superiority. Mirror reset in backend `_compute_rest_patch` + `getRestSummary`. Prefer the config entry — **only `BattleMasterPanel` is proven** and a new panel = flag it. |
| **Action / bonus action / reaction** | `actionEconomyData.js` → class features in `CLASS_FEATURE_ACTIONS_*`; **subclass features in `SUBCLASS_FEATURE_ACTIONS_*[class][subclass]`** (level-gated from `SUBCLASS_DATA` via `subclassFeaturesKnownAtLevel`; `resourceKey` links to a tracker) | Manifest Echo (bonus), Warding Maneuver (reaction), Weapon Bond (proven). Adding a subclass feature is data entry. An Action+Bonus **combo** (War Magic) or a rider on another entry (Arcane Charge → Action Surge) is a small curated block in `buildActionEconomy` — follow the War Magic/Charger pattern. **Recognise reactions from the text:** "you can use your reaction to …" = an entry with `tab: 'reaction'` (TWO guard tests in `actionEconomyData.test.js` now cover this: one reads `SUBCLASS_DATA`/`CLASS_FEATURES_*` **feature descriptions**, so wiring a NEW class into the curated maps immediately lists its un-carded reactions; its **option-pool sibling** reads each pool option's player-facing text — including a parenthetical cost like `Channel Rune (reaction, …)` — and checks BEHAVIOURALLY that a reaction card appears for a character holding that option. Add a new pool to that guard's `POOLS` table when you build one, or it is unguarded. Pools the tab doesn't cover yet are named in its `PENDING` list — currently Battle Master Parry + Riposte, both editions. Neither guard counts *"its Reaction"*: Commander's Strike spends an **ally's**, which is no card on this sheet.) **Recognise combos from the text, don't wait for QA:** "If/when you take (or use) the Attack action … bonus action" (2024: "after the Attack action", "when you Attack with …") is ALWAYS an **Action + Bonus combo** (`tab: 'action+bonus'` with Action/Bonus `subAttacks`), never `tab: 'bonus'`. A guard test in `actionEconomyData.test.js` fails any curated `tab:'bonus'` entry whose description matches `isAttackActionBonus`. Known un-wired instances waiting on their class: Cleric War Priest, Rogue Sudden Strike, Monk Martial Arts / Flurry of Blows / Searing Arc Strike, Battle Master Commander's Strike. |
| **"Learn N from a pool"** (cumulative, replaceable) | `levelChoicesData.js` | Metamagic, Eldritch Invocations (class-scoped); **Arcane Shot (subclass-scoped — set `subclass` on the choice)**. NOT the same as a subclass grant: cumulative knownAtLevel + replace-on-level-up + minLevel. The sheet display is the shared `KnownOptionsBlock` (owed slots, GM-Edit remove, `improvementAt`, `derived(level, scores)`) — never a new panel. Reference data (the option list + progression) goes in its own pure-data module, like `maneuversData` / `arcaneShotData`. Maneuvers keep their dedicated step. |
| **Passive ability/skill/init bonus** | `combatBonuses.js` (e.g. `remarkableAthlete` already exists) | Add a descriptor + wire the consumer (skills panel / derived row). |
| **Subclass spellcasting** (Eldritch Knight, Arcane Trickster) | `classData/subclassCasterData.js` → `SUBCLASS_CASTERS[class][edition][sub]` + `getSubclassCaster` | **Built (EK proven, both editions).** A `kind:'known'` caster: third-caster slot table + cantrips/spells-known progressions. ClassSheet resolves `config.caster ?? getSubclassCaster(...)` → CasterSpellBlock's known-caster block; LevelUpWizard adds the New Spells step (targets from the subclass progression, even when the subclass is chosen that same run); CharacterDetail `hasSpells`; backend `_compute_rest_patch` long-rest slot reset + `getRestSummary`. Arcane Trickster = data entry here + the same wiring on the hand-written Rogue sheets (flag that part). |
| **Spell grant — CHOSEN** (pick a cantrip from a pool) | a `subclassGrants` grant with `surface:'spells'` → `character_data.subclass_cantrips` | **Built (Arcane Archer Lore proven).** The Spells tab renders a **Subclass** source for it and `hasSpells` counts it, so a granted cantrip alone gives a non-caster the Spells tab. |
| **Spell grant — FIXED** (the feature just gives you a spell, incl. a LEVELED one) | a data entry in `classData/subclassSpells.js` → `getSubclassGrantedSpells()` | **Built (Psi Warrior Telekinetic Master → telekinesis at will, proven).** DERIVED from class+subclass+level, never stored — there is no pick to store. Feeds the SAME Spells-tab Subclass source as the chosen kind, and also flips `hasSpells`. Use this, not a `subclassGrants` grant, whenever the player makes no choice. A limited-use spell belongs beside its counter in a rest-resource table instead. |
| **A summoned entity with its own numbers** (an echo, a familiar, a Steel Defender, a drake) | `companions/companionData.js` → a `COMPANIONS` entry + the shared `CompanionPanel` | **Built (Echo Knight's echo proven).** Class-agnostic table: `count(level)`/`stats(level)`/`traits(level)`; a stat is a string or a `buildBreakdown` (clickable number). Rendered in the ClassSheet's subclass area with NO config entry, so any config-driven class gets it. Stateless by design — no current HP, no position, no "is it out". A companion with real hit points needs the Bestiary tie-in; flag that rather than growing this table. Export the derived number (like `echoArmorClass`) if an Action Economy card shows it too. |
| **Anything named "Channel …"** (Channel Rune, Channel Divinity) **or any use-it-and-it-lasts feature** (Giant's Might) — **HARD RULE (user)** | `effects/activeEffects.js` → an `ACTIVE_EFFECTS` entry with `resourceKey` = the feature's charge, plus `activeEffect: '<key>'` on its action-economy entry / rune `channel` | **It must get an active status AND do something while active** — a bare Use counter that spends a charge and changes nothing is a bug (QA: Channel Rune: Hill spent its charge and granted no resistance anywhere). "Does something" = a `grants` field with a real reader (`resistances` → Defenses card, `checkBonus`/`saveBonus` → skill/save numbers, `advantageAbilities`/`advantageSaves` → adv tags, `size`/`attackDie`), or a `hidden(ctx)`-gated Action Economy card that exists only while the effect runs (Storm → "Prophetic State" reaction). If no existing `grants` field fits, add one + its consumer; never ship the toggle alone. Built: Giant's Might, Channel Rune Frost/Hill/Storm. A channel that is instantaneous or lands only on the TARGET (Cloud/Fire/Stone) — ask before inventing a state. |
| **Pure rules text** (crit range, resistance, advantage on X, "can't be disarmed") | prose-only → leave as the feature description | Honest "flavor, not forgotten". Most "Improved Critical"-type features. |

## Phase 1 — Audit (always do this first, present before any code)
1. Resolve the class from the subclass name (ask if ambiguous).
2. Read `SUBCLASS_DATA[class]['5e'][sub]` and `['5.5e'][sub]`.
3. Produce a **triage table**: one row per feature × edition →
   `level | feature | edition(s) | mechanical clause(s) | → mechanism (from the table) | status`
   where status ∈ `already built` / `to build (existing mechanism)` / `NEEDS NEW MECHANISM (flag)` / `prose-only`.

   **3a. EXPAND CONTAINERS.** A feature that grants a pool gets **one row per OPTION**, never one row
   for the feature. Rune Carving is six rows, not one. Combat Superiority is one row per maneuver.
   A row that says "the player picks from a list" has triaged nothing.

   **3b. SPLIT CLAUSES — one row per clause, and a clause is anything with its OWN cost, duration,
   trigger or number.** Most options are two or more mechanics wearing one name, and a single row can
   only describe one of them. Read each option's text and cut it at every one of these:
   - a **cost** word — *action / bonus action / reaction / "in place of one attack" / no action*
   - a **duration** — *"for 1 minute", "until you are incapacitated"* → an active state, not an instant
   - a **trigger** — *"when you hit", "when a creature you can see…"*
   - a **charge** — *"once per short or long rest", "PB times per long rest"*
   - a **number** the sheet already prints — a bonus to a check, save, AC, speed, damage die

   **Two costs in one option = two rows = two surfaces.** This is the rule Storm Rune broke: its text
   is *"Channel Rune (**bonus action**): you enter a prophetic state **for 1 minute**… you can use
   **your reaction** to give that roll advantage or disadvantage."* That is a bonus action, **a duration
   (so: an active state)**, and **a reaction gated on the state** — three rows, three surfaces. Shipped
   as one row it became a single counter that did nothing. Cloud Rune is the contrasting shape: a
   passive (advantage on two skills, live while carved) **plus** a reaction — two rows, and the passive
   does **not** wait on the active half.

   Do not let the parent feature's cost stand in for an option's. And note that an option may state its
   cost as **structured data** rather than prose (a rune's `channel.cost: 'reaction'`, with the sentence
   never saying "reaction") — read the field, not only the paragraph.
4. Produce the **5e ↔ 2024 diff**: which features differ, renamed, moved level, or edition-exclusive.
   (Check `SUBCLASS_DATA`, the feature tables, and `classChoicesData.js` `SUBCLASS_*`.)
5. Cross-check what's *already* wired: grep `subclassGrants.js`, `actionEconomyData.js`,
   `levelChoicesData.js`, `config.subclassPanels`, `combatBonuses.js`, and run
   `npm run report:class-coverage` for the class's mechanized-vs-prose baseline.
   **Also open every pool module the subclass touches** (see the container table above) — and note that
   `report:class-coverage` loads the feature tables, so a container feature counts as mechanized the
   moment its pool exists, whether or not any individual option was ever wired. A green coverage number
   is not evidence about the options.
6. **Every clause row must name its CONSUMER, not just its mechanism.** A `grants` field nobody reads,
   a tracker with no surface, a chip that changes no number — these all look built and do nothing. The
   standing example: Giant's Might produced `advantageAbilities`/`advantageSaves` that *nothing* read,
   so the banner announced advantage while the skills panel was unchanged. If a row can't name the file
   that will display it, it is not `to build` — it is `NEEDS NEW MECHANISM`.

## Phase 1.5 — PROSE-ONLY NEEDS THE USER'S SIGN-OFF (HARD RULE — user)
**`prose-only` is not a status you may assign on your own.** Before anything is called complete, collect
every clause you triaged as prose-only / "flavor, not forgotten" / `note` into one short list and **show
it to the user for a decision.** Never fold it into a summary as done.

This is the escape hatch that hides missed mechanics, and it has: Shield Master's Interpose Shield was
"prose", Sentinel's opportunity-attack clauses were "a display-only note", Storm Rune's whole reaction
was inside a blurb. Each looked like an honest limitation and each was a mechanic the app could model.

Present each as one line: **`feature › clause` — what it would take, and why it's not being built now.**
The *why* must name the missing model, not just assert difficulty. Good reasons look like:
- *no model exists for it* — no surprise state (Storm's "can't be surprised"), no distance-to-target
  (cover clauses), no concentration/duration, no tool-check number, no mount entity, no target at all
- *it lands only on the TARGET, not the character* — nothing on this sheet changes
- *it needs a choice the app never persists*

Not acceptable as a reason: "it's just flavor", "it's narrative", "can't be computed" with nothing named.
If you can't name the missing model, it is probably mechanizable and you haven't found the surface yet.

Say plainly in the list which ones you think are genuinely un-modelable versus which are **deferred**
(buildable, just not now) — the user may disagree with either, which is the entire point of showing them.

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
- **A passive half never waits on an active half.** When one option has both (Storm Rune: Arcana advantage
  *and* a prophetic state; Cloud Rune: two skills *and* a reaction), check what actually gates each. The
  passive is gated on the feature being HELD — for a rune, carved onto an **equipped** item — not on any
  toggle. Tying them together tells a player they have nothing until they spend a charge, which is worse
  than an empty sheet. Write the test in the "off" direction: the passive holds with the state OFF.
- **Un-narrated gates.** If a surface is `hidden()` behind state the player hasn't set up yet (a rune not
  yet carved, an effect not switched on), nothing is visibly wrong and nothing is visibly right either —
  which is exactly when "it's built" goes untested. Say plainly what has to be true for it to appear.

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
- **Don't audit a container feature as one row.** "Rune Carving → a pool of runes" triages nothing. Expand
  to one row per option, then split each option at every cost/duration/trigger/charge/number (Phase 1.3a-b).
- **Don't report the pass complete with prose-only rows unshown.** They go to the user as their own list,
  with a named missing model each (Phase 1.5). "Flagged as narrative" inside a paragraph is not showing it.
- **Don't treat a green test suite as coverage of a pool.** Both the reaction guard and the coverage report
  historically read only feature tables, so every rune's rules text was unscanned while the suite passed.
  Before trusting a guard, check which table it reads and whether the text you care about is in it.

## Arguments
$ARGUMENTS
