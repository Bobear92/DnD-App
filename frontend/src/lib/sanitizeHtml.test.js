import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('keeps the formatting the session editor produces', () => {
    const html = '<h2>Title</h2><p><strong>b</strong> <em>i</em> <u>u</u></p><ul><li>one</li></ul>'
      + '<blockquote>q</blockquote><p><a href="https://example.com">link</a></p><img src="https://x/y.png" alt="map">';
    const out = sanitizeHtml(html);
    for (const tag of ['<h2>', '<strong>', '<em>', '<u>', '<ul>', '<li>', '<blockquote>', 'href="https://example.com"', '<img']) {
      expect(out).toContain(tag);
    }
  });

  it.each([
    ['script tag', '<script>alert(1)</script><p>x</p>', /<script/i],
    ['img onerror', '<img src=x onerror="alert(1)">', /onerror/i],
    ['javascript: link', '<a href="javascript:alert(1)">x</a>', /javascript:/i],
    ['svg onload', '<svg onload="alert(1)"></svg>', /onload/i],
    ['iframe', '<iframe src="https://evil.example"></iframe>', /<iframe/i],
    ['form', '<form action="https://evil.example"><input name="p"></form>', /<form|<input/i],
    ['style attribute', '<p style="position:fixed;inset:0">x</p>', /style=/i],
  ])('removes %s', (_name, html, bad) => {
    expect(sanitizeHtml(html)).not.toMatch(bad);
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});
