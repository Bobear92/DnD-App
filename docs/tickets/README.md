# Ticket worklists

Durable, resumable decompositions of large multi-slice features, one file per feature
(`<slug>.md`), produced by the `/to-tickets` skill.

Each worklist is proven-slice-first: **T1 always proves one unit end-to-end (with its test)** before
any replication ticket starts. Remaining tickets should be mostly data entry — if they aren't, the
abstraction isn't ready (a `/grill` NO-GO, not a ticket).

These files are the cross-session source of truth for in-flight work: a later session opens the
relevant worklist and continues from the first unchecked ticket. The unit lists come from the
machine worklists — the coverage reports (`npm run report:class-coverage`,
`report_feat_effects.py`, `docs/spell-upcast-review.md`) and `docs/character-system-backlog.md`.

Updating a ticket's checkbox is part of that ticket's `/ship`. When every box is checked, leave the
file as the audit trail.
