import '@testing-library/jest-dom';

// Radix UI Select calls scrollIntoView which jsdom doesn't implement
window.HTMLElement.prototype.scrollIntoView = () => {};

// jsdom does not implement window.scrollTo; stub it so scroll-to-top effects don't throw
window.scrollTo = () => {};

// ── Flake detector: SLOW_MOCKS=1 npm test ──────────────────────────────────────
// Mocked services resolve instantly here but not on a loaded CI runner. A test that awaits
// something rendered SYNCHRONOUSLY (a row built from props) and then asserts synchronously on
// FETCHED content passes locally and fails in CI — the await never gated the data. Setting
// SLOW_MOCKS pushes every mockResolvedValue onto the next macrotask, which turns that race into
// a deterministic local failure. Fix by awaiting the fetched content itself (findByText(...)),
// not by adding sleeps. Off by default; no test should need it to pass.
//
// KNOWN ARTIFACT — not a real race: the delay lets one test's promise resolve after that test has
// finished, so a shared mock can record a call during the NEXT test. Login.test.jsx
// "shows the error message and does not navigate" fails this way in a full run and passes in
// isolation. Real mocks resolve within their own test, so this cannot happen in CI. When a
// SLOW_MOCKS failure looks like a stray call on a shared mock, re-run that test alone first.
if (typeof process !== 'undefined' && process.env?.SLOW_MOCKS) {
  globalThis.__SLOW_MOCKS_ACTIVE = true;
  const realFn = vi.fn.bind(vi);
  // 50ms: long enough to outlast the act()/waitFor flush that swallows a 0ms timer, well under
  // Testing Library's 1000ms findBy timeout so correctly-awaited assertions still pass.
  const defer = (v) => new Promise((resolve) => setTimeout(() => resolve(v), 50));
  vi.fn = (...args) => {
    const mock = realFn(...args);
    mock.mockResolvedValue = (v) => mock.mockImplementation(() => defer(v));
    mock.mockResolvedValueOnce = (v) => mock.mockImplementationOnce(() => defer(v));
    return mock;
  };
}
