import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: every `dangerouslySetInnerHTML` passes its HTML through `sanitizeHtml` (`src/lib/sanitizeHtml.js`).
 *
 * Session notes were rendered as raw HTML for players. Any user can create a campaign and add anyone to it,
 * so a script in a session stole the viewer's login token — the critical finding of the deploy-T10 security
 * review. The fix is one sanitizer; this guard stops a new raw-HTML render from skipping it.
 *
 * The check is per occurrence: the `__html:` value within a few lines of `dangerouslySetInnerHTML` must call
 * `sanitizeHtml(`. Test files are exempt.
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(e.name) && !/\.test\.(js|jsx)$/.test(e.name) ? [full] : [];
  });
}

export function findUnsanitized(text) {
  const lines = text.split(/\r?\n/);
  const hits = [];
  lines.forEach((line, i) => {
    if (!line.includes('dangerouslySetInnerHTML')) return;
    if (/^\s*(\*|\/\/|\/\*)/.test(line)) return; // a comment mentioning it, not a render
    const window = lines.slice(i, i + 4).join('\n');
    const html = window.slice(window.indexOf('dangerouslySetInnerHTML'));
    const value = html.match(/__html\s*:\s*([^}]*)/);
    if (!value || !value[1].includes('sanitizeHtml(')) hits.push({ line: i + 1, text: line.trim() });
  });
  return hits;
}

describe('every dangerouslySetInnerHTML is sanitized', () => {
  it('detects the forms it is meant to catch (self-test)', () => {
    expect(findUnsanitized('<div dangerouslySetInnerHTML={{ __html: content }} />')).toHaveLength(1);
    expect(findUnsanitized('<div\n  dangerouslySetInnerHTML={{\n    __html: content || "x",\n  }}\n/>')).toHaveLength(1);
    expect(findUnsanitized('<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />')).toHaveLength(0);
    expect(findUnsanitized(' * rendered with `dangerouslySetInnerHTML`.')).toHaveLength(0);
    expect(findUnsanitized('<div\n  dangerouslySetInnerHTML={{\n    __html: sanitizeHtml(content) || "x",\n  }}\n/>')).toHaveLength(0);
  });

  it('the scan really reads the one known raw-HTML render', () => {
    const rte = fs.readFileSync(path.join(SRC, 'sessions', 'components', 'RichTextEditor.jsx'), 'utf8');
    expect(rte).toContain('dangerouslySetInnerHTML');
  });

  it('no source file renders unsanitized HTML', () => {
    const offenders = walk(SRC).flatMap((f) =>
      findUnsanitized(fs.readFileSync(f, 'utf8')).map((h) => `${path.relative(SRC, f)}:${h.line}  ${h.text}`),
    );
    expect(offenders, `Wrap the HTML in sanitizeHtml() from '@/lib/sanitizeHtml':\n${offenders.join('\n')}`).toEqual([]);
  });
});
