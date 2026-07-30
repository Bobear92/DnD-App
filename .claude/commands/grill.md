---
description: Alignment gate — interrogate a plan before building, especially the Nth variant of a pattern, a ≥3-file fan-out, or an unproven abstraction
---

Run this BEFORE writing code when the work smells like scale: another class sheet/config, another
subclass-data file, another tab/module, or any change that fans a near-identical edit across ≥3
files. It is the active version of the **Efficiency tripwires** in CLAUDE.md — the passive prose I
can skip. The `nth-variant-nudge` PreToolUse hook fires this automatically when a Write would create
the Nth file of a known scaffold pattern.

**Why this exists:** `docs/character-system-backlog.md` — 24 class sheets were built before the
interaction model was settled, so Epics 1–3 became 24× reworks. A 10-minute interrogation here is
cheaper than a 24× rework. Grill hard; a "no-go / consolidate instead" is a success, not a failure.

## What to grill (`$ARGUMENTS` = the thing about to be built)

Work through these out loud. Where an answer is genuinely the user's call (which pattern, which
slice first, config-vs-sheet), **ask them with AskUserQuestion** — don't assume.

### 1. Pattern & duplication
- Is this the **Nth variant** of an existing pattern? Name the pattern and how many already exist.
- Could a **data-driven config or shared abstraction** (hook/component/helper/table) replace the
  fan-out? Adding a row to `LEVEL_CHOICES` / `SUBCLASS_GRANTS` / a class config is the goal;
  copy-pasting a component is the fallback. (Duplication tripwire: near-identical edit to ≥3 files.)
- If a skill's only job would be "make the same change across N files," say so — that's the
  **skill-as-band-aid** signal; the architecture likely needs consolidation instead.

### 2. Vertical slice proven?
- Is **one** slice proven **end-to-end** — creation → use → edge cases → rest/reset → level-up?
  If not, that slice is the real next task; build/prove it before replicating.
- What broke or surprised us in the last slice? Does this plan absorb that, or repeat it?

### 3. Smallest proving step
- What is the **smallest** thing that proves the interaction model is right? Build that, look at it,
  THEN decide whether to scale. Don't scale an unproven pattern (breadth-before-vertical tripwire).

### 4. Preserved intent
- Are we re-introducing a feature/field/component that was **deliberately removed**? If it's absent
  from the codebase, assume it was removed on purpose — confirm before adding it back.

### 5. Enforcement & blast radius
- What **test / coverage-ratchet / config-contract** will guard this so it can't silently regress?
  (New class config → registered in `CONFIGS`, auto-guarded by `configContracts.test.js`; new
  mechanization → will it move the coverage ratchet, and should the baseline bump?)
- Which files change, which tests get written/updated, which CLAUDE.md sections need editing? If
  that list is ≥3 files, restate it as a plan first (CLAUDE.md "Multi-file changes — plan first").

## Output

End with one of:
- **GO** — a proven-slice-first plan: the smallest slice, its test, then the scale step (data entry,
  not fan-out). Then proceed (re-issue the blocked Write if the hook fired).
- **NO-GO / CONSOLIDATE** — the fan-out is premature or should be a shared abstraction; describe the
  consolidation and confirm direction with the user before writing code.

$ARGUMENTS
