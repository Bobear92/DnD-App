# Character System Backlog

Issues captured 2026-05-31 for later work. Theme: the character system should behave
like a **leveling/creation-driven sheet**, not an open sandbox. Most choices are made at
**creation** or **level up** and then locked; only true "at the table" resources are
player-mutable, and those go through a **use-button + GM-triggered rest** flow rather than
a raw editable value.

---

## Epic 0 — [PRIORITY] Data-driven ClassSheet spike (Fighter + Wizard)

**Why first:** 24 hand-maintained sheets (12 classes × 2 editions) are the root inefficiency.
Epics 1–3 are each a 24× rework *because* of this duplication. Prove a data-driven sheet on two
classes — one martial (Fighter), one caster (Wizard) — and get them fully correct end-to-end
(creation → level-up → play → rest → every lock right). Move on to the rest from a place of
strength, replicating a proven template instead of patching 24 files.

**Goal:** One configurable `ClassSheet` driven by a per-class **config object**, plus shared
primitives:
- `useLockedChoice` — permanent choices editable only at creation/level-up or when GM Edit is on (Epic 1)
- `useSlotCaster` — universal Cast-button + slot model, slots reset by GM rest (Epic 2)
- `useRestResource` — Use-button + confirm, restored only by GM-triggered rest (Epic 3)

If Fighter + Wizard reproduce from `config + hooks`, the other 22 become data, and Epics 1–3
collapse into single changes to the shared hooks instead of 24 edits each.

**Skill decision — DECIDED (2026-06-01):** spike succeeded → **`/class-sheet` retired**, replaced by
**`/class-config`** (`.claude/commands/class-config.md`): add/modify a class config, migrate a legacy
hand-written sheet to a config, or add a brand-new class. The martial/spellcasting split is no longer
needed — one `ClassSheet` + config covers both.

**Work:**
- [x] Define the per-class config shape (hit die, slots table, resources, feature lists, which
      choices lock, subclass unlock level, caster type, etc.). → `components/classSheet/configs/{fighter,wizard}.js`
- [x] Build shared primitives: `useLockedChoice`, `useSlotCaster`, `useRestResource`, GM Edit toggle.
      → `components/classSheet/hooks/*` + GM Edit toggle in `CharacterDetail.jsx`.
- [x] Reproduce **Fighter** (5e + 2024) from config — full vertical: creation, level-up, locks, rest.
- [x] Reproduce **Wizard** (5e + 2024) from config — full vertical incl. spell-slot casting.
- [x] Validate against existing tests — `CharacterCreate.test.jsx` (82) + `CharacterDetail.test.jsx` (90)
      pass UNCHANGED; `WizardSheet.test.jsx` (61) rewritten to render the bound `ClassSheet` (import
      swap only — already behavior-based). Full suite: 851 green.
- [x] **Decide skill structure** → `/class-sheet` retired; `/class-config` created. See "Spike outcome" below.

### Spike outcome (2026-06-01) — SUCCESS
One `ClassSheet.jsx` + per-class config + 3 hooks reproduced Fighter (martial) and Wizard (full caster)
in both editions with **zero changes** to the two heavy page test suites. Fighter & Wizard (5e + 2024)
are now wired live; the 4 old sheet files are deleted. The other 22 classes still use their own sheets.

**Locking + GM Edit (Epic 1) and rest-as-use-button (Epic 3) are proven through the shared hooks:**
fighting style + subclass lock via `useLockedChoice` (GM Edit toggle unlocks); Second Wind / Action
Surge / Indomitable converted to use-button + confirm via `useRestResource` (backend
`_compute_rest_patch` already resets all keys). Universal casting (Epic 2) runs through `useSlotCaster`.

**Next:** migrate the remaining 22 classes to configs via **`/class-config`** (each becomes a config
object, not a 24× edit), then Epics 1–3 are single changes to the shared hooks.

### TODO when migrating the other classes (everything below comes "for free" via the shared `CombatBlock`/`HitDiceTracker` — non-migrated classes are missing it)

- [ ] **Hit-Dice roll-to-heal dialog** — only the data-driven sheets (Fighter + Wizard via `CombatBlock`'s
      heal mode) get the "Use" → Spend-Hit-Dice dialog (`onHeal`). The 22 hand-written sheets still use the
      legacy +/− `hit_dice_used` stepper with no actual roll. Migrating a class to a config wires `CombatBlock`,
      so the roll dialog appears automatically.
- [ ] **Durable feat** — the Hit-Die heal floor (regain ≥ 2×CON mod, min 2) + the pre-roll minimum notation
      (`hit-dice-durable-min` / `hit-dice-durable-applied`) live in `HitDiceTracker`'s heal mode and are wired
      by `CombatBlock` (`durable={hasDurableFeat(data.feats)}`). So **Durable currently only works on Fighter +
      Wizard**; a Durable Barbarian/Cleric/etc. won't see it until that class is migrated. (Helpers ready:
      `hasDurableFeat` / `durableHitDieMin` in `combatBonuses.js`.) No per-class work needed beyond the migration.

---

## Epic 1 — Lock permanent choices; only edit at creation or level up

**Problem:** Many class/race/subrace features that are *permanent choices* can currently be
changed on the fly in CharacterDetail. They should only be settable during character
**creation** or **level up**, then become read-only (same lock pattern already used for
subclass selection).

**Known breaking example:**
- **Fighter Fighting Style** — chosen at L1 (and later levels for some subclasses). Currently
  editable any time in the sheet; should lock after creation/level-up like the subclass picker.

**Work:**
- [ ] Comprehensive audit of **all class features** across 24 sheets (5e + 2024) for
      permanent choices that are currently on-the-fly editable. Candidates: fighting styles,
      pact boon, metamagic picks, expertise picks, weapon masteries, invocations, maneuvers,
      draconic ancestry/bloodline (already locked), favored enemy/terrain, instrument picks, etc.
- [ ] Comprehensive audit of **all race + subrace features** for the same (e.g. Half-Elf ASI/skill
      picks, High Elf cantrip, Dragonborn ancestry, variant-human-style choices).
- [ ] Apply the existing "lock outside creation" pattern (`readOnly || (!creation && !!data.X)`)
      consistently. Now handled per-class via `/class-config` (lockedChoices + useLockedChoice).
- [ ] Decide the small set (if any) of features that *can* legitimately change "at the table" /
      during a session and document them.

**GM escape hatch — DECIDED:** Add a **GM Edit toggle** to the character sheet. Off by
default so the GM doesn't accidentally change things; when the GM turns it on, *everything*
on the sheet becomes editable (including locked permanent choices). This is the single
override mechanism for all locked choices — players never get it; the GM opts in per session.
- [ ] Build the GM Edit toggle (default OFF) that unlocks all locked controls when on.
- [ ] All Epic 1 locks should respect: locked for players always; locked for GM unless GM Edit is on.

---

## Epic 2 — Universal spell-slot casting model

**Problem:** Spell casting / slot usage is only fully wired the "right" way on the Wizard
(Cast button decrements a slot; slots reset on GM-triggered short/long rest per class). This
needs to be **everywhere**.

**Principle:** Regardless of how a class learns or prepares spells (known, prepared, pact,
spellbook), they all **cast the same way** — spend a spell slot via a Cast button, and slots
are restored only when the GM triggers the appropriate rest.

**Work:**
- [ ] Roll out the Wizard Cast-button + `availableSlots` pattern to every spellcasting sheet
      (Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock/pact, Artificer — 5e + 2024).
- [ ] Ensure each class's slots reset on the correct rest type via the existing GM rest flow
      (Warlock pact = short rest; full/half casters = long rest).
- [ ] Confirm prepared/known/spellbook UIs all funnel into the same casting mechanic.

---

## Epic 3 — Rest-rechargeable resources are use-buttons, not editable values

**Problem:** Features that recharge on a short/long rest should not be raw player-editable
numbers. They should be **spent via a Use button** that warns "this won't come back until a
short/long rest," and then **only the GM-triggered rest restores them**. (Same model already
used for racial rest resources + Portent.)

**Known examples:**
- **Barbarian Rage** (`rages_used`)
- Existing good patterns to mirror: racial rest resources (`RacialResourceTracker`),
  Portent (Divination Wizard).

**Work:**
- [ ] Audit all class resources that recharge on rest (`rages_used`, `ki_used`/focus,
      `bardic_inspiration_used`, `channel_divinity_used`, `wild_shape_used`,
      `sorcery_points_used`, `pact_slots_used`, lay on hands, superiority dice, etc.) and
      convert any that are still free-edit values into Use-button + confirm + GM-rest-reset.
- [ ] Mirror reset logic in backend `_compute_rest_patch` (short vs long per feature).
- [ ] **Possible new skill:** a "rest-triggered feature" scaffold so any GM-rest-restored
      resource is added consistently (tracker widget + backend rest patch entry + tests).

---

## Later / dependent work (not in scope yet)
- Armor & Equipment system — will surface **AC** computation issues.
- **Action economy** (actions / bonus actions / reactions) — surfaces alongside equipment.

---

## Decisions made
1. **GM override:** via a **GM Edit toggle** on the sheet (default OFF). See Epic 1.
2. **Rest-feature skill:** **folded into `/class-config`** (was `/class-sheet`). Rest-rechargeable
   features are now config `restResources` entries (rendered by `RestResourceTracker` via
   `useRestResource`) + one backend `_compute_rest_patch` entry + a test — all covered by the
   `/class-config` workflow. No standalone skill. (Revisit only if rest ever needs to live outside
   the character sheet — user expects it won't.)
3. **Priority:** **Epic 0 (data-driven ClassSheet spike on Fighter + Wizard) is the priority.**
   Epics 1–3 fold into the shared hooks built during the spike, so do them through Epic 0's
   primitives rather than as standalone 24× passes.
