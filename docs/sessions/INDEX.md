# Session index

<!-- Regenerated after every response by .claude/hooks/session-log.mjs from each log's frontmatter. Do not edit by hand: edit the log's frontmatter (or run /log) instead. -->

Areas: `character-system` · `campaign-tools` · `encyclopedia` · `backend` · `tooling`. ⚠ = Robert interrupted or took over at least once.
To find every session on a subject, use the **Tags** index at the bottom, or grep the logs' frontmatter: `grep -rl "tags:.*rune-knight" docs/sessions`. Tag vocabulary: [TAGS.md](TAGS.md).

## 2026-11

| Date | Start | Session | Area | Tags | Issues | Summary | Turns | ⚠ |
|---|---|---|---|---|---|---|---|---|
| 2026-11-23 | 23:26 | [Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) | backend | tooling, docs, bugfix, security, deployment, campaign-tools, encyclopedia, migration, consolidation, user-rule, auth, seed-data, items-tab, data-safety |  | T2→v0.2.0; T3→v0.3.0; API client→v0.3.1; password reset→v0.4.0; links GM-only; items worklist + potions | 51 | ⚠ |
| 2026-11-23 | 18:53 | [CLAUDE.md trim to 53 KB](2026-11/23/1853_claude-md-file-cleanup.md) | tooling | docs, tooling, claude-md, consolidation | rework | Post-deploy T1 — CLAUDE.md 99.7→53 KB: schema/api/backlog docs split out, budget cap 100→60 KB, stale refs fixed | 14 | ⚠ |
| 2026-11-15 | 17:50 | [First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) | tooling | docs, build, consolidation, deployment, data-safety, security, migration, seed-data, user-rule, guard-test, tooling | rework | Prod deploy done: T1–T9 live (v0.1.0), T10 security fixes as v0.1.1, smoke test passed, CI deploys on production | 146 | ⚠ |
| 2026-11-15 | 12:57 | [World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md) | campaign-tools | build, campaign-mode, campaign-settings, campaign-tools, encounters, encyclopedia, character-list, migration, claude-md |  | GM toggle hides character sheets, encounters, encyclopedia, rules settings and NPC stats; Settings moved to nav top | 6 | ⚠ |
| 2026-11-14 | 11:35 | [Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) | character-system | consolidation, bugfix, docs, tooling, fighter, rest-endpoint, rest-resources, max-hp, feat-acquisition, feat-effects, feature-gate, character-context, ability-math, attack-riders, entry-riders, equipment-features, active-effects, defenses, save-features, save-proficiencies, companions, action-economy, features-tab, level-up-wizard, character-create, character-list, claude-md, great-weapon-master, guard-test, retro | rework | Audited Fighter + shared systems; fixed long-rest HP, consolidated 6 duplications, CLAUDE.md 240→95 KB; lessons index | 22 | ⚠ |
| 2026-11-04 | 08:26 | [Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) | character-system | qa, docs, retro, tooling, fighter, samurai, elegant-courtier, tireless-spirit, rapid-strike, strength-before-death, starting-equipment, race-traits, save-features, save-proficiencies, auto-effects, character-create, level-up-wizard, stats-tab, encounters, theme, claude-md, 5e | computed-not-shown, presentation, mechanism-extended | Samurai QA (no mechanic bugs); equipment picker, racial save traits, wizard auto-effects, save provenance; dark: on | 18 | ⚠ |

## 2026-10

| Date | Start | Session | Area | Tags | Issues | Summary | Turns | ⚠ |
|---|---|---|---|---|---|---|---|---|
| 2026-10-28 | 15:34 | [Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) | character-system | build, fighter, samurai, 5e, bonus-proficiencies, fighting-spirit, elegant-courtier, rapid-strike, strength-before-death, subclass-grants, active-effects, attack-riders, rest-resources, skill-bonuses, save-proficiencies, action-economy, stats-tab, level-up-wizard, rest-endpoint, prose-signoff, session-logs, tooling | raw-correction, mechanism-extended | Samurai L3-20 (5e): Fighting Spirit active effect + temp HP, Elegant Courtier, Rapid Strike, SBD; empty session logs removed | 5 | ⚠ |
| 2026-10-26 | 14:28 | [Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md) | character-system | build, qa, fighter, rune-knight, bonus-proficiencies, subclass-proficiencies, fire-rune, tool-checks, runic-juggernaut, runic-shield, great-stature, giants-might, weapon-reach, active-effects, items-tab, action-economy, guard-test, prose-signoff, surprise, 5e | raw-correction, computed-not-shown, mechanism-extended, prose-to-mechanic | Rune Knight L3-20 audit: RAW text fixes, Bonus Proficiencies, Fire Rune tool doubling, Juggernaut reach + Large/Huge pick | 5 | ⚠ |
| 2026-10-26 | 13:53 | [Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md) | tooling | tooling, docs, retro, user-rule, session-logs, claude-md, fighter, champion, battle-master, eldritch-knight, arcane-archer, cavalier, echo-knight, psi-warrior, rune-knight, subclass-proficiencies | rework | Session-log hook + /log, day folders, tag list + issues field; no Fighter transcripts survived; Fighter retro written | 6 | ⚠ |

## Tags

- **5e** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **ability-math** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **action-economy** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **active-effects** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **arcane-archer** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **attack-riders** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **auth** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md)
- **auto-effects** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **battle-master** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **bonus-proficiencies** — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **bugfix** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **build** — [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **campaign-mode** — [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md)
- **campaign-settings** — [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md)
- **campaign-tools** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md)
- **cavalier** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **champion** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **character-context** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **character-create** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **character-list** — [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **claude-md** — [2026-11-23 CLAUDE.md trim to 53 KB](2026-11/23/1853_claude-md-file-cleanup.md) · [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **companions** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **consolidation** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-23 CLAUDE.md trim to 53 KB](2026-11/23/1853_claude-md-file-cleanup.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **data-safety** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md)
- **defenses** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **deployment** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md)
- **docs** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-23 CLAUDE.md trim to 53 KB](2026-11/23/1853_claude-md-file-cleanup.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **echo-knight** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **eldritch-knight** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **elegant-courtier** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **encounters** — [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **encyclopedia** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md)
- **entry-riders** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **equipment-features** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **feat-acquisition** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **feat-effects** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **feature-gate** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **features-tab** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **fighter** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **fighting-spirit** — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **fire-rune** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **giants-might** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **great-stature** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **great-weapon-master** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **guard-test** — [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **items-tab** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **level-up-wizard** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **max-hp** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md)
- **migration** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-15 World-building-only campaign mode](2026-11/15/1257_world-building-only-toggle.md)
- **prose-signoff** — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **psi-warrior** — [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **qa** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **race-traits** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **rapid-strike** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **rest-endpoint** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **rest-resources** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **retro** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **rune-knight** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **runic-juggernaut** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **runic-shield** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **samurai** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **save-features** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **save-proficiencies** — [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **security** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md)
- **seed-data** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md)
- **session-logs** — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **skill-bonuses** — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **starting-equipment** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **stats-tab** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **strength-before-death** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **subclass-grants** — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md)
- **subclass-proficiencies** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **surprise** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **theme** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **tireless-spirit** — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)
- **tool-checks** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **tooling** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-23 CLAUDE.md trim to 53 KB](2026-11/23/1853_claude-md-file-cleanup.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **user-rule** — [2026-11-23 Post-deploy tickets T2-T6, releases v0.2-v0.4](2026-11/23/2326_ship-issue.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **weapon-reach** — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)

## Issues

- **raw-correction** (2) — [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **computed-not-shown** (2) — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **mechanism-extended** (3) — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md) · [2026-10-28 Samurai subclass built to level 20](2026-10/28/1534_samurai-fighter-subclass-build.md) · [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **prose-to-mechanic** (1) — [2026-10-26 Rune Knight finished to level 20](2026-10/26/1428_rune-knight-subclass-qa.md)
- **rework** (4) — [2026-11-23 CLAUDE.md trim to 53 KB](2026-11/23/1853_claude-md-file-cleanup.md) · [2026-11-15 First production deploy, T1–T10 complete](2026-11/15/1750_first-production-deployment-plan.md) · [2026-11-14 Fighter and shared-systems consolidation pass](2026-11/14/1135_fighter-subclass-code-simplification-review.md) · [2026-10-26 Session logs, Fighter retro, Rune Knight plan](2026-10/26/1353_session-logs-and-fighter-retro.md)
- **presentation** (1) — [2026-11-04 Samurai QA and Fighter retro update](2026-11/04/0826_frontend-and-backend-startup-for-samurai-qa.md)

### Issues by class / subclass

| Subject | raw-correction | computed-not-shown | mechanism-extended | prose-to-mechanic | rework | presentation |
|---|---|---|---|---|---|---|
| fighter | 2 | 2 | 3 | 1 | 2 | 1 |
| champion |  |  |  |  | 1 |  |
| battle-master |  |  |  |  | 1 |  |
| eldritch-knight |  |  |  |  | 1 |  |
| arcane-archer |  |  |  |  | 1 |  |
| cavalier |  |  |  |  | 1 |  |
| echo-knight |  |  |  |  | 1 |  |
| psi-warrior |  |  |  |  | 1 |  |
| rune-knight | 1 | 1 | 1 | 1 | 1 |  |
| samurai | 1 | 1 | 2 |  |  | 1 |
