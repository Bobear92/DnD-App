# Lessons learned — by category

Every lesson this project has paid for, in one place, grouped by what you are doing when it applies.
Each row says **what enforces it**, because a lesson that lives only in someone's memory is the one
that gets learned twice.

**How to use this file**
- **Planning a feature, a subclass or a class:** read *Reading rules text*, *Where a feature appears*
  and *Shared mechanisms*.
- **Before handing work to Robert for QA:** read *How it reads at the table*.
- **Before a release, or writing a migration or seed script:** read *Production and data safety*.
- **Writing tests or guards:** read *Testing*.
- **When a retro or `/log` names a new lesson:** add a row here in the same change (the `/retro` skill says so).

**Where the evidence lives**
- **Retro** = [`docs/fighter-subclass-retro.md`](fighter-subclass-retro.md) (§ = section)
- **Memory** = Claude's memory files in `~/.claude/projects/…/memory/`, which are not in the repo. The name is given so it can be found.
- **Session** = a log in [`docs/sessions/`](sessions/INDEX.md)
- **Rule** = a standing rule in CLAUDE.md, mostly under "Character sheet rules"

**Enforced by**, strongest first:
1. **guard test** — fails `npm test` or `pytest`
2. **hook** — a Claude Code hook or git hook
3. **skill step** — a step in a `/skill`, so it runs only if the skill is used
4. **rule** — written in CLAUDE.md, which loads every turn but is not checked
5. **memory** — in Claude's memory only
6. **none** — known, but nothing carries it forward except this file

---

## Lessons nothing enforces yet

These are the lessons most likely to be learned again. Each is a candidate for a guard, hook or skill step.

| Lesson | Category | What would enforce it |
|---|---|---|
| Ask "who else already knows this fact?" before adding a table, field or surface | Shared mechanisms | a `/subclass-features` audit column (retro §7g #9) |
| A test that seeds a data shape the app no longer writes keeps a dead path green | Testing | a fixture check against what creation and level-up actually write |
| Verify CLAUDE.md / doc claims about other subclasses before relying on them | Reading rules text | a Phase 0 step in `/subclass-features` |
| Assert against what is actually rendered (a true minus sign, CSS `capitalize`, read-only text) | Testing | a note in the `test-writer` agent |
| A whole-system pass after each class, before the next one starts | Workflow | a step in the class ticket template (retro §7g #13) |
| An autogenerate "rename" is a drop + add that deletes the column's data | Production and data safety | the `/release` destructive-migration stop (first-deploy T9) |
| Back up and rehearse on a restored prod copy before any migration release | Production and data safety | the `/release` skill (first-deploy T9) |
| Background servers can die mid-session; re-check before relying on them | Tooling | a status check in `restart-*.sh` callers |

---

## Reading rules text

| Lesson | Enforced by | Source |
|---|---|---|
| **Assume every stored feature blurb and pool option is wrong until checked against RAW**; it was wrong for every subclass from Arcane Archer on, and for several feats | skill step (`/subclass-features` Phase 0) | Retro §1a, §5b |
| Fix wrong text **at the source** (`SUBCLASS_DATA`, the pool module, `seed_feats.py`), not in the consumer, and pin the corrected clause with a test | skill step, guard test (per clause) | Retro §1a |
| A guard that scans prose cannot catch prose that was wrong from the start (Strength Before Death never said "reaction") | skill step (Phase 0) | Retro §5b |
| "…you can use your reaction…" means a card in the **Reactions** tab | guard test (reaction guard, feat seed guard, option-pool guard), rule, memory `feedback_use_your_reaction_card` | Retro §2 |
| "If you take the Attack action, you can use a bonus action…" means an **Action + Bonus combo** card | guard test (combo guard, `isAttackActionBonus`), rule, memory `feedback_attack_action_bonus_combo` | Retro §2 |
| Anything named "Channel …" needs an **active status that does something** while on | rule, memory `feedback_channel_features_active`, guard test (`runeFieldReaders` for the fields) | Retro §2 |
| A feature that grants a pool is audited **one row per option per clause**; the rules live in the pool module | guard test (option-pool guard), memory `feedback_container_features_one_level_deeper` | Retro §1e |
| **Prose-only needs Robert's sign-off**, with the missing model named; "it's flavour" is not a reason | rule, skill step (Phase 1.5), guard test (feat coverage ratchet: a new pending `note` fails) | Retro §1e, memory `feedback_prose_only_needs_signoff` |
| A "missing model" has usually been **one module built in one session** (initiative, senses, subclass spells, active effects) | none — proposal 4 (a model-size estimate on sign-offs) is not done | Retro §1e, §4 |
| **Default to the RAW-complete rule** and offer the simplification as the alternative, not the reverse | skill step (`/subclass-features`) | Retro §5b |
| The surprised condition is not modelled; keep a **watchlist** and let Robert decide when to build it | memory `project_surprised_condition_watchlist` | Session 2026-10-26 |
| CLAUDE.md claims about other subclasses can be stale (Samurai Bonus Proficiency was claimed built and wasn't) | none | Retro §5b |

## Where a feature appears

| Lesson | Enforced by | Source |
|---|---|---|
| **Route by the moment of use, not the cost badge**: what is the player looking at when they reach for it? A hit trigger goes on the attack card, an HP change by the HP block, a roll change on that roll's row | skill step (triage column) | Retro §1b |
| A **rider modifies** an action you already had; a feature that **adds** one gets its own entry; a second reaction economy gets `extraReaction` | rule | Retro §1b |
| **One resolution point per question**, shared by every surface (`getAttacks`, `creatureSize`), so two tabs cannot disagree | rule, guard test (parity tests per helper) | Retro §3 |
| A note that belongs on both the item and the attack is **defined once** (`EQUIPMENT_FEATURES` + `attackScope`) | guard test (`attackCardFeatures.test.js`) | Retro §7a |
| A **Use control sits inside the block of the feature it spends**, and a two-cost control labels each count | rule | Retro §2 |
| **Hide vs. warn:** an unverifiable requirement is a warning on the card; a control that would do nothing now is hidden | rule | `docs/systems/feat-effects.md` (Tavern Brawler's grapple card was once hidden from anyone holding a weapon) |
| A banner restating numbers already on other cards is noise (the `ActiveEffectsBanner` was removed; don't re-add) | rule (removed-on-purpose list) | Retro §1b |

## How it reads at the table

| Lesson | Enforced by | Source |
|---|---|---|
| **One damage number per attack.** Fold in only damage that is currently happening; damage decided after the hit stays beside its Use control | rule | Retro §1b ("doubled damage") |
| **Mark a raised number by colouring the total** and naming the source in words, never with a second number beside it ("+7 and +2" reads as +9) | rule | Retro §1b |
| **Every derived number shows its math** (`BreakdownValue`) | rule | Retro §3 |
| A situational bonus carries its condition everywhere; situational advantage never tags a save or skill row | rule | Retro §2 (Shield Master) |
| **Never label a feature with the level it was gained** | guard test (`noLevelAnnotations`) | CLAUDE.md Testing |
| **Player read-through before QA**: one number per quantity, counts beside their owner, no two lines opening with the same words, nothing in prose the sheet should show, no false cost badge | skill step (`/subclass-features` Phase 3) | Retro §4 #5, §5c |
| Show **provenance** wherever a number can have more than one source | skill step (Phase 3) | Retro §5c |
| Use **theme tokens**; the app is dark-only and `dark:` variants are live | guard test (`darkTheme.test.js`), rule | Retro §5d |
| A collapsed rider is the default for rules text; an always-visible line is for numbers and links | none (documented in `docs/systems/action-economy.md`) | Session 2026-11-14 |

## State and data

| Lesson | Enforced by | Source |
|---|---|---|
| **Computed but shown nowhere:** every produced field needs a reader | guard test (`runeFieldReaders.test.js` for runes and active effects; nothing general) | Retro §1d |
| **Derived mechanics must be announced** when gained (the level-up "Applied automatically" box) | skill step, mechanism (`levelUpAutoEffects` diff) | Retro §5c |
| **Spending an effect's charge switches it on in one patch**; ending never refunds; a rest never clears `active_effects` | rule, mechanism (`RestResourceControl`, `toggleEffectPatch`) | Retro §1b |
| **Knowing is not having**: gate on the real condition (a rune counts only while its item is equipped) | rule | Retro §1d |
| A **snapshotted shape that gains a field needs a data migration** or re-sync, never "remove and re-add" | rule, mechanism (`sync_character_feat_snapshots`) | Retro §3 |
| **Derive fixed grants instead of storing them**, so existing characters get them with no migration | rule ("Extending") | Session 2026-10-26 |
| Ability scores are **character columns**, not `character_data`; a feat's +1 must be written separately | mechanism (`featAdditionPatch` reports `asi`) | Retro §7a |
| A missing score counts as **10**; "5.5e" and "2024" are **the same edition** everywhere | guard test (`noDuplicateHelpers`, `featureGate.test.js`) | Retro §7a |
| **A player never restores a resource** (except the Psi Warrior die regain); stocking weapons and ammo is GM-only | rule | Retro §1b |
| Every panel on the sheet reads **the same version of the character** (the unsaved draft, via `sheetCtx`); five panels once read the saved one | rule ("Extending"), guard test (`characterContext.test.js`, at the helper level only) | Retro §7a |

## Production and data safety

Agreed before the first deploy. The full reasoning is in [`docs/deployment.md`](deployment.md).

| Lesson | Enforced by | Source |
|---|---|---|
| **A deploy replaces code, never data.** The database is a separate server; nothing is pulled down or reseeded | none (documented in `docs/deployment.md`) | Session 2026-11-15 |
| **Data never flows dev → prod**; prod → dev only on purpose, to debug or rehearse, and the copy is dropped afterwards | none (documented) | Session 2026-11-15 |
| **A backup is the only real undo.** `downgrade()` can recreate a dropped column, not its data | none until `/release` exists (first-deploy T9) | Session 2026-11-15 |
| **Rolling back code doesn't roll back the schema**, so migrations go expand → contract: add first, drop or rename only in a later release | none until `/release` exists (first-deploy T9) | Session 2026-11-15 |
| **An autogenerate rename is a drop + add**; read every migration and stop on `drop_`, `alter_column`, `UPDATE`, `DELETE` | none until `/release` exists (first-deploy T9) | Session 2026-11-15 |
| **A failed migration is safe, a wrong one isn't.** Postgres rolls back a failed migration; one that succeeds while doing the wrong thing is the danger, so rehearse on real data | none until `/release` exists (first-deploy T9) | Session 2026-11-15 |
| **Whole-blob writes lose data silently**: `character_data` was replaced on save, so a dropped key spread as players saved. Now merged; deleting a key is explicit (`character_data_remove`) | guard test (`test_character_data_merge.py`, `characterService.test.js`) | Session 2026-11-15, fixed 2026-11-16 |
| **Merging is not concurrency control**: each save still carries a full, possibly stale copy, so simultaneous saves still overwrite each other. Only sending changed keys fixes that | none | Session 2026-11-16 |
| **Seed scripts are the source of truth for system rows** and must upsert, not skip; they never touch campaign rows | guard test (`test_seeding.py`), one helper (`shared/seeding.py`) | Session 2026-11-15, fixed 2026-11-16 |
| **When two writers produce the same row, name one owner** before making either authoritative — the SRD and starting-items seeds share 14 gear names, and the spell seed and Artificer tagger share `classes` | guard test (`test_seeding.py`) | Session 2026-11-16 |
| **Audit "dev convenience" scripts before listing them for production**: `seed_data.py` was on the prod seed list and creates an admin with password `admin123` | guard (`seed_data.refuse_non_local_database`, tested) | Session 2026-11-16 |
| **Releases are tags, not branches**: tags can't move, so they stay accurate rollback points | none (documented in `docs/deployment.md`) | Session 2026-11-15 |
| **Run the real start path against an EMPTY database before trusting it.** Doing so found `env.py` crashing on a `%` in DATABASE_URL (ConfigParser interpolation) — every deploy would have failed | guard test (`test_schema_ownership.py`), CI (`alembic upgrade head` + `alembic check` from scratch) | Session 2026-11-16 |
| **Alembic owns the schema**: no `create_all` in the app, so a model without a migration fails CI, not a deploy | guard test (`test_schema_ownership.py`), CI `alembic check` | Session 2026-11-16 |

## Shared mechanisms and duplication

| Lesson | Enforced by | Source |
|---|---|---|
| **Consolidate at the 2nd–3rd consumer**, and prove the migration with the existing tests passing unchanged | rule (efficiency tripwires), skill step (`/grill`) | Retro §3, §7d |
| **A finished mechanism costs zero code for the next unit**; needing new component code is the signal it isn't finished | rule ("Extending") | Retro §3 |
| **Check each clause against the mechanism's contract at audit**, so extensions are planned, not found in QA | skill step (contract-fit column) | Retro §1c, §4 #6 |
| **Duplication hides bugs**: each copy is tested alone, nothing tests that the copies agree | guard tests for the known cases (below) | Retro §7a |
| **The backend owns the rules it applies**; the frontend shows a dry run, never a prediction | rule, guard test (`restResourceContract.test.js`) | Retro §7a |
| **Cross-language copies are checked by a committed fixture** both suites read, never a "keep in sync" comment | guard test (`maxHpParity`, `restResourceContract`) | Retro §7d |
| Gate data rows with **declarative keys** checked by `matchesGate`; `applies(ctx)` only for what keys can't say | rule, guard test (edition part of `noDuplicateHelpers`) | Retro §7a |
| Base formulas live only in `shared/abilityMath.js` | guard test (`noDuplicateHelpers`) | Retro §7a |
| **Ship a guard with every consolidation** so the duplicate can't grow back | none as a rule — followed in `892ce4a` | Retro §7d |
| Don't scale an unproven pattern (24 class sheets became 24× reworks) | rule (tripwires), hook (`nth-variant-nudge.mjs`), skill step (`/grill`) | `docs/character-system-backlog.md` |
| **Never declare a component inside a component** | guard test (`noNestedComponents`) | CLAUDE.md Testing |

## Testing

| Lesson | Enforced by | Source |
|---|---|---|
| **Tests check Claude's model of the feature, not the rules**: a green suite can confirm a wrong blurb | skill step (Phase 0) | Retro §2 |
| **Write tests with the feature**, never in a later pass | rule, hook (Stop hook runs `npm test`), memory `feedback_testing_cadence` | CLAUDE.md |
| **Turn QA findings into guard tests**, so a whole category stops recurring | none as a rule — consistently followed | Retro §3 |
| **Every guard carries positive and negative self-tests**, so it cannot pass vacuously | none as a rule — followed by `noLevelAnnotations`, the option-pool guard and the guards added in `892ce4a` | Retro §3, §7d |
| Mocks must match the real contract (the FeatPicker mock once hid a "feats stored with no effects" bug) | none | `FeatsSubTab.test.jsx` header |
| **Await what the assertion depends on**, not what renders first; `SLOW_MOCKS=1` surfaces it | rule | CLAUDE.md Testing |
| **Never run two pytest sessions at once** (a collision looks like 427 failures) | rule | CLAUDE.md Testing |
| **Green tests are not proof it works in the app**: drive the changed flow, or check the real database | skill step (`/ship` Step 3c) | Retro §3, §7d |

## Documentation and context

| Lesson | Enforced by | Source |
|---|---|---|
| **CLAUDE.md is rules and compact reference only**, capped at 100 KB; system descriptions go to `docs/systems/` | guard test (`claudeMdBudget.test.js`), rule, memory `feedback_claude_md_after_tests` | Retro §7c |
| Every `docs/systems` file must be listed in CLAUDE.md's Docs index, and **read before touching that area** | guard test (`claudeMdBudget`), rule | Retro §7c |
| **A proposal that lives only in a retro works only while someone points at it**: write it into a skill | none — this file is the partial fix | Retro §4, §6a |
| **Move documentation verbatim and verify by script**, rather than rewriting it | none | Retro §7d |
| **Log every session with `/log`**, tagged from `TAGS.md`; read logs only when asked | hook (`session-log.mjs`), skill step (`/ship` 5b) | Retro §4 #8 |
| A retro states its sources and their limits | none | Retro §1–§4 header |

## Workflow and git

| Lesson | Enforced by | Source |
|---|---|---|
| **Branch at the start of every session that has a subject**, QA sessions included | hook (`feature-branch-guard.mjs`, `.githooks/pre-commit`), memory `feedback_branch_at_session_start` | CLAUDE.md |
| **Ship only when Robert says `/ship`**; approval does not carry to the next change | memory `feedback_ship_only_on_command` | Polearm Master, 2026-08-14 (recorded in the memory) |
| Short-lived branches, fast-forward merges only | skill step (`/ship`), memory `feedback_git_workflow` | CLAUDE.md |
| **Robert drives QA**: start both servers, report the ports, and wait | memory `feedback_user_drives_qa` | — |
| **Restart the backend yourself** after any `.py` change; a stale uvicorn serves old code | rule, memory `feedback_restart_backend_server` | CLAUDE.md |
| **State a plan before touching 3+ files**; use `/grill` before the Nth variant, `/to-tickets` for multi-slice work | rule, hook (`nth-variant-nudge.mjs`) | CLAUDE.md |
| **For an audit, report first** and let Robert choose scope and order; include a "leave alone" list | none | Retro §7d |
| **A whole-system pass after each class** finds what per-subclass QA can't | none (proposed) | Retro §7g #13 |

## Tooling and environment

| Lesson | Enforced by | Source |
|---|---|---|
| **Write scripts and text with the Write tool, not shell heredocs**: heredocs mangled `\b`, `\s`, `\+` and apostrophes in four sessions running | memory `feedback_shell_edits` | Retro §5b, §7e |
| **Codemod discipline**: check for an existing binding before a rename; scope every `sed` to explicit paths; run the affected tests after each codemod | memory `feedback_shell_edits` | Retro §7e |
| Start servers with the kill-first scripts; Vite is pinned to 5173 | rule | CLAUDE.md |
| Read CI logs with `gh run view --log-failed` (the raw API returns 403 for logs) | memory `reference_github_cli` | — |
| An autogenerated migration against a populated dev DB can be **empty**; open it and check | rule, CI (from-scratch `alembic upgrade head`) | CLAUDE.md |
| **Vitest from a lowercase `c:/` working directory fails every suite** with `Cannot read properties of undefined (reading 'config')` (vitest loads itself twice). It looks like a mass regression. Run from PowerShell / an uppercase `C:` path | memory `feedback_vitest_drive_letter` | Session 2026-11-15 |

## Working with Robert

These are his defaults, observed over many corrections. They are not rules for the code; they are
how to pitch a choice.

| Lesson | Enforced by | Source |
|---|---|---|
| He prefers **RAW-complete** over a simpler build, and **as little left to text** as possible | skill step (`/subclass-features`) | Retro §5b, §2 (Grappler) |
| **"Can't be modelled" is his call**, and he has usually disagreed | rule (prose sign-off) | Retro §2 |
| He rules on presentation by reading the sheet as a player; Claude's checks don't see it | skill step (player read-through) | Retro §2 |
| **Never re-add something he removed** without asking | rule (preserved intent, removed-on-purpose list) | CLAUDE.md |
| Ask the scoping questions before a large or open-ended job, with a recommended option | none | Session 2026-11-14 |
