---
description: Author or extend feat mechanical effects (the data-driven feat-effects model) — turn a feat's rules text into real mechanics instead of a description card
---

Work with the **feat-effects model**: feats carry a structured `effects` JSON array that the app
resolves into actual mechanics (initiative, ability scores, Action Economy entries, …) instead of
just a description card. Argument: a feat (or batch of feats) to mechanize, or a new effect kind to
support. This is the recurring authoring procedure — 5e feats now, 2024 feats + GM homebrew later.

**Status:** 5e Alert + Tavern Brawler are fully wired (vertical slice). The rest are prose-only —
run `python report_feat_effects.py` (in `backend/`, venv active) for the current mechanized-vs-prose
worklist (5e 26/41, 2024 48/73). Both editions are authored (`FEAT_EFFECTS_5E` / `FEAT_EFFECTS_2024`)
per their own rules — **don't copy 2014 effects to 2024** (Alert, Observant, Origin-feat ASIs differ).

## Where things live
- **Backend** `players/feats/models.py` → `effects` JSON column (nullable). `schemas.py` carries it on
  Create/Update/Response/ListItem. `service.py` persists it (create maps it; update via `exclude_unset`).
- **Authoring** `backend/seed_feats.py` → `FEAT_EFFECTS_5E` (and add `FEAT_EFFECTS_2024`) maps feat name →
  effects list. `_seed_list` backfills them idempotently. Run `python seed_feats.py` then
  `python report_feat_effects.py`.
- **Resolver** `frontend/src/characters/components/feats/featEffects.js` — one helper per kind
  (`getFeatStatMods`, `getFeatActions`, `getFeatUnarmedDice`, `featAbilityChoices`,
  `featFixedAbilityScores`, `isMechanized`). Add a helper here when you add a kind.
- **Snapshot at acquisition** — `LevelUpWizard.jsx` and `CharacterCreate.jsx` (Variant Human) copy the
  picked feat's `effects` (and any choice) onto `character_data.feats[i]` so consumers resolve
  synchronously (inventory-snapshot pattern). Shape: `{id, name, level, effects?, choices?}`.
- **Coverage tool** `backend/report_feat_effects.py` — per-edition mechanized vs prose-only.

## Effect-kind taxonomy + consumer status
Each effect is `{ kind, …, label? }`. `label` is the chip text in the Feats sub-tab (auto-derived if omitted).

| kind | shape | consumer | status |
|------|-------|----------|--------|
| `stat_mod` | `{stat, amount}` | `getFeatStatMods(feats, stat, {pb})` | **wired**: initiative (CharacterDetail derived row); `passive_perception` / `passive_investigation` / `passive_insight` (the Abilities & Skills **Passive Scores** row via `skills/passiveSkills.js` — adding a new passive stat means adding an entry to `PASSIVE_SKILLS`); speed folds into CombatBlock's Total Speed for data-driven sheets + a CharacterDetail annotation for hand-written ones (suppressed where `getClassConfig` finds a config). `amount: 'pb'` scales with the proficiency bonus (2024 Alert). |
| `ac_mod` | `{amount?, condition:'armor'\|'two_melee_weapons'\|'medium_armor_dex_cap', dex_cap?}` | `getFeatAcMods` → evaluated in `computeArmorClass` | **wired**. Conditional AC: Defense (+1 in armor), Dual Wielder (+1 with two melee weapons), Medium Armor Master (medium DEX cap → `dex_cap`). |
| `ability_score` | `{ability, amount}` | folded into level-up score updates | **wired** (LevelUpWizard). Variant-Human-creation path: TODO. |
| `ability_choice` | `{abilities:[...], amount}` | acquisition chooser → score | **wired in LevelUpWizard** (`feat-ability-{stat}`). Variant Human creation: TODO. |
| `attack_mod` | `{target:'unarmed', dice}` | `getFeatUnarmedDice` → Action Economy unarmed row | **unarmed wired**. Weapon to-hit/damage riders now have a consumer in `inventoryData` `computeAttack`/`getAttacks` (`styles` arg, used today by the fighting-style helper `combat/fightingStyles.js` — Archery/Dueling/Thrown/Defense); a feat weapon bonus would plug in the same way. |
| `action` | `{name, economy, description, trigger}` | `getFeatActions` → Action Economy bucket | **wired**. `economy` ∈ `no_action\|action\|bonus\|action+bonus\|reaction`. |
| `resource` | `{key, label, total, recharge:'short'\|'long'}` | FeatsSubTab tracker (RestResourceControl) + backend `_compute_rest_patch` reset + `getRestSummary` | **wired** (Lucky, Martial Adept). `total: 'pb'` scales with the proficiency bonus (2024 Lucky). |
| `proficiency` | `{prof_type:'skill'\|'tool'\|'weapon'\|'armor'\|'language'\|'saving_throw'\|'skill_or_tool', items?:[...], count?}` | banners / skills / saves / languages | **wired**. Fixed `items` grants → `featEffects.getFeatProficiencyGrants` (banners). `saving_throw` (Resilient) → saves display. **count-choice** (`count`, no items: Skilled/Linguist/Weapon Master) → `featProficiencyData.js` pickers in the LevelUpWizard feat step + Variant Human creation; picks stored in skill_proficiencies / feat_tool_proficiencies / feat_languages / feat_weapon_proficiencies. |
| `expertise` | `{count}` | skills panel (purple) via `expertise_skills` | **wired**. `featProficiencyData` builds a count-choice grant whose pool is the character's proficient skills (incl. one picked from the same feat); routed to `expertise_skills`. Skill Expert. |
| `spell_grant` | `{source_kind, cantrips, leveled, fixed?, school?, ritual?, free_cast?, ability}` | `FeatSpellGrantPicker` (acquisition) → `choices.spell_grant`; `getFeatGrantedSpells` → Spells-tab Feats section | **wired** (Magic Initiate, Spell Sniper, Telekinetic, Telepathic, Fey/Shadow Touched, Ritual Caster). See the spell-grant section below. |
| `maneuver_grant` | `{count, die}` | `FeatManeuverPicker` (acquisition) → `choices.maneuvers`; `getManeuverGrantSpec`/`getFeatManeuvers`/`martialAdeptDieCount`/`martialAdeptManeuverCount` | **wired** (Martial Adept). Pick N Battle Master maneuvers (excluding already-known) + a `die`. A Battle Master folds the +1 die + N maneuvers into the shared Combat Superiority pool (`BattleMasterPanel`, picks merged into `character_data.maneuvers`); a non-Battle-Master gets a standalone d6 (a paired `resource` effect, `martial_adept_superiority`, short-rest) + the maneuvers shown in the `FeatsSubTab` panel. |
| `note` | `{text}` | shown via the description (not a chip) | **wired** — use for rules we can't mechanize yet (advantage on X, ignore difficult terrain, can't be surprised). Honest "flavor, not forgotten". |

**Special case — Tough:** `+2 HP/level` is already handled by `combatBonuses.hasToughFeat` (reads `character_data.feats` by name). Don't add an HP `stat_mod` for it (double-count); give it a `note`.

## Authoring decision tree (per feat)
1. Read the feat's `description` in `seed_feats.py`.
2. For each mechanical clause: does it map to a **supported** kind? → author it.
3. Maps to a kind that **needs a consumer**? → author the effect AND build the consumer (below) in the same change — never ship a chip that silently does nothing.
4. Purely descriptive / not yet modelable? → `note`.
5. Half-feat (grants a +1 ability *and* a benefit)? → an `ability_score` or `ability_choice` **plus** the benefit effects.

## Workflow A — mechanize feats (data)
1. Add entries to `FEAT_EFFECTS_5E` in `seed_feats.py`.
2. `cd backend && source venv/Scripts/activate && python seed_feats.py && python report_feat_effects.py`.
3. The Feats sub-tab shows chips immediately. Add/extend `featEffects.test.js` + a backend
   `TestFeatEffects` round-trip if a new shape is introduced.

## Workflow B — add a new effect-kind consumer
1. Add a resolver helper in `featEffects.js` (+ `featEffects.test.js`).
2. Wire it into the right surface:
   - derived stat → `CharacterDetail.jsx` (initiative is the template).
   - action → already generic in `actionEconomyData.buildActionEconomy`.
   - resource → `RestResourceTracker` block + **backend** `_compute_rest_patch` reset + `getRestSummary`.
   - proficiency/expertise → `inventoryProficiencies.js` banners / `SkillsDisplay`; a *choice* grant also needs an acquisition step (LevelUpWizard + Variant Human), mirroring `subclassGrants`.
3. Test the consumer (component test) + keep `CharacterDetail.test.jsx` green.

## Workflow C — 2024 + homebrew
- 2024: add `FEAT_EFFECTS_2024` and pass it to `_seed_list(..., FEAT_EFFECTS_2024)`. 2024 half-feats bundle a
  +1 ASI with most General feats — author the `ability_choice`/`ability_score` too.
- Homebrew: GMs author `effects` via the feat API (the column is on `FeatCreate`/`FeatUpdate`); the same
  resolvers apply.

## Run tests
```bash
cd frontend && npm test -- --run     # featEffects, FeatsSubTab, LevelUpWizard, actionEconomyData, CharacterDetail
cd backend && pytest tests/test_races_backgrounds_feats.py -q
```
Restart uvicorn after any `.py` change (model/schema/seed/rest sync). Update CLAUDE.md (feats schema,
featEffects listing, "Frontend Not Yet Built" feat bullet) + the coverage numbers.

## Arguments
$ARGUMENTS
