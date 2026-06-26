---
description: Author a game-mechanic reference page — a static Encyclopedia page (Mechanics tab) plus, when needed, a computed character-sheet surface that links to it. Turn a rules subsystem (jump, AC, hit dice, action economy…) into a plain-language page with worked examples, and a "Learn more" link from wherever the app computes it.
---

Build a **game-mechanic reference page** for the D&D app. Each mechanic gets a static page under the
Encyclopedia **Mechanics** tab (`/campaigns/:campaignId/encyclopedia/mechanics/<slug>`) and a link to it
from wherever that mechanic is calculated on the character sheet. Argument: the mechanic to document
(e.g. "armor class", "hit dice", "action economy") — or an existing page to extend.

**Status / vertical slice:** Jump is fully built (helper + page + Stats-tab card). The registry
(`mechanicsRegistry.js`) lists the rest as `available: false` ("Coming soon"): Armor Class, Hit Dice,
Action Economy. Suggested order: Armor Class → Hit Dice → Action Economy.

## Two flows — pick one first
- **Flow A — new mechanic** (the math isn't in the app yet, like jump was): build the pure helper + a
  computed surface (a small dedicated card) → static page → link. All of the steps below.
- **Flow B — page-only** (the math already exists, like **AC** in `InventoryTab` / `inventoryData.js`
  and **Action Economy** in `ActionEconomyTab`/`actionEconomyData.js`): **skip the helper-creation and
  new-card steps** — reuse the existing helper as the page's source of truth, and just add the
  "Learn more" link to the surface that already renders it. Static page → link only.

## The three standing conventions (confirmed)
1. **One computed surface, not two.** Prefer **linking the existing surface** (Flow B). Only build a new
   card when the value isn't displayed anywhere yet (Flow A).
2. **Edition handling.** The helper is edition-aware via a param when rules differ. The page gets a
   ManeuversPage-style edition toggle **only when 5e and 2024 actually differ** — leave it off when
   they're identical (jump has none).
3. **Registry stays minimal** — `{ slug, title, blurb, available }`. Add fields per-mechanic only when a
   page needs them.

## Where things live (jump is the template for every file)
- **Helper (source of truth)** — `frontend/src/characters/components/<mechanic>Data.js` + `.test.js`.
  Pure functions: the formulas, plus a `*_SOURCES` registry array for conditional modifiers
  (`JUMP_MULTIPLIER_SOURCES` is the model). **Flow B: reuse the existing helper** that already owns the
  math (`inventoryData.js` for AC, `actionEconomyData.js` for action economy) — do not duplicate it.
- **Static page** — `frontend/src/encyclopedia/pages/<Mechanic>Page.jsx` + `.test.jsx`. Template:
  `JumpPage.jsx` / `ManeuversPage.jsx` — header with back-link to `…/encyclopedia`, prose `Section`s,
  worked example, edge cases, an at-the-table example, and a registry-driven "What changes it" section.
- **Registry** — `frontend/src/encyclopedia/data/mechanicsRegistry.js`. Flip the entry to
  `available: true` (or add a new one). `MechanicsTab.jsx` renders it; no edit to the tab needed.
- **Route** — `frontend/src/App.jsx`, beside the jump route:
  `…/encyclopedia/mechanics/<slug>` → `<MechanicPage />`, wrapped `ProtectedRoute > MainLayout`.
- **Computed surface (Flow A only)** — a small dedicated card
  (`frontend/src/characters/components/<Mechanic>Card.jsx` + `.test.jsx`, template `JumpCard.jsx`) wired
  into the right tab in `CharacterDetail.jsx`. Existing surfaces for Flow B: AC summary in
  `InventoryTab.jsx` (Items tab), `ActionEconomyTab.jsx`, the `HitDiceTracker` in the Stats combat block.

## Non-negotiable rules (the lessons from the jump slice)
- **Ground first.** Before writing a word, grep what the app actually models — `subclassData/`,
  `classFeatures5e.js`/`classFeatures2024.js`, seeded spells/items — and only reference content that's
  really there. (Jump's Tiger Totem isn't in this app; don't cite it.)
- **No dead params.** Only add a helper option/registry entry that has a real in-app source. Document
  out-of-app rules as prose, not code.
- **Worked examples call the helper.** Compute the page's example numbers via the helper
  (`computeJump(...)`) so the page can never drift from the sheet.
- **Conditional modifiers are documented, not auto-applied.** Temporary/situational effects (a spell, an
  item, a spent resource) go in the `*_SOURCES` registry and on the page — never folded into the
  always-on card, which shows only the everyday value (STR + permanent feats).
- **Progressive disclosure.** The card shows the key numbers compactly with an expandable "How this is
  calculated" panel and a "Learn more" link — *not busy by default, all the info on demand.* This is the
  whole character sheet's design principle.
- **Surface bugs, don't silently fix.** If you find the app's existing data wrong while researching
  (e.g. the Monk Ki text dropping Step of the Wind's jump-doubling), tell the user and fix it on their
  okay — don't bury it.

## Workflow — Flow A (new mechanic)
1. Ground (grep app data). 2. `<mechanic>Data.js` + test (formulas + `*_SOURCES`). 3. `<Mechanic>Card.jsx`
+ test; wire into the relevant `CharacterDetail` tab. 4. `<Mechanic>Page.jsx` + test (worked example via
the helper; registry-driven "what changes it"). 5. Registry `available: true`. 6. Route in `App.jsx`.
7. Docs + tests.

## Workflow — Flow B (page-only; AC, Action Economy, …)
1. Ground (grep the existing helper for the real formula). 2. `<Mechanic>Page.jsx` + test, sourcing its
worked example from the **existing** helper. 3. Registry `available: true`. 4. Route in `App.jsx`. 5. Add
the "Learn more" link to the existing surface (`InventoryTab`, `ActionEconomyTab`, …). 6. Docs + tests.

## Two gotchas that bite every time you flip a mechanic to `available` (do these proactively)
1. **Wrap the surface's existing test in `<MemoryRouter>`.** Flow B always adds a `Link` to a component
   (`InventoryTab`, `ActionEconomyTab`) whose test renders it bare — adding the link breaks **every** test
   in that file with "useHref … outside a Router" until you wrap its `renderTab`/`render` helper in
   `<MemoryRouter>…</MemoryRouter>`. Both InventoryTab and ActionEconomyTab tests needed this.
2. **Repoint `MechanicsTab.test.jsx`'s "Coming soon" case.** It asserts a specific still-planned slug
   renders muted + non-linking. If that slug is the one you just made available, the test fails — switch it
   to a slug still `available: false` (and optionally add an "available linking card" assertion for the new one).

## Data-testid conventions (match jump)
Page: `<mechanic>-back`. Card: `<mechanic>-card`, `<mechanic>-details-toggle`, `<mechanic>-details`,
`<mechanic>-learn-more`, plus per-value ids. Tab card: `mechanic-card-<slug>`.

## Run tests + docs
```bash
cd frontend && npm test          # the new *Data / *Card / *Page / MechanicsTab tests + CharacterDetail
```
Frontend-only — no backend/uvicorn restart. Update **CLAUDE.md**: the routes table (new
`…/mechanics/<slug>` row), the file listing (helper + page [+ card]), the relevant tab description if a
surface gained a link, and the "Game-mechanics reference pages" bullet under "What's NOT Built Yet"
(move the mechanic from coming-soon to built).

## Arguments
$ARGUMENTS
