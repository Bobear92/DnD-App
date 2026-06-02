import '@testing-library/jest-dom';

// Radix UI Select calls scrollIntoView which jsdom doesn't implement
window.HTMLElement.prototype.scrollIntoView = () => {};

// jsdom does not implement window.scrollTo; stub it so scroll-to-top effects don't throw
window.scrollTo = () => {};
