import '@testing-library/jest-dom/vitest';

// Suppress React act() warnings from Base UI's internal async state updates
// (FloatingUI positioning, focus management). These fire in microtasks that
// cannot be wrapped in act() from test code. All assertions use waitFor().
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('not wrapped in act(') || msg.includes('not configured to support act(')) {
    return;
  }
  originalError.call(console, ...args);
};
