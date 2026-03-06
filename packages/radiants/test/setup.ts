import '@testing-library/jest-dom/vitest';

// Suppress act() warnings from Base UI's floating-ui async positioning.
// React passes format: console.error("An update to %s ...", componentName)
// Only suppresses warnings naming known Base UI/floating-ui internals.
// act() warnings from your own components will still surface.
const FLOATING_UI_COMPONENTS = new Set([
  'FloatingFocusManager',
  'SelectPositioner',
  'SelectPopup',
  'SelectRoot',
  'SelectTrigger',
  'SelectOption',
  'TestSelect', // test harness wrapper — act() propagates from Base UI
]);
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const fmt = typeof args[0] === 'string' ? args[0] : '';
  if (
    fmt.includes('was not wrapped in act(') &&
    typeof args[1] === 'string' &&
    FLOATING_UI_COMPONENTS.has(args[1])
  ) {
    return;
  }
  originalError.call(console, ...args);
};
