/**
 * PreToolUse(Write|Edit) guard — enforces the "short-lived feature branches" workflow in CLAUDE.md.
 *
 * `main` is the deployable trunk. The rule is to branch BEFORE touching files, but that is a
 * judgment call that is easy to skip — it was skipped in the session that added this hook, and the
 * whole feature landed as a direct commit on `main`. This turns the rule into an actual interrupt:
 * the first Write/Edit to a repo file while `main` is checked out is blocked with instructions to
 * branch. Uncommitted changes carry across `git checkout -b`, so branching is always safe — nothing
 * already edited is lost.
 *
 * It fires ONCE per session (a tmp marker keyed by session_id), matching nth-variant-nudge: after
 * you branch (or deliberately re-issue), it gets out of the way. It is a checkpoint, not a wall —
 * a hard block would strand legitimate cases like resolving a merge on `main`.
 *
 * The hard backstop is `.githooks/pre-commit`, which refuses a COMMIT on `main` regardless of what
 * tooling is driving. This hook catches the problem earlier; that one catches it for certain.
 *
 * Mechanism: exit 2 + stderr blocks a PreToolUse and feeds the message back to Claude. Any error →
 * exit 0 (fail-open): a guard bug must never block editing.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const norm = (p) => (p || '').replace(/\\/g, '/');

/** Walk up from a file to the repo root (the dir containing .git). Null if it isn't in one. */
function findRepoRoot(filePath) {
  let dir = path.posix.dirname(norm(filePath));
  for (let i = 0; i < 40 && dir && dir !== '/'; i += 1) {
    if (fs.existsSync(path.posix.join(dir, '.git'))) return dir;
    const parent = path.posix.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function currentBranch(repo) {
  try {
    return execFileSync('git', ['-C', repo, 'branch', '--show-current'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function main() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { process.exit(0); }
  let payload;
  try { payload = JSON.parse(raw); } catch { process.exit(0); }

  if (!['Write', 'Edit'].includes(payload.tool_name)) process.exit(0);

  const filePath = norm(payload.tool_input?.file_path);
  if (!filePath) process.exit(0);

  // Scratchpad / anything outside a git repo is not the workflow's concern.
  const repo = findRepoRoot(filePath);
  if (!repo) process.exit(0);

  const branch = currentBranch(repo);
  if (branch !== 'main' && branch !== 'master') process.exit(0);

  // One interrupt per session.
  const session = String(payload.session_id || 'no-session').replace(/[^\w.-]/g, '_');
  const marker = path.join(os.tmpdir(), `feature-branch-guard-${session}`);
  if (fs.existsSync(marker)) process.exit(0);
  try { fs.writeFileSync(marker, new Date().toISOString()); } catch { process.exit(0); }

  process.stderr.write(
    `⛔ You are on '${branch}' — branch before editing.\n\n`
    + 'CLAUDE.md → Development Workflow: short-lived feature branches, merged to main on every ship. '
    + '`main` is the deployable trunk and should never carry in-progress work.\n\n'
    + '  git checkout main && git pull --ff-only && git checkout -b feature/<short-name>\n\n'
    + 'Any edits you have already made carry across `git checkout -b`, so nothing is lost. '
    + '/ship will fast-forward main back onto the branch at the end.\n\n'
    + 'This fires once per session. If you genuinely need to work on '
    + `'${branch}' (e.g. resolving a merge), just re-issue — it will let you through now.\n`,
  );
  process.exit(2);
}

try { main(); } catch { process.exit(0); }
