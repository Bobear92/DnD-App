import '@testing-library/jest-dom';

// Radix UI Select calls scrollIntoView which jsdom doesn't implement
window.HTMLElement.prototype.scrollIntoView = () => {};
