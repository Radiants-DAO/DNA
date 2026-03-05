---
title: Vitest Component Test Harness for pnpm Monorepo Packages
category: tooling
date: 2026-03-05
tags: [vitest, testing-library, jsdom, pnpm, monorepo, react-19, component-testing]
---

# Vitest Component Test Harness for pnpm Monorepo Packages

## Symptom

Need to add component smoke tests to `@rdna/radiants` (a theme package in a pnpm monorepo) that uses React 19, Tailwind v4, and has components with mixed JSX import styles -- some files use explicit `import React from 'react'`, others rely on the automatic JSX transform.

## Investigation

Standard vitest + jsdom setup failed initially because:
1. Test files written without `import React` relied on the automatic JSX runtime, but vitest's default esbuild config uses the classic JSX transform.
2. Existing component source files use explicit `import React from 'react'` (classic style).
3. Both styles need to coexist -- the transform must handle files with and without the React import.

## Root Cause

Vitest uses esbuild for TypeScript/JSX transformation. esbuild defaults to the **classic** JSX transform (`React.createElement`), which requires `import React from 'react'` in every file that uses JSX. The **automatic** transform (`react/jsx-runtime`) handles both cases: files with an explicit React import work fine, and files without one get the import injected automatically.

The `esbuild.jsx` option must be set at the **top level** of the vitest config (not nested inside `test`), because it configures the esbuild transpiler directly, not the test runner.

## Solution

### 1. Install devDependencies

```bash
pnpm add -D --filter @rdna/radiants \
  vitest@^2.1.9 \
  jsdom@^28.1.0 \
  @testing-library/react@^16.3.2 \
  @testing-library/jest-dom@^6.9.1 \
  @testing-library/user-event@^14.6.1 \
  @types/react@^19.2.9 \
  @types/react-dom@^19.2.3
```

Key version constraints:
- `@testing-library/react@^16` is required for React 19 compatibility
- `jsdom@^28` for modern DOM API support
- `@testing-library/user-event` included for future interaction tests

### 2. Create `vitest.config.ts`

```ts
// packages/<name>/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',  // KEY: handles both explicit and implicit React imports
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['components/core/**/*.test.tsx'],
  },
});
```

Critical details:
- `esbuild.jsx: 'automatic'` is at the **config root**, not inside `test`
- `globals: true` enables `test()`, `expect()`, `describe()` without imports
- `include` pattern scoped to `components/core/` to avoid running unrelated files
- `setupFiles` points to the setup that wires jest-dom matchers

### 3. Create `test/setup.ts`

```ts
// packages/<name>/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

Single import that registers jest-dom matchers (`.toBeInTheDocument()`, `.toHaveTextContent()`, etc.) with vitest's `expect`. Uses the `/vitest` entry point (not the bare import) for proper vitest integration.

### 4. Create `test/render.tsx`

```tsx
// packages/<name>/test/render.tsx
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Simple test render helper. Extend with providers as needed.
 */
export function renderComponent(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { ...options });
}
```

This wrapper exists as an extension point -- wrap with ThemeProvider, context, or other providers when needed without changing every test file.

### 5. Add scripts to `package.json`

```json
{
  "scripts": {
    "test:components": "vitest run",
    "test:components:watch": "vitest"
  }
}
```

### 6. Write a smoke test

```tsx
// packages/<name>/components/core/__tests__/smoke.test.tsx
import { render, screen } from '@testing-library/react';
import { Button, Select, Dialog } from '../index';

test('core exports render', () => {
  render(<Button>Test</Button>);
  expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  expect(Select).toBeTruthy();
  expect(Dialog).toBeTruthy();
});
```

The smoke test validates:
- Components can be imported from the barrel export
- At least one component renders without crashing in jsdom
- Key exports exist (truthiness check for non-rendered components)

### 7. Run

```bash
pnpm --filter @rdna/radiants test:components
```

## Prevention

When adding component tests to a new DNA theme package:

1. **Copy the harness**: Replicate `vitest.config.ts`, `test/setup.ts`, and `test/render.tsx` from `packages/radiants/`.
2. **Always use `esbuild.jsx: 'automatic'`**: This is non-negotiable in a codebase where JSX import styles are mixed.
3. **Scope test includes**: Set `include` to match only the package's component directory to prevent test pollution.
4. **Match @testing-library/react to React version**: React 19 requires `@testing-library/react@^16`.
5. **Start with a smoke test**: A single render + role query catches import/export breakage before writing detailed interaction tests.

## Related

- [vitest jsdom environment docs](https://vitest.dev/guide/environment.html)
- [esbuild jsx options](https://esbuild.github.io/api/#jsx)
- [@testing-library/react React 19 support](https://testing-library.com/docs/react-testing-library/intro/)
- DNA component pattern: `Component.tsx` / `Component.schema.json` / `Component.dna.json`
