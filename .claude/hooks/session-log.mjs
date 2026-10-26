/**
 * Session log — one markdown file per Claude Code session, under docs/sessions/YYYY-MM/.
 *
 *   node session-log.mjs start   (SessionStart hook) — create this session's log file
 *   node session-log.mjs stop    (Stop hook)         — append every new turn, refresh INDEX.md
 *
 * Why a hook and not a CLAUDE.md instruction: "after every response, update the log" is exactly
 * the kind of rule that gets skipped (see feature-branch-guard.mjs). A hook runs every time and
 * costs no tokens.
 *
 * What the hook writes (mechanical, every turn):
 *   - frontmatter: session_id, date, started, branch, turns, stepped_in, last_uuid
 *   - "## Turn log": one entry per turn — Robert's prompt, Claude's final reply (both truncated),
 *     files Claude edited, commands run, and a ⚠ flag when Robert interrupted the turn
 *   - docs/sessions/_raw/<session_id>.jsonl: a copy of the full transcript (gitignored)
 *   - docs/sessions/INDEX.md: regenerated from every log's frontmatter, newest first
 *
 * What Claude writes (judgment, via /log): title, area, tags, summary, and the Summary /
 * Where Claude struggled / Decisions / Open threads sections. The hook never touches those.
 *
 * File naming: YYYY-MM-DD_HHMM_<slug>.md. The slug starts as "session" (sessions begin on main,
 * before the feature branch exists) and is renamed to the branch name the first time a Stop
 * fires on a feature branch.
 *
 * Fail-open: any error exits 0 silently. A logging bug must never block a turn.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SESSIONS = path.join(ROOT, 'docs', 'sessions');
const RAW = path.join(SESSIONS, '_raw');
const INDEX = path.join(SESSIONS, 'INDEX.md');
const TURN_LOG_HEADING = '## Turn log';
const PROMPT_MAX = 600;
const REPLY_MAX = 900;
const AREAS = ['character-system', 'campaign-tools', 'encyclopedia', 'backend', 'tooling'];

// ---------- small helpers ----------

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function currentBranch() {
  try {
    return execFileSync('git', ['-C', ROOT, 'branch', '--show-current'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function branchSlug(branch) {
  if (!branch || branch === 'main' || branch === 'master') return '';
  return branch.replace(/^(feature|fix|bugfix|chore|qa)\//, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function truncate(s, max) {
  const t = (s || '').trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()} …` : t;
}

/** Quote a block of text as a markdown blockquote so headings/lists inside it can't break the log. */
function quote(s) {
  return s.split(/\r?\n/).map((l) => `> ${l}`).join('\n');
}

// ---------- frontmatter ----------

function parseLog(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fm = {};
  if (!m) return { fm, body: text };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: text.slice(m[0].length) };
}

const FM_ORDER = ['session_id', 'title', 'date', 'started', 'branch', 'area', 'tags', 'summary', 'turns', 'stepped_in', 'last_uuid'];

function serializeLog(fm, body) {
  const keys = [...FM_ORDER.filter((k) => k in fm), ...Object.keys(fm).filter((k) => !FM_ORDER.includes(k))];
  return `---\n${keys.map((k) => `${k}: ${fm[k]}`).join('\n')}\n---\n${body}`;
}

// ---------- locating / creating the log ----------

function allLogs() {
  const out = [];
  if (!fs.existsSync(SESSIONS)) return out;
  for (const month of fs.readdirSync(SESSIONS)) {
    const dir = path.join(SESSIONS, month);
    if (!/^\d{4}-\d{2}$/.test(month) || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.md')) out.push(path.join(dir, f));
  }
  return out;
}

function findLog(sessionId) {
  for (const file of allLogs()) {
    const head = fs.readFileSync(file, 'utf8').slice(0, 400);
    if (head.includes(`session_id: ${sessionId}`)) return file;
  }
  return null;
}

function createLog(sessionId, now = new Date()) {
  const branch = currentBranch();
  const slug = branchSlug(branch) || 'session';
  const dir = path.join(SESSIONS, ymd(now).slice(0, 7));
  fs.mkdirSync(dir, { recursive: true });
  let file = path.join(dir, `${ymd(now)}_${hm(now).replace(':', '')}_${slug}.md`);
  for (let n = 2; fs.existsSync(file); n += 1) {
    file = path.join(dir, `${ymd(now)}_${hm(now).replace(':', '')}_${slug}-${n}.md`);
  }
  const fm = {
    session_id: sessionId,
    title: '',
    date: ymd(now),
    started: hm(now),
    branch: branch || 'unknown',
    area: '',
    tags: '[]',
    summary: '',
    turns: '0',
    stepped_in: 'false',
    last_uuid: '',
  };
  const body = [
    '',
    `# Session ${ymd(now)} ${hm(now)}`,
    '',
    `<!-- Claude fills the sections below with /log. area is one of: ${AREAS.join(', ')} -->`,
    '',
    '## Summary',
    '',
    '_Not written yet — run /log._',
    '',
    '## Where Claude struggled / where Robert stepped in',
    '',
    '_Not written yet — run /log. Robert: add your own notes here too._',
    '',
    '## Decisions',
    '',
    '_None recorded._',
    '',
    '## Open threads',
    '',
    '_None recorded._',
    '',
    TURN_LOG_HEADING,
    '',
    '<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->',
    '',
  ].join('\n');
  fs.writeFileSync(file, serializeLog(fm, body));
  return file;
}

// ---------- transcript parsing ----------

function readTranscript(p) {
  if (!p || !fs.existsSync(p)) return [];
  const out = [];
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* skip partial line */ }
  }
  return out;
}

function blocks(entry) {
  const c = entry?.message?.content;
  if (typeof c === 'string') return [{ type: 'text', text: c }];
  return Array.isArray(c) ? c : [];
}

const INTERRUPT_RE = /^\[Request interrupted by user/;

/** Turn a raw user text into what Robert actually typed (strip IDE/system wrappers, render slash commands). */
function cleanPrompt(raw) {
  let t = raw || '';
  const cmd = t.match(/<command-name>([\s\S]*?)<\/command-name>/);
  if (cmd) {
    const args = (t.match(/<command-args>([\s\S]*?)<\/command-args>/) || [])[1] || '';
    return `${cmd[1].trim()} ${args.trim()}`.trim();
  }
  t = t.replace(/<(system-reminder|ide_opened_file|ide_selection|ide_diagnostics|local-command-stdout|local-command-stderr|command-message)>[\s\S]*?<\/\1>/g, '');
  return t.trim();
}

/** Classify a user entry: 'prompt' (Robert typed something), 'interrupt', or null (tool result / meta). */
function userKind(entry) {
  if (entry.type !== 'user' || entry.isMeta || entry.isCompactSummary) return null;
  const bs = blocks(entry);
  if (bs.some((b) => b.type === 'tool_result')) return null;
  const text = bs.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  if (INTERRUPT_RE.test(text.trim())) return 'interrupt';
  return cleanPrompt(text) ? 'prompt' : null;
}

/**
 * Split the transcript AFTER lastUuid into turns. A turn starts at a prompt Robert typed and runs
 * until the next one. Returns [{ when, prompt, reply, files, commands, interrupted, lastUuid }].
 */
function newTurns(entries, lastUuid) {
  let start = 0;
  if (lastUuid) {
    const i = entries.findIndex((e) => e.uuid === lastUuid);
    if (i >= 0) start = i + 1;
  }
  const turns = [];
  let cur = null;
  for (const e of entries.slice(start)) {
    const kind = userKind(e);
    if (kind === 'prompt') {
      const text = blocks(e).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      cur = { when: e.timestamp ? new Date(e.timestamp) : new Date(), prompt: cleanPrompt(text), texts: [], tools: 0, files: new Set(), commands: 0, interrupted: false, lastUuid: e.uuid };
      turns.push(cur);
      continue;
    }
    if (!cur) continue; // activity before any prompt in this window (e.g. resumed mid-turn): skip
    if (e.uuid) cur.lastUuid = e.uuid;
    if (kind === 'interrupt') { cur.interrupted = true; continue; }
    if (e.type !== 'assistant') continue;
    for (const b of blocks(e)) {
      if (b.type === 'text' && b.text?.trim()) cur.texts.push({ text: b.text, toolsBefore: cur.tools });
      if (b.type === 'tool_use') {
        cur.tools += 1;
        const fp = b.input?.file_path || b.input?.notebook_path;
        if (fp && /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(b.name)) {
          cur.files.add(path.relative(ROOT, fp).replace(/\\/g, '/') || fp);
        }
        if (b.name === 'Bash' || b.name === 'PowerShell') cur.commands += 1;
      }
    }
  }
  for (const t of turns) {
    // The reply is the text Claude wrote after its last tool call (its final answer); else its last text.
    const after = t.texts.filter((x) => x.toolsBefore === t.tools);
    const finalTexts = after.length ? after : t.texts.slice(-1);
    t.reply = finalTexts.map((x) => x.text).join('\n\n');
  }
  return turns;
}

function renderTurn(n, t) {
  const flag = t.interrupted ? ' ⚠ interrupted by Robert' : '';
  const meta = [];
  if (t.files.size) meta.push(`**Files edited:** ${[...t.files].map((f) => `\`${f}\``).join(', ')}`);
  if (t.commands) meta.push(`**Commands run:** ${t.commands}`);
  return [
    `### ${n}. ${ymd(t.when)} ${hm(t.when)}${flag}`,
    '',
    '**Robert:**',
    quote(truncate(t.prompt, PROMPT_MAX)),
    '',
    '**Claude:**',
    quote(truncate(t.reply, REPLY_MAX) || '_(no text reply)_'),
    ...(meta.length ? ['', meta.join(' · ')] : []),
    '',
  ].join('\n');
}

// ---------- INDEX.md ----------

function cell(s) {
  return (s || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function regenerateIndex() {
  const rows = [];
  for (const file of allLogs()) {
    const { fm, body } = parseLog(fs.readFileSync(file, 'utf8'));
    if (Number(fm.turns || 0) === 0) continue; // opened and closed without a prompt
    let firstPrompt = '';
    const m = body.match(/\*\*Robert:\*\*\r?\n((?:> .*\r?\n?)+)/);
    if (m) firstPrompt = m[1].replace(/^> /gm, '').replace(/\s+/g, ' ').trim();
    rows.push({
      key: `${fm.date} ${fm.started}`,
      date: fm.date,
      time: fm.started,
      link: path.relative(SESSIONS, file).replace(/\\/g, '/'),
      title: fm.title || path.basename(file, '.md').split('_').slice(2).join('_'),
      area: fm.area || '—',
      summary: fm.summary || truncate(firstPrompt, 120),
      turns: fm.turns,
      flag: fm.stepped_in === 'true' ? '⚠' : '',
    });
  }
  rows.sort((a, b) => (a.key < b.key ? 1 : -1));
  const lines = [
    '# Session index',
    '',
    '<!-- Regenerated after every response by .claude/hooks/session-log.mjs from each log\'s frontmatter. Do not edit by hand: edit the log\'s frontmatter (or run /log) instead. -->',
    '',
    `Areas: ${AREAS.map((a) => `\`${a}\``).join(' · ')}. ⚠ = Robert interrupted or took over at least once.`,
    '',
  ];
  let month = '';
  for (const r of rows) {
    if (r.date.slice(0, 7) !== month) {
      month = r.date.slice(0, 7);
      lines.push(`## ${month}`, '', '| Date | Start | Session | Area | Summary | Turns | ⚠ |', '|---|---|---|---|---|---|---|');
    }
    lines.push(`| ${r.date} | ${r.time} | [${cell(r.title)}](${r.link}) | ${cell(r.area)} | ${cell(r.summary)} | ${r.turns} | ${r.flag} |`);
    const next = rows[rows.indexOf(r) + 1];
    if (!next || next.date.slice(0, 7) !== month) lines.push('');
  }
  if (!rows.length) lines.push('_No sessions logged yet._', '');
  fs.mkdirSync(SESSIONS, { recursive: true });
  fs.writeFileSync(INDEX, lines.join('\n'));
}

// ---------- modes ----------

function onStart(input) {
  const id = input.session_id;
  if (!id) return;
  if (!findLog(id)) createLog(id);
  // Tidy: remove logs left with zero turns (opened and closed without a prompt) older than 12h.
  const cutoff = Date.now() - 12 * 3600 * 1000;
  for (const file of allLogs()) {
    const { fm } = parseLog(fs.readFileSync(file, 'utf8'));
    if (fm.session_id !== id && Number(fm.turns || 0) === 0 && fs.statSync(file).mtimeMs < cutoff) fs.unlinkSync(file);
  }
  regenerateIndex();
}

function onStop(input) {
  const id = input.session_id;
  if (!id) return;
  let file = findLog(id) || createLog(id); // SessionStart may not have run (e.g. hook added mid-session)
  const { fm, body } = parseLog(fs.readFileSync(file, 'utf8'));

  const turns = newTurns(readTranscript(input.transcript_path), fm.last_uuid);
  let newBody = body;
  if (turns.length) {
    if (!newBody.includes(TURN_LOG_HEADING)) newBody = `${newBody.trimEnd()}\n\n${TURN_LOG_HEADING}\n\n`;
    let n = Number(fm.turns || 0);
    newBody = `${newBody.trimEnd()}\n\n${turns.map((t) => renderTurn(++n, t)).join('\n')}`;
    fm.turns = String(n);
    fm.last_uuid = turns[turns.length - 1].lastUuid || fm.last_uuid;
    if (turns.some((t) => t.interrupted)) fm.stepped_in = 'true';
  }

  // Branch: record it, and give the file its real name once we're on a feature branch.
  const branch = currentBranch();
  if (branch) fm.branch = branch;
  fs.writeFileSync(file, serializeLog(fm, newBody.endsWith('\n') ? newBody : `${newBody}\n`));
  const slug = branchSlug(branch);
  if (slug && path.basename(file).endsWith('_session.md')) {
    const renamed = file.replace(/_session\.md$/, `_${slug}.md`);
    if (!fs.existsSync(renamed)) { fs.renameSync(file, renamed); file = renamed; }
  }

  // Keep the full transcript next to the log (gitignored).
  if (input.transcript_path && fs.existsSync(input.transcript_path)) {
    fs.mkdirSync(RAW, { recursive: true });
    fs.copyFileSync(input.transcript_path, path.join(RAW, `${id}.jsonl`));
  }
  regenerateIndex();
}

try {
  const mode = process.argv[2];
  const input = readStdin();
  if (mode === 'start') onStart(input);
  else if (mode === 'stop') onStop(input);
} catch {
  // fail-open
}
process.exit(0);
