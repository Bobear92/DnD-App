---
description: Run the backend test suite and report results
---

Run the backend integration tests for this D&D app.

> **Never run two pytest sessions concurrently.** The session fixture does
> `DROP SCHEMA public CASCADE` on `dnd_app_test` at session start, so a second run destroys the
> first one's schema mid-test. It looks like a catastrophic regression (one collision produced
> 427 failed / 270 errors) but is pure interference. Before starting a run, make sure no other
> pytest is already going — including one you backgrounded. If a run comes back with mass
> failures, re-run it alone before debugging anything.

## Steps

1. Activate the virtual environment and run pytest from `backend/`:
   ```bash
   cd backend
   source venv/Scripts/activate
   pytest -v 2>&1
   ```

2. Report the results:
   - How many passed / failed / errored
   - For any failures: the test name, the assertion that failed, and what the actual vs. expected values were
   - If all tests pass: confirm the count and note if any warnings need attention

3. If tests fail:
   - Check whether the failure is in a test file or in production code
   - If it's a test file issue (wrong expected value, stale fixture), fix the test
   - If it's a production code regression, flag it clearly and do not silently fix it — report to the user first

## Arguments
$ARGUMENTS
