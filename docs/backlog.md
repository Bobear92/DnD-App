# Not yet built

Moved out of CLAUDE.md on 2026-11-23: what is genuinely missing or deferred. Descriptions of what IS built live in `docs/systems/` and `docs/frontend-map.md`; active, ordered work lives in `docs/tickets/`. When something here is built, delete its line.

## Frontend


### Character system
- **Action Economy for the other 12 classes** — the curated class-feature map covers Fighter only (auto-derived weapon/spell/universal entries work for everyone). Also open: a "rider" convention for no-action abilities (Sneak Attack, Divine Smite, Rage); wiring chosen options into the tab (Battle Master maneuvers incl. the Parry + Riposte reaction cards, Metamagic, Invocations); the un-wired Attack-action combos (War Priest, Sudden Strike, Monk Martial Arts/Flurry, Commander's Strike). → [action-economy](systems/action-economy.md)
- **Unified Spells tab** — 1 of 15 caster sheets converted; the rest is per-class work. → [spells](systems/spells.md), `docs/tickets/unified-spells-tab.md`
- **Hand-written class sheets** — only Fighter and Wizard are data-driven configs; the others migrate via `/class-config`.
- **Arcane Trickster** — data entry in `subclassCasterData.js`, blocked on Rogue becoming data-driven. → [spells](systems/spells.md)
- **Inventory polish** — weight/encumbrance, 2024 weapon mastery, custom (non-encyclopedia) loot, equipping magic weapons/armor, worn items such as jewelry, auto-spending ammo. → [inventory](systems/inventory.md)
- **2024 starting equipment and 2024 backgrounds** — creation uses the 2014 backgrounds. → [inventory](systems/inventory.md)
- **2024 ASI/feat flow** — unvalidated (feat categories, half-feat ASIs); pending feat clauses are listed by `report_feat_effects.py`. → [feat-effects](systems/feat-effects.md)
- **Level-up pools still to author** — Expertise, Fighting Style for non-Fighters, Pact Boon; prerequisite gating beyond `minLevel`. → [level-up-and-grants](systems/level-up-and-grants.md)
- **Models that do not exist yet** (each keeps several features as prose): surprise state (deferred by the user until enough features need it), a Conditions panel, concentration/durations, mounts & vehicles, companions with real hit points (wants the Bestiary), a display for creature size. → [sheet-panels](systems/sheet-panels.md), [active-effects](systems/active-effects.md)
- **Un-authored data rows** — equipment-gated features (Protection, Interception, Defensive Duelist, …) and save features (Aura of Protection, Indomitable, Danger Sense, …). → [inventory](systems/inventory.md), [sheet-panels](systems/sheet-panels.md)
- **Encounters beyond V1** — monsters (waiting on the Bestiary), turn/round tracking, players rolling on their own screens. → [rest-and-initiative](systems/rest-and-initiative.md)
- **Mechanics pages still owed** — Conditions, Concentration. → [mechanics-pages](systems/mechanics-pages.md)


### Elsewhere in the app
- Multiclassing support (deferred — will be its own feature after both editions complete)
- **Character personality (traits / ideals / bonds / flaws) — NOT BUILT.** NPCs have these columns; characters don't, though backgrounds carry unused `characteristics`. Proven shape: a sibling JSONB column + a catalog beside `appearance/appearanceData.js`, a second Narrative-tab card, background traits as datalist suggestions.
- Loot table UI
- **Post-deploy follow-ups** — security fixes, Robert's smoke-test to-dos (invite by username, owner on GM cards, cross-tab login, player Locations view), the items deep dive, going live with Postmark (domain + DNS), ops: [tickets/post-deploy-followups.md](tickets/post-deploy-followups.md).
- **World items for world-building campaigns** (agreed Nov 2026): a lore list of notable items (description, picture, linked NPCs) visible in world-building mode — a new module (encyclopedia items have no image/NPC link). Also: the create-campaign modal doesn't offer `campaign_mode` yet.
- Encyclopedia browsing UI — Classes, Skills, Spells, Items (Weapons/Armor/Gear/Potions/Magic Items/Food & Drink — system browse + GM override + campaign homebrew + edit), Feats, and **Mechanics** (game-mechanic reference pages) tabs exist; Monsters tab not yet built. Items are not yet integrated into the character sheet (Weapons & Armor tab inventory is the next step)
- Admin panels (manage base compendium: races, backgrounds, feats, spells, items, creatures)
- GM panels (campaign overrides + homebrew content management)
- Persistent/global music player (deferred — current `MusicPlayer` is inline per-page and stops on navigation; a root-level context player that keeps ambience playing across pages is a future enhancement)


## Backend — Design Gaps (Need Schema + Logic Changes)

- **2024 spell text is authored incrementally.** `spells` now has an `edition` column, but only spells whose 2024 text genuinely differs need a 5.5e row (currently just Blade Ward). Every other spell serves its 5e text to 2024 campaigns via the fallback in `get_all_spells` — correct for most spells, but wrong wherever WotC rewrote one (e.g. True Strike, the damage cantrips' scaling). Adding a 5.5e row to `seed_phb_spells.py` is all it takes to fix any given spell.
- Non-SRD spells are missing from the compendium (the API seed is SRD-only). `seed_phb_spells.py` curates them in; currently Blade Ward + Friends. Others (the 15 non-SRD Artificer spells: Absorb Elements, Catapult, …; XGE/TCoE spells) are still absent — a character who knows one sees an empty spell-detail dialog.
- **Structured upcast data (future, tied to GM spell creation).** The Cast dialog computes upcast damage/DC by PARSING the free-form `higher_level`/`description` prose (`spellUpcast.js`) — honest but only ~31% of scaling spells parse cleanly (see `docs/spell-upcast-review.md`). The durable fix is a small structured upcast field on the `spells` table (like `feats.effects`: `{kind:'damage'|'healing'|'targets'|'duration'|…, dice/amount, per_levels}`) captured by the GM spell-creation form, so homebrew + newly-seeded spells are AUTHORED not parsed, and the prose parser shrinks to a legacy-catalog concern. A `/spell-effects` authoring skill (mirroring `/feat-effects`) would follow if we adopt this.
- Content copy/export between a GM's campaigns not yet implemented

