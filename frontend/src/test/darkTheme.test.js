import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

// The theme in index.css is dark at :root, but Tailwind's `dark:` variant is keyed on a `.dark`
// ancestor (`@custom-variant dark (&:is(.dark *))`). Without the class on <html>, every one of the
// ~550 `dark:` classes in the app is dead, and light-palette surfaces (bg-amber-50 warnings, amber
// subclass pills) render as pale boxes with unreadable text on the dark page — found in QA.
describe('dark theme wiring', () => {
  const root = resolve(__dirname, '../..');

  it('index.html puts the .dark class on <html>, so `dark:` variants apply', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf-8');
    expect(html).toMatch(/<html[^>]*\bclass="[^"]*\bdark\b[^"]*"/);
  });

  it('the dark variant is still keyed on the .dark class (update this guard if that changes)', () => {
    const css = readFileSync(resolve(root, 'src/index.css'), 'utf-8');
    expect(css).toMatch(/@custom-variant dark \(&:is\(\.dark \*\)\);/);
  });
});
