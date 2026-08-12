# Roll Initiative (V1, GM-driven) — ticket worklist

**Goal:** a GM opens a persisted encounter for a campaign, picks which player characters are in it,
rolls initiative for all of them (or types values in), and gets a sorted initiative order — and
starting the encounter applies an **initiative rest** that recharges every feature triggered by
rolling initiative, showing per character what was regained.

**Source list:** the units are the initiative-triggered class/subclass features. Enumerated by
sweeping the feature tables (`grep -rn -i "roll initiative" frontend/src/characters/components/classData/
backend/seed_classes.py`) — not a coverage report, because `report:class-coverage` counts only
`asi`/`choice`/`action` mechanization and will **not** move for this feature. Do not promise a
baseline bump.

**Status:** 8/8 done. Every ticket landed; the feature is complete for V1.

**Design change during T3 — the table is NOT mirrored on the frontend.** The plan said to mirror the
recharge declarations as an `initiative` clause on the frontend `restResources` rows. Building it
showed that's the wrong call: the anti-drift goal is better served by having *one* table (backend)
and letting the UI render the `changes` the API returns rather than predicting them. Two tables that
must agree is the risk; one table removes it. If a sheet ever needs a "regains at initiative" note,
add a read-only endpoint or a note field then — don't duplicate the rules.

## Agreed V1 scope (decided with the user, 2026-08-11)

- **In:** GM-driven only; select characters from the campaign; Roll All (d20 + sheet modifier) **or**
  manual entry; sorted order; persisted encounters; the initiative rest + "what was regained" summary.
- **Out:** monsters/NPC combatants (deferred until the Bestiary tab exists), turn tracking
  (round counter, current-turn marker, Next Turn), players rolling on their own screens (no
  live-update transport exists in the app — no websockets, no polling anywhere), HP/damage,
  conditions, concentration.
- **Do not** add a per-character "I rolled initiative" button to the sheet — GM-driven was chosen
  deliberately over player self-serve.

## The unit list (what the recharge table must eventually hold)

| Feature | Class / subclass | Ed | Lvl | Shape | Pool key | Pool exists? |
|---|---|---|---|---|---|---|
| Ever-Ready Shot | Fighter → Arcane Archer | 5e | 15 | regain 1 when empty | `arcane_shot_used` | ✅ |
| Relentless | Fighter → Battle Master | 5e | 15 | regain 1 when empty | `superiority_dice_used` | ✅ |
| Relentless | Fighter → Battle Master | 5.5e | 15 | regain 1 when empty | `superiority_dice_used` | ✅ |
| Superior Inspiration | Bard | 5e | 20 | regain 1 when empty | `bardic_inspiration_used` | ✅ |
| Perfect Self | Monk | 5e | 20 | **regain 4** when empty | `ki_used` | ✅ |
| Perfect Focus | Monk | 5.5e | 15 | **floor to PB** | `ki_used` | ✅ |
| Uncanny Metabolism | Monk | 5.5e | 2 | **opt-in**, regain PB, own 1/long-rest charge | `ki_used` | ✅ (+ `uncanny_metabolism_used`) |
| Tireless Spirit | Fighter → Samurai | 5e | 10 | regain 1 when empty | `fighting_spirit_used` | ✅ (built in T8) |

Three distinct shapes → the table field must **not** be a boolean. Out of scope: College of Dance
**Tandem Footwork** (2024 Bard L6) is initiative-*triggered* but spends a Bardic die to buff allies —
not a regain.

## T1 — Shared initiative helper ✅
- deps: none
- scope: new `frontend/src/characters/components/combat/initiativeData.js`; refactor the inline
  computation at `CharacterDetail.jsx` (~L1377-1392) to consume it. Must cover: DEX mod, feat
  `stat_mod` sources (5e Alert +5, 2024 Alert +PB via the `'pb'` resolver), and the Remarkable
  Athlete advantage note.
- guard: `initiativeData.test.js` (pure); the existing CharacterDetail initiative tests
  (`initiative-value`, `initiative-feat-note`, `initiative-advantage-note`, `initiative-breakdown`)
  must stay green unchanged — that's the refactor's safety net.
- done: the Stats tab shows the same number and the same expandable breakdown as before, now from
  one source the encounter page can also call.

## T2 — Encounters backend module ✅
- deps: none (parallel with T1)
- scope: `backend/gm/campaigns/campaign_tools/encounters/` (routes/service/models/schemas), following
  the timeline/sessions pattern. `encounters` (campaign_id, name, created_at) +
  `encounter_combatants` (encounter_id, character_id, initiative nullable, UNIQUE(encounter_id,
  character_id)). Alembic migration — **open the generated file and confirm it isn't empty**
  (autogenerate against a dev DB that already has the tables produces a `pass` body).
- guard: `backend/tests/test_encounters.py` — campaign-scoped content coverage per CLAUDE.md (GM can
  create/update/delete, player cannot, non-member 403) + a `TestEncounterListFieldRoundTrip` if a
  `*ListItem` schema is introduced.
- done: GM can create an encounter, add/remove character combatants, and set initiative values
  through the API; a player gets 403 on every mutation.

## T3 — Initiative rest: the recharge table + Ever-Ready Shot ✅
- deps: none (parallel with T1/T2; the page consumes it in T4)
- scope: `backend/players/characters/service.py` — accept `rest_type: 'initiative'` and add
  `_INITIATIVE_RESOURCES` as a **data table** shaped like the existing `_RACIAL_REST_RESOURCES`
  tuple table, plus `_compute_initiative_patch`. **Only one row: Ever-Ready Shot.** The table's
  columns must already accommodate all three shapes (regain-n-when-empty / floor-to-PB / opt-in with
  its own charge) even though one row exists — designing for one shape is what forces the rewrite in
  T5-T7. ~~Mirror the frontend declaration as an `initiative` clause on the `restResources` rows~~ —
  superseded, see the design-change note at the top: the backend table is the only copy, and the UI
  renders the returned `changes`.
- as built: `_INITIATIVE_RESOURCES` + `_resolve_pool_value` (`'level'`/`'pb'` sentinels) +
  `_compute_initiative_patch`; `_REST_TYPES` now validates the rest type, so an unrecognised one is
  a 422 instead of silently patching nothing and reporting success.
- guard: `TestInitiativeRest` in `test_characters.py` — GM applies; player 403; non-member 403;
  cross-campaign filter; regains 1 **only when empty**; never exceeds the max; an Arcane Archer below
  L15 and a Champion of any level are untouched.
- done: `POST /api/characters/campaign/{id}/rest` with `rest_type: 'initiative'` refills a spent
  Arcane Shot use for an L15+ Arcane Archer and nobody else.

## T4 — The encounter page — VERTICAL SLICE COMPLETE ✅
- deps: T1, T2, T3
- scope: new route + page (GM-gated via `campaign?.userRole === 'gm'`), `encounterService.js`,
  nav entry. Character multi-select (the `CharacterList` rest-dialog selection UI is the closest
  existing pattern — reuse rather than reinvent), **Roll All** (d20 + T1's modifier) and per-row
  manual entry, sorted order display with ties visible, and Apply → the T3 initiative rest with a
  per-character "what was regained" summary.
- guard: page test — GM-only gating, select → Roll All fills every row, manual entry overrides a
  roll, order sorts descending, Apply calls the service with the right character ids, the regained
  summary renders. Async-anchor on fetched content per CLAUDE.md.
- done: **observed in the real app** (`/ship` Step 3c) — GM builds an encounter with an L15 Arcane
  Archer, rolls, applies, and the character's Arcane Shot tracker on the sheet has gone up by one.
  **Nothing below starts until this is green.**

## T5 — Replication: the regain-when-empty rows ✅
- deps: T4
- scope: data rows only — Battle Master Relentless (5e L15 **and** 5.5e L15), Bard Superior
  Inspiration (5e L20), Monk Perfect Self (5e L20, **regain 4** — proves `regain: n` was right).
  Backend table only (no frontend declarations — see the design change above).
- **NOT pure data entry, and here is why.** A Battle Master's pool is `6 + one per Martial Adept
  feat` and a Bard's is `max(1, CHA mod)`, so a constant `total` would have refilled a character
  who still had a use left. `total`/`amount` now also accept a CALLABLE over the pool context
  (`char`, `cd`, `level`, `pb`). That is a one-time widening of the resolver, not a per-feature
  branch in `_compute_initiative_patch` — each feature is still exactly one row carrying its own
  pool formula, so the abstraction held. A `unit` field ((singular, plural)) was added too, so the
  message reads "1 die" / "4 points" rather than "1 use".
- guard: extend `TestInitiativeRest` — one case per row (recharges when empty, no-op when not empty,
  level-gated, wrong-subclass untouched). Note Bard/Monk are hand-written sheets, so the on-sheet
  note only lands for config-driven classes; the summary + patch work for all of them.
- done: all four recharge from the encounter page; a Battle Master at L14 does not.

## T6 — The floor shape: Monk 2024 Perfect Focus ✅
- deps: T5
- scope: one row using the `floor: 'pb'` shape (focus points become PB when fewer — **not**
  conditional on being empty). Resolve `'pb'` the same way `getFeatStatMods`/`getFeatResources`
  already do.
- guard: `TestInitiativeRest` cases — tops up from below PB, no-op at or above PB, never reduces
  a character who has more than PB.
- done: a 2024 L15 Monk with 1 focus point left comes out of initiative with PB points.

## T7 — The opt-in shape: Monk 2024 Uncanny Metabolism ✅
- deps: T6
- as built: `RestRequest.opt_ins` ({character_id: [feature]}) + a read-only
  `GET /api/characters/campaign/{id}/initiative-options?character_ids=` so the page can offer the
  choice WITHOUT mirroring the table (the escape hatch the T3 design note anticipated), + the
  `OptInRow` control on the encounter page. `uncanny_metabolism_used` is its charge, reset by the
  long-rest path. **Our feature text simplifies the published 2024 wording** (we say "regain Focus
  Points equal to your Proficiency Bonus"; the book says regain ALL expended Focus Points and heal).
  Implemented to match what the app displays — correcting the text is a separate data decision.
- scope: the third shape — the player *chooses* whether to use it, it is **not** gated on being
  empty, and it is itself 1/long rest, so it needs its own charge key (e.g.
  `uncanny_metabolism_used`) reset by the long-rest path. The apply step needs a per-character
  opt-in control on the page rather than firing automatically. Level 2, so it will be exercised far
  more often than the L15-20 features — worth the care.
- guard: `TestInitiativeRest` — applies only when opted in, consumes the charge, refuses when the
  charge is spent, and the charge comes back on a long rest.
- done: a 2024 L2+ Monk sees the opt-in on the encounter page, and can't use it twice before a long rest.

## T8 — Deferred: Samurai Fighting Spirit pool → Tireless Spirit ✅
- deps: T5
- UNBLOCKED and done: the Fighting Spirit pool now exists (a `subclass: "Samurai"` row in
  `configs/fighter.js` REST_RESOURCES, three uses, long-rest recharge in `_compute_rest_patch`),
  so Tireless Spirit became the one-row addition it was always meant to be.
- original note: **was blocked.** `fighting_spirit_used` exists nowhere — Samurai's
  Fighting Spirit (5e L3, 3/long rest, temp HP + advantage) is untracked, so Tireless Spirit has no
  pool to refill. Build the pool first as part of the Samurai's own subclass pass (`/subclass-features`),
  then Tireless Spirit is a one-row addition here.
- guard: whatever the Samurai pass requires + one `TestInitiativeRest` row case.
- done: Fighting Spirit is a tracked resource, and Tireless Spirit refills it at initiative.
