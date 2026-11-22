import DOMPurify from 'dompurify';

/**
 * Clean user-authored HTML before it is rendered with `dangerouslySetInnerHTML`.
 *
 * Session content is saved as HTML and shown to every player in the campaign, and anyone can create a
 * campaign and add anyone to it — so unsanitized HTML there was a one-step token theft (security review,
 * deploy T10). DOMPurify strips scripts, event-handler attributes (`onerror=`, `onclick=`), `javascript:`
 * URLs, iframes and forms, and keeps the formatting the editor produces (paragraphs, lists, quotes, links,
 * images).
 *
 * EVERY `dangerouslySetInnerHTML` in the app must go through this — `src/test/noUnsanitizedHtml.test.js`
 * fails the build otherwise.
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['style'],
  });
}
