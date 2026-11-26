# Items deep dive — ticket worklist

**Goal:** items on the character sheet DO what their rules text says — potions live in one place, a +1 weapon/armor and
worn magic items (rings, cloaks, belts…) feed their bonuses into attacks/AC/saves/scores only while equipped (and
attuned when required), and the Items tab tracks carried weight, ammunition and GM-made custom loot.

**Scope (Robert, 2026-11-25):** all four areas — potions cleanup, magic weapons & armor, worn items & attunement,
weight/ammo/custom loot. Origin: post-deploy ticket T4 "Items deep dive" ([post-deploy-followups.md](post-deploy-followups.md)).

**Source list:** the `magic_items` table (362 system rows: 177 Wondrous, 40 Potion, 36 Ring, 30 Weapon, 29 Armor,
16 Wand, 12 Staff, 11 Scroll, 6 Rod, 5 Ammunition) + `docs/systems/inventory.md` › "Remaining polish". From T2 on, the
machine worklist is the magic-item coverage report T2 creates (same shape as `report_feat_effects.py`).

**Status:** 1/9 done.

**What exists today** (read `docs/systems/inventory.md` first): the Items tab adds encyclopedia items per category with
quantity / equip / **attune toggle** / remove; AC comes from equipped armor and attack rows from equipped weapons
(`getAttacks`, shared with Action Economy); hands panel; manual ammo spend (`WeaponAmmoControl`, GM-only stocking);
`MagicAttackBadge` with one authored source (Magic Arrow). **Gaps:** a magic item can't be equipped as a weapon or armor;
`magic_items` has no structured effects (bonuses are prose in `effect`); "Weapon, +1" has no base weapon; attunement
is a flag with no limit and gates nothing; `weight` is a free-text string ("0.5 lb.").

---

## T1 — Potions live only under Potions  ✅ (code done 2026-11-25; release needs backup + rehearsal)
Standalone data fix, not part of the pattern below.
- deps: none
- facts: `magic_items` has 40 `item_type='Potion'` rows from the 5e API seed (34 "Potion of …", 3 "Oil of …", "Philter
  of Love", a duplicate "Potion of Healing"); `potions` has 40 hand-curated rows in `seed_items.py` (`POTIONS`). Prod
  matches dev except potions (dev legacy seeder) — **count prod before planning the delete.**
- scope: `backend/seed_items.py` (skip `Potion` when seeding magic items; fold any missing API potion/oil/philter into
  `POTIONS` with effect + duration), a migration/backfill that deletes `owner_type='system'` Potion rows from
  `magic_items` (campaign rows untouched) AND rewrites character inventory snapshots whose entry points at one of them to
  the matching `potions` row (`category`/`source_id`, keeping uid/quantity) — never "remove and re-add".
- guard: backend test — re-seed leaves 0 system Potion rows in magic_items and every API potion name present in potions;
  the backfill re-maps a stored inventory entry and is a no-op on re-run.
- done: Encyclopedia › Magic Items shows no potions; Potions shows all of them once; a character who owned a magic-item
  potion still has it (now under Potions). **Release needs backup + rehearsal (deletes prod rows).**

## T2 — Vertical slice: "Weapon, +1" equipped and attacking  ⬜
Proves the new mechanism under its hardest case: a generic magic item that needs a BASE item.
- deps: none (T1 independent). **Run `/grill` first** — this is a new abstraction (magic-item effects ≈ feat effects).
- design to settle in the grill: (a) `magic_items.effects` JSONB (additive migration) authored in the seed, reusing the
  feat-effects vocabulary where it fits (`attack_bonus`, `damage_bonus`, `ac_bonus`, `save_mod`, `set_ability_score`…);
  (b) a magic weapon/armor inventory entry carries `base_item` (source weapon/armor id + snapshot) chosen when added —
  "Longsword, +1" = Longsword stats + the item's effects; (c) one resolver (`itemEffects(inventory, ctx)`) that only
  counts an item while equipped/held and, if `attunement_required`, attuned — every reader goes through it.
- scope: magic_items model + migration + schema, `seed_items.py` effects for Weapon +1/+2/+3, Items-tab add flow (pick
  base weapon), `getAttacks` (bonus folded into to-hit/damage, the TOTAL coloured with the source named; a
  `MAGIC_ATTACK_SOURCES` entry so the badge says "Magic · Weapon, +1"), `BreakdownValue` terms.
- guard: backend round-trip test for `effects`; frontend tests — held +1 longsword raises to-hit/damage on BOTH Items
  tab and Action Economy (one resolution point), not held → no bonus, badge present; a magic-item coverage report +
  ratchet baseline (`report_magic_item_effects`), started here.
- done: in the app — add "Weapon, +1" as a Longsword, hold it, see +1 to hit and damage with the breakdown, the Magic
  badge, same numbers in Action Economy; drop it from the hand and the bonus goes.

## T3 — Magic armor and shields  ⬜
- deps: T2
- scope: Armor +1/+2/+3 (pick base armor), Shield +1/+2/+3, then the named magic armors with a plain number (e.g.
  Adamantine/Mithral: data rows — Mithral drops Stealth disadvantage/STR requirement, Adamantine is crit immunity → a
  Defenses note). `computeArmorClass` reads `itemEffects`.
- guard: AC tests (base + bonus, shield stacking, unequipped = none) + bump the magic-item baseline.
- done: equip "Armor, +1" as Chain Mail → AC 17 with "+1 Armor, +1" in the breakdown.

## T4 — Attunement that means something  ⬜
- deps: T2
- scope: limit 3 (Artificer 4/5/6 at Magic Item Adept/Savant/Master — read from class data, not retyped); over the
  limit is a WARNING on the tab, not a block (GM rulings exist); an item that requires attunement applies NO effects
  until attuned (already in the T2 resolver — this ticket adds the UI: count "Attuned 2/3", warning, why-no-bonus note).
  Soul of Artifice (+1 to saves per attuned item) becomes a real save bonus reading the same count.
- guard: tests for the count/limit per class level, non-attuned item contributes nothing, Soul of Artifice save bonus.
- done: attune a 4th item on a non-Artificer → warning; un-attune → its bonus disappears from the sheet.

## T5 — Worn items: rings, cloaks, bracers, belts, headbands  ⬜
- deps: T2, T4
- scope: data rows using the T2 vocabulary — Ring/Cloak of Protection (+1 AC and saves), Bracers of Defense (+2 AC only
  with no armor and no shield — a conditional the resolver must express), Amulet of Health / Headband of Intellect /
  Gauntlets of Ogre Power / Belts of Giant Strength (SET a score to N unless already higher → `shared/abilityMath.js`,
  so every derived number follows), Ring of Resistance / similar (Defenses panel row), Boots/Cloak granting
  advantage on a check (situational tag, with its `situation`). Every new `effects` key needs a reader test (same rule
  as `runeFieldReaders.test.js`).
- guard: per-reader tests + bump the magic-item baseline.
- done: attune Belt of Hill Giant Strength → STR 21 everywhere (skills, attacks, carrying capacity) with the source in the
  breakdown.

## T6 — Replication: author the remaining stat-bearing magic items  ⬜
- deps: T3, T5
- scope: walk the coverage report's PENDING list; each is a data row. Items whose effect needs a model the app lacks
  (charges with spells, sentience, conditions, distance/target) go to Robert as a prose-only sign-off list with the
  MISSING MODEL named (CLAUDE.md › Prose-only needs sign-off) — never self-assigned "narrative".
- guard: bump the baseline per batch.
- done: report shows every remaining PENDING item signed off by Robert.

## T7 — Carried weight and encumbrance  ⬜
- deps: T5 (STR can be set by an item)
- scope: parse `weight` to a number (add a numeric column + backfill, or parse at read — decide; inventory snapshots then
  need the field: data migration, not re-add), total carried weight × quantity incl. coins (50 per lb) on the Items tab,
  carrying capacity STR × 15 (×2 for Large/Powerful Build via `creatureSize`); edition rules; variant encumbrance only if
  Robert wants it (campaign setting). Bag of Holding contents don't count — decide how a container is modelled.
- guard: math tests (capacity, size, coins, quantity) + the snapshot backfill test.
- done: Items tab shows "Carrying 63 / 150 lb", turns into a warning over capacity.

## T8 — Ammunition auto-spend  ⬜  (needs Robert's call before building)
- deps: none
- problem: the app DISPLAYS attacks, it never rolls them, so there is no "attack happened" event to spend on — the
  manual Use button already sits on both surfaces. Options to put to Robert: (a) an "Attack" button on ranged cards that
  spends one and shows the to-hit/damage (first step toward rolling); (b) leave manual; (c) magic ammunition (+1 arrows,
  5 `Ammunition` magic items) folds its bonus into the attack while selected — this part is T2-shaped and worth doing
  whatever (a)/(b) says.
- done: per the decision.

## T9 — Custom loot  ⬜  (needs Robert's call on who may create it)
- deps: T2 (so a custom item can carry effects later)
- scope: add an inventory entry that isn't in the encyclopedia — name, category, description, weight, quantity,
  optional attunement. Decide: GM-only (matches "stocking weapons/ammo is GM-only") or player-managed like gear; whether
  custom items can carry structured effects (GM picks from the T2 vocabulary) or text only. Campaign homebrew items
  already exist (encyclopedia `owner_type='campaign'`) — custom loot is for one-offs that shouldn't enter the campaign
  compendium; say so in the UI.
- guard: InventoryTab tests (create/edit/remove, permissions) + backend if any server validation.
- done: a GM gives a character "Grandmother's locket" (text only) and it appears on the sheet with weight counted.
