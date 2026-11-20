/**
 * Branch guards — first-deploy ticket T9.
 *
 * `production` is what Render deploys. It must only move by fast-forward to a commit already on
 * `main` (/release) or back to a release tag (rollback); a commit made on it would go live without
 * ever having been on `main` or through CI. Two hooks protect it, and `main`, from direct work:
 *
 *   • .githooks/pre-commit — refuses a COMMIT on main/master/production, whatever drives git;
 *   • .claude/hooks/feature-branch-guard.mjs — interrupts Claude's first EDIT on those branches.
 *
 * Neither had a test before T9. Each case below builds a throwaway git repo on the branch in
 * question and runs the real hook against it.
 */
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = path.resolve(process.cwd(), '..');
const HOOKS_DIR = path.join(REPO, '.githooks').replace(/\\/g, '/');
const EDIT_GUARD = path.join(REPO, '.claude', 'hooks', 'feature-branch-guard.mjs');

const made = [];
afterAll(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
});

function git(dir, ...args) {
  return spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
}

/** A fresh repo with one commit on `main`, then checked out on `branch`. */
function repoOn(branch) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'branch-guard-'));
  made.push(dir);
  execFileSync('git', ['-C', dir, 'init', '-q', '-b', 'main']);
  for (const [k, v] of [['user.name', 'Test'], ['user.email', 'test@example.com'], ['commit.gpgsign', 'false']]) {
    execFileSync('git', ['-C', dir, 'config', k, v]);
  }
  fs.writeFileSync(path.join(dir, 'a.txt'), 'one\n');
  execFileSync('git', ['-C', dir, 'add', '.']);
  execFileSync('git', ['-C', dir, 'commit', '-q', '--no-verify', '-m', 'init']);
  if (branch !== 'main') execFileSync('git', ['-C', dir, 'checkout', '-q', '-b', branch]);
  execFileSync('git', ['-C', dir, 'config', 'core.hooksPath', HOOKS_DIR]);
  return dir;
}

function tryCommit(dir) {
  fs.appendFileSync(path.join(dir, 'a.txt'), 'more\n');
  git(dir, 'add', '.');
  return git(dir, 'commit', '-q', '-m', 'change');
}

function runEditGuard(dir, tool = 'Edit') {
  const payload = {
    tool_name: tool,
    tool_input: { file_path: path.join(dir, 'a.txt') },
    // A unique session per call: the guard fires once per session, keyed on this id.
    session_id: `branch-guard-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  return spawnSync(process.execPath, [EDIT_GUARD], { input: JSON.stringify(payload), encoding: 'utf8' });
}

describe('.githooks/pre-commit', () => {
  it('refuses a commit on production and says how production moves', () => {
    const r = tryCommit(repoOn('production'));
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/Refusing to commit on 'production'/);
    expect(r.stdout + r.stderr).toMatch(/\/release/);
  });

  it('still refuses a commit on main', () => {
    const r = tryCommit(repoOn('main'));
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/Refusing to commit directly on 'main'/);
  });

  it('allows a commit on a feature branch (self-test: the hook is really running and not refusing everything)', () => {
    const r = tryCommit(repoOn('feature/x'));
    expect(r.status).toBe(0);
  });

  it('does not block a fast-forward of production (/release creates no commit)', () => {
    const dir = repoOn('feature/x');
    expect(tryCommit(dir).status).toBe(0);
    git(dir, 'checkout', '-q', 'main');
    expect(git(dir, 'merge', '-q', '--ff-only', 'feature/x').status).toBe(0);
    git(dir, 'checkout', '-q', '-b', 'production', 'HEAD~1');
    expect(git(dir, 'merge', '-q', '--ff-only', 'main').status).toBe(0);
  });
});

describe('.claude/hooks/feature-branch-guard.mjs', () => {
  it.each(['production', 'main'])('blocks the first edit on %s (exit 2)', (branch) => {
    const r = runEditGuard(repoOn(branch));
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(new RegExp(`You are on '${branch}'`));
  });

  it('lets an edit through on a feature branch', () => {
    expect(runEditGuard(repoOn('feature/x')).status).toBe(0);
  });

  it('ignores tools other than Write/Edit', () => {
    expect(runEditGuard(repoOn('production'), 'Read').status).toBe(0);
  });
});
