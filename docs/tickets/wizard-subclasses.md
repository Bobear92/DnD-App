# Wizard subclasses — pre-work TODOs

**Goal:** build the Wizard subclasses (both editions) to level 20 with `/subclass-features`, the way
the Samurai was built: audit first, prose sign-off before code, one subclass proven end-to-end before
the rest.
**Status:** not started. This file holds the TODOs carried out of the Fighter subclasses (Nov 4, 2026).
When the Wizard work starts, run `/to-tickets` and expand it into the full per-school worklist below
the pre-work section.
**Background:** `docs/fighter-subclass-retro.md` §5–§6, especially §6b (missing models the Wizard is
likely to hit).

## Pre-work — do these before the first school

- [ ] **W0-GRILL-CONCENTRATION.** `/grill` a concentration-state model. Several Wizard features hinge on
  "while you are concentrating": War Magic Durable Magic (+2 AC and saves), Bladesong's concentration
  saves, and the War Caster feat. Concentration is deferred app-wide today, so decide first whether it's
  built or signed off as prose. Don't let each school rediscover it.
- [ ] **W0-GRILL-CAST-EVENT.** `/grill` a "when you cast a spell of school X" event. The Cast dialog
  exists (`spellUpcast.js`), but no cast event feeds other features. Needed by Abjuration Arcane Ward
  (charges on an abjuration cast), Necromancy Grim Harvest, and the Evocation riders.
- [ ] **W0-PICK-PROVING-SCHOOL.** Choose the first school to prove end-to-end (breadth-before-vertical).
  The retro suggests **Abjuration or Evocation**, because they exercise the cast-event and spell-damage
  gaps earliest. Don't build eight schools on an unproven cast model.
- [ ] **W0-MODEL-SIZE.** Retro proposal 4, still not done: add a `model: small (one module) / large
  (new subsystem)` estimate to each line of the `/subclass-features` Phase 1.5 prose sign-off list, so
  you can see which deferrals are cheap. History: initiative, senses, subclass spells and active
  effects were each one session. Do it in the skill before the first Wizard audit.

## Carried cleanups — do when the touched files come up

- [ ] **W-CLEAN-LIGHT-PALETTES.** Since `<html class="dark">` (`3bd8c3a`) every `dark:` variant applies,
  but classes with a light colour and **no** `dark:` partner (`bg-amber-50`, `bg-emerald-50`,
  `bg-amber-100` with nothing after them) still render as pale boxes on the dark page. Not a sweep:
  fix each one as its file is touched during Wizard work, switching to theme tokens (`primary`,
  `foreground`, `muted-foreground`, `card`, `border`, `muted`). The `/subclass-features` player
  read-through now checks new UI for this.
- [ ] **W-CLEAN-FEAT-SPELL-KEY.** Pre-existing React "unique key" warning when rendering feat-granted
  spells (`SpellSourceLevelView` / `FeatSpellsSection`). It reproduces on a **Wizard** with a Magic
  Initiate-style feat, so fix it during the Wizard QA pass. Details in `unified-spells-tab.md`.
- [ ] **W-CLEAN-FIGHTING-SPIRIT-ITEMS.** Carried from the Samurai: Items-tab attack rows don't show
  Fighting Spirit's advantage (only the Action Economy cards do). Not Wizard work. Pick it up whenever
  the Items-tab attack rows are next touched.

## Per-school worklist

_Not written yet. Expand with `/to-tickets` once the pre-work above is decided._
