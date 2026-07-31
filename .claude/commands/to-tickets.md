---
description: Decompose a large multi-slice feature into an ordered, resumable ticket worklist (proven-slice-first), persisted to docs/tickets/ so it survives across sessions
---

Use this at the START of a big piece of work — anything that repeats a pattern across many units
(all remaining classes/subclasses/feats, a new edition's system, wiring every class into the action
economy) or fans a change across many files. It replaces "improvise from a chat message" with a
durable, dependency-ordered plan. Often follows a `/grill` **GO** on a large pattern.

The output is a committed markdown file, not an in-session todo list — so the work is **resumable**:
a later session opens the file and continues from the first unchecked ticket. (Mirror the *active*
ticket's sub-steps into TodoWrite within a session if useful, but the file is the source of truth.)

## Procedure

### 1. Scope + find the real unit list
State what "done" means in one sentence. Then get the ACTUAL list of units from the machine
worklists — don't guess from memory:
- Class features to mechanize → `npm run report:class-coverage` (frontend)
- Feats to mechanize → `cd backend && python report_feat_effects.py`
- Spell upcasts → `npm run report:upcast-coverage` → `docs/spell-upcast-review.md`
- Broader/cross-cutting backlog → `docs/character-system-backlog.md`

The report's prose-only list IS the ticket backlog; the ratchet baselines say how many remain.

### 2. Ticket 1 is always the vertical slice
The first ticket proves ONE unit end-to-end — creation → use → edge cases → rest/reset → level-up —
**with its test**. Nothing else starts until it's green. Pick the unit most likely to stress the
model (the weird one), not the easiest, so the pattern is proven under load. This is the same
principle `/grill` enforces; `/to-tickets` just schedules it.

### 3. Decompose the rest as replication tickets
Once the slice is proven, remaining units should be mostly **data entry** (a config row, an `effects`
array, a subclass-data entry) — if they're not, the abstraction isn't ready: stop and consolidate
(that's a `/grill` NO-GO, not a ticket). Order by dependency and risk. Group trivially-similar units
into one ticket where splitting adds no value.

### 4. Each ticket captures
- **id + title**, **status** checkbox, **deps** (ticket ids that must land first)
- **scope** — the files/dirs it touches
- **guard** — the test written/updated AND whether it moves a coverage ratchet (if so, the ticket
  ends by bumping the baseline: `npm run coverage:baseline` / `report_feat_effects.py --write-baseline`)
- **done** — the observable done-criteria (what you'd verify per `/ship` Step 3c)

### 5. Write the file
`docs/tickets/<slug>.md` (create `docs/tickets/` if absent). Update checkboxes as tickets land —
committing the status change is part of each ticket's `/ship`. When every box is checked, the file
records the finished feature; leave it as the audit trail.

## File template

```markdown
# <Feature> — ticket worklist

**Goal:** <one sentence>. **Source list:** <which report/backlog enumerates the units>.
**Status:** <n>/<total> done.

## T1 — Vertical slice: <unit> end-to-end  ⬜
- deps: none
- scope: <files>
- guard: <test file> + <ratchet? none>
- done: <creation→use→rest/level-up observed working in the app>

## T2 — <replication unit(s)>  ⬜
- deps: T1
- scope: <files>
- guard: <test> + bump <baseline> after
- done: <observable>

## T3 — … ⬜
```

$ARGUMENTS
