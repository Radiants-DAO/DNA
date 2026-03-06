import '@testing-library/jest-dom/vitest';

// Suppress React act() warnings from Base UI's floating-ui positioning.
// These are async DOM measurements in third-party internals that cannot be
// wrapped in act() — tests pass correctly, the warnings are noise.
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('was not wrapped in act(')) return;
  originalError.call(console, ...args);
};
