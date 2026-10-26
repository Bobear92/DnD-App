# Session log tag list

The controlled vocabulary for the `tags:` and `issues:` fields in session logs. `/log` picks from
this list. **When a session needs a tag that isn't here, add it to the right section in the same
change** — don't invent a synonym for one that exists. INDEX.md flags any tag a log uses that is
missing from this file.

Format: lowercase kebab-case, singular. One line per tag: `` - `tag` — what it means ``.
The hook reads the backticked tag at the start of each line, so keep that shape.

## Issues (the `issues:` field only)

What went wrong in the session. Counted in INDEX.md per issue and per class/subclass, so a retro
can see whether a problem is shrinking. Mark one only when it actually happened.

- `raw-correction` — stored rules text (a feature blurb, pool option or feat) was wrong and had to be corrected
- `wrong-surface` — a feature was placed on one surface and then moved to another
- `computed-not-shown` — a value was computed correctly but nothing displayed it (or a field had no reader)
- `mechanism-extended` — an existing shared table/mechanism needed a new field mid-build
- `prose-to-mechanic` — a clause left as prose turned out to be buildable and was built
- `rework` — files built earlier in the same feature had to be re-edited
- `presentation` — a correct number or card read wrong at the table (doubled damage, a "+2" beside a total)

## Kind of work

- `build` — new mechanics or features
- `qa` — a QA pass (Robert drives the app; fixes follow)
- `bugfix` — fixing a defect outside a QA pass
- `consolidation` — merging duplicated code/tables into a shared mechanism
- `docs` — documentation, CLAUDE.md, retros, plans
- `tooling` — hooks, skills, commands, scripts, CI

## Mechanisms (shared tables and modules)

- `attack-riders` — `ATTACK_RIDERS` (riders on weapon attack cards)
- `entry-riders` — `ENTRY_RIDERS` (riders on one named entry)
- `attached-features` — `ATTACHED_FEATURES` / `attachedAs` (limited-use features riding on an attack)
- `subclass-grants` — `subclassGrants.js` (subclass choices at level-up)
- `subclass-spells` — `subclassSpells.js` (fixed subclass spell grants)
- `subclass-proficiencies` — fixed subclass proficiency grants (`SUBCLASS_PROF_GRANTS_5E`)
- `level-choices` — `levelChoicesData.js` (learn-N-from-a-pool)
- `rest-resources` — config `restResources` / `RestResourceControl` / rest trackers
- `active-effects` — `effects/activeEffects.js`
- `defenses` — `defenses/defenses.js` (resistances, immunities, damage reduction)
- `save-features` — `skills/saveFeatures.js`
- `skill-advantage` — `skills/skillAdvantage.js`
- `senses` — `senses/senses.js`
- `companions` — `companions/companionData.js`
- `equipment-features` — `inventory/equipmentFeatures.js` (features an item unlocks)
- `feat-effects` — feat `effects` model (`featEffects.js` + `seed_feats.py`)
- `class-config` — data-driven class configs (`ClassSheet`)
- `initiative` — `initiativeData.js` + `_INITIATIVE_RESOURCES`

## Systems and surfaces

- `action-economy` — the Action Economy tab
- `items-tab` — Items tab / inventory
- `stats-tab` — Stats tab (identity, abilities & skills, HP & movement)
- `spells-tab` — Spells tab
- `features-tab` — Features tab (class features, feats)
- `narrative-tab` — Narrative tab
- `level-up-wizard` — LevelUpWizard
- `character-create` — CharacterCreate
- `encyclopedia` — encyclopedia pages and tabs
- `mechanics-page` — an encyclopedia Mechanics reference page
- `encounters` — the GM encounters / initiative page
- `campaign-tools` — NPCs, locations, calendar, timeline, sessions
- `session-logs` — the session-log system itself

## Risk and backend

- `migration` — an Alembic migration
- `seed-data` — seed scripts (`seed_feats.py`, `seed_items.py`, …)
- `rest-endpoint` — the rest / initiative endpoint (`_compute_rest_patch`, `_INITIATIVE_RESOURCES`)
- `snapshot-backfill` — fixing data snapshotted onto stored characters
- `5e` — the session was specifically about 2014 rules
- `2024` — the session was specifically about 2024 rules

## Decisions

- `user-rule` — Robert set a standing rule
- `prose-signoff` — Robert ruled on prose-only items
- `guard-test` — a QA finding became a guard test
- `retro` — a retrospective was written

## Subject — classes and subclasses

Open-ended: add each class and subclass the first time a session touches it. Always tag BOTH the
class and the subclass. Counted against issues in INDEX.md.

- `fighter`
- `champion`
- `battle-master`
- `eldritch-knight`
- `arcane-archer`
- `cavalier`
- `echo-knight`
- `psi-warrior`
- `rune-knight`
- `samurai`
- `barbarian`
- `bard`
- `cleric`
- `druid`
- `monk`
- `paladin`
- `ranger`
- `rogue`
- `sorcerer`
- `warlock`
- `wizard`
- `artificer`

## Subject — feats, features, options and other subjects

Open-ended: add a feat, named feature or pool option when a session does real work on it.

- `claude-md` — CLAUDE.md content
- `grappler`
- `sharpshooter`
- `great-weapon-master`
- `shield-master`
- `sentinel`
- `polearm-master`
- `tavern-brawler`
- `giants-might`
- `channel-rune`
- `rune-carving`
- `bonus-proficiencies`
- `grapple`
