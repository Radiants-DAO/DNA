# Dithwather Production Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `@dithwather/core` and `@dithwather/react` as production-ready npm packages with accessibility, comprehensive tests, optimized rendering, CI, changesets, and proper metadata.

**Architecture:** The monorepo uses pnpm workspaces + Turborepo. Core is a zero-dependency pure JS engine; React wraps it with components and hooks. Both packages are ESM-only today (tsup). We'll add CJS output, a11y motion guards, React component tests, publish infrastructure, and investigate replacing `canvas.toDataURL()` with faster rendering paths.

**Tech Stack:** TypeScript 5.7, Vitest 2.0, tsup 8, Turbo 2.3, pnpm 9.15, React 18, @testing-library/react, @changesets/cli, GitHub Actions

---

## Task 1: Add `prefers-reduced-motion` Support

The animation hook (`useDitherAnimation`) runs a `requestAnimationFrame` loop with no motion preference check. Users with vestibular disorders can be harmed by rapid dither flickering. This is the highest-priority a11y fix.

**Files:**
- Create: `packages/react/src/hooks/useReducedMotion.ts`
- Modify: `packages/react/src/hooks/useDitherAnimation.ts`
- Modify: `packages/react/src/index.ts`
- Create: `packages/react/src/hooks/useReducedMotion.test.ts`

**Step 1: Write the `useReducedMotion` hook**

Create `packages/react/src/hooks/useReducedMotion.ts`:

```ts
import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(QUERY).matches
      : false
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return reduced
}
```

**Step 2: Write a basic test for the hook**

Create `packages/react/src/hooks/useReducedMotion.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion'

describe('useReducedMotion', () => {
  it('returns false by default (no preference set)', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })
})
```

**Step 3: Install @testing-library/react**

Run:
```bash
pnpm --filter @dithwather/react add -D @testing-library/react @testing-library/jest-dom jsdom
```

**Step 4: Run the test**

Run: `pnpm --filter @dithwather/react test`
Expected: PASS

**Step 5: Wire into `useDitherAnimation`**

Modify `packages/react/src/hooks/useDitherAnimation.ts`:

At top, add:
```ts
import { useReducedMotion } from './useReducedMotion'
```

Inside `useDitherAnimation`, after `const [progress, setProgress] = useState(0)` (line ~111), add:
```ts
const prefersReducedMotion = useReducedMotion()
```

In the `animateTo` callback, right after `stop()` (line ~134), add an early-return that snaps to the target immediately:
```ts
if (prefersReducedMotion) {
  const finalConfig = { ...currentConfig, ...target }
  setConfig(finalConfig)
  configRef.current = finalConfig
  setProgress(1)
  return
}
```

**Step 6: Export the hook from the package**

In `packages/react/src/index.ts`, add:
```ts
export { useReducedMotion } from './hooks/useReducedMotion'
```

**Step 7: Run all tests**

Run: `pnpm --filter @dithwather/react test`
Expected: all PASS

**Step 8: Run build**

Run: `pnpm build`
Expected: clean build, 0 errors

**Step 9: Commit**

```bash
git add packages/react/src/hooks/useReducedMotion.ts packages/react/src/hooks/useReducedMotion.test.ts packages/react/src/hooks/useDitherAnimation.ts packages/react/src/index.ts packages/react/package.json pnpm-lock.yaml
git commit -m "feat(react): add prefers-reduced-motion support to animation hook

Skip animation and snap to target when user prefers reduced motion.
New useReducedMotion hook exported for consumer use."
```

---

## Task 2: React Component Tests — DitherBox

Zero React component tests exist today. DitherBox is the core component.

**Files:**
- Create: `packages/react/src/components/DitherBox.test.tsx`
- Modify: `packages/react/vitest.config.ts` (create if missing)

**Step 1: Create vitest config for React package**

Check if `packages/react/vitest.config.ts` exists. If not, create it:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
```

**Step 2: Write DitherBox component tests**

Create `packages/react/src/components/DitherBox.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DitherBox } from './DitherBox'

// Mock canvas getContext since jsdom doesn't support canvas rendering
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: (w: number, h: number) => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  }),
  putImageData: vi.fn(),
})) as any

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')

describe('DitherBox', () => {
  it('renders children', () => {
    render(<DitherBox>Hello</DitherBox>)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('applies className', () => {
    const { container } = render(<DitherBox className="custom">Content</DitherBox>)
    expect(container.firstChild).toHaveClass('custom')
  })

  it('applies custom style', () => {
    const { container } = render(
      <DitherBox style={{ padding: '20px' }}>Content</DitherBox>
    )
    expect((container.firstChild as HTMLElement).style.padding).toBe('20px')
  })

  it('sets position: relative on container', () => {
    const { container } = render(<DitherBox>Content</DitherBox>)
    expect((container.firstChild as HTMLElement).style.position).toBe('relative')
  })

  it('tracks hover state via mouse events', () => {
    const { container } = render(
      <DitherBox
        animate={{ idle: { threshold: 0.3 }, hover: { threshold: 0.7 }, transition: 0 }}
      >
        Hover me
      </DitherBox>
    )
    const box = container.firstChild as HTMLElement
    fireEvent.mouseEnter(box)
    fireEvent.mouseLeave(box)
    // No crash — state transitions work
    expect(screen.getByText('Hover me')).toBeTruthy()
  })

  it('accepts gradient shorthand props without crashing', () => {
    render(
      <DitherBox colors={['#000', '#fff']} angle={90} algorithm="bayer4x4">
        Gradient
      </DitherBox>
    )
    expect(screen.getByText('Gradient')).toBeTruthy()
  })

  it('accepts full gradient object without crashing', () => {
    render(
      <DitherBox
        gradient={{
          type: 'radial',
          stops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 1 },
          ],
        }}
        algorithm="bayer4x4"
      >
        Radial
      </DitherBox>
    )
    expect(screen.getByText('Radial')).toBeTruthy()
  })

  it('renders in mask mode without crashing', () => {
    render(
      <DitherBox colors={['#000', '#fff']} mode="mask" algorithm="bayer4x4">
        Masked
      </DitherBox>
    )
    expect(screen.getByText('Masked')).toBeTruthy()
  })

  it('renders in full mode without crashing', () => {
    render(
      <DitherBox colors={['#000', '#fff']} mode="full" algorithm="bayer4x4">
        Full
      </DitherBox>
    )
    expect(screen.getByText('Full')).toBeTruthy()
  })
})
```

**Step 3: Run the tests**

Run: `pnpm --filter @dithwather/react test`
Expected: all PASS

**Step 4: Commit**

```bash
git add packages/react/src/components/DitherBox.test.tsx packages/react/vitest.config.ts
git commit -m "test(react): add DitherBox component tests

Covers rendering, className, style, hover state, gradient API,
mask mode, and full mode."
```

---

## Task 3: React Component Tests — DitherButton

**Files:**
- Create: `packages/react/src/components/DitherButton.test.tsx`

**Step 1: Write DitherButton tests**

Create `packages/react/src/components/DitherButton.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DitherButton } from './DitherButton'

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: (w: number, h: number) => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  }),
  putImageData: vi.fn(),
})) as any
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')

describe('DitherButton', () => {
  it('renders a <button> element', () => {
    render(<DitherButton>Click</DitherButton>)
    expect(screen.getByRole('button', { name: 'Click' })).toBeTruthy()
  })

  it('forwards onClick handler', () => {
    const handler = vi.fn()
    render(<DitherButton onClick={handler}>Click</DitherButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('forwards ref to the button element', () => {
    const ref = vi.fn()
    render(<DitherButton ref={ref}>Ref</DitherButton>)
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  it('applies disabled attribute', () => {
    render(<DitherButton disabled>Disabled</DitherButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies buttonStyle to inner button', () => {
    render(<DitherButton buttonStyle={{ fontSize: '24px' }}>Styled</DitherButton>)
    expect(screen.getByRole('button').style.fontSize).toBe('24px')
  })

  it('passes gradient props through to DitherBox', () => {
    render(
      <DitherButton colors={['#000', '#fff']} angle={45} algorithm="bayer4x4">
        Gradient Button
      </DitherButton>
    )
    expect(screen.getByText('Gradient Button')).toBeTruthy()
  })
})
```

**Step 2: Run the tests**

Run: `pnpm --filter @dithwather/react test`
Expected: all PASS

**Step 3: Commit**

```bash
git add packages/react/src/components/DitherButton.test.tsx
git commit -m "test(react): add DitherButton component tests

Covers rendering, onClick, ref forwarding, disabled state,
buttonStyle, and gradient prop passthrough."
```

---

## Task 4: React Hook Tests — useDitherAnimation

**Files:**
- Create: `packages/react/src/hooks/useDitherAnimation.test.ts`

**Step 1: Write animation hook tests**

Create `packages/react/src/hooks/useDitherAnimation.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDitherAnimation } from './useDitherAnimation'

describe('useDitherAnimation', () => {
  it('returns initial config with defaults applied', () => {
    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 })
    )
    expect(result.current.config.threshold).toBe(0.3)
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('animateTo updates config after animation completes', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 }, { duration: 100 })
    )

    act(() => {
      result.current.animateTo({ threshold: 0.8 })
    })

    // Advance past animation duration
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // After animation completes, threshold should reach target
    expect(result.current.config.threshold).toBeCloseTo(0.8, 1)
    vi.useRealTimers()
  })

  it('stop() halts animation', () => {
    const { result } = renderHook(() =>
      useDitherAnimation({ threshold: 0.3 }, { duration: 1000 })
    )

    act(() => {
      result.current.animateTo({ threshold: 0.9 })
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isAnimating).toBe(false)
  })

  it('exposes animateTo, stop, config, isAnimating, progress', () => {
    const { result } = renderHook(() => useDitherAnimation({}))
    expect(typeof result.current.animateTo).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.config).toBe('object')
    expect(typeof result.current.isAnimating).toBe('boolean')
    expect(typeof result.current.progress).toBe('number')
  })
})
```

**Step 2: Run the tests**

Run: `pnpm --filter @dithwather/react test`
Expected: all PASS

**Step 3: Commit**

```bash
git add packages/react/src/hooks/useDitherAnimation.test.ts
git commit -m "test(react): add useDitherAnimation hook tests

Covers initial config, animateTo completion, stop(), and API shape."
```

---

## Task 5: Package.json Metadata for npm Publishing

Both packages are missing fields required for a good npm experience: `repository`, `homepage`, `bugs`, `sideEffects`, `engines`, and a CJS build entrypoint.

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/react/package.json`

**Step 1: Update `@dithwather/core` package.json**

Add/change these fields in `packages/core/package.json`:

```json
{
  "sideEffects": false,
  "engines": { "node": ">=18" },
  "repository": {
    "type": "git",
    "url": "https://github.com/rivermassey/dithwather.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/rivermassey/dithwather/tree/main/packages/core#readme",
  "bugs": "https://github.com/rivermassey/dithwather/issues"
}
```

Update `exports` to include CJS:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js"
}
```

Update build script to include CJS:
```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean"
  }
}
```

**Step 2: Update `@dithwather/react` package.json**

Same metadata fields, adjusted `directory`:

```json
{
  "sideEffects": false,
  "engines": { "node": ">=18" },
  "repository": {
    "type": "git",
    "url": "https://github.com/rivermassey/dithwather.git",
    "directory": "packages/react"
  },
  "homepage": "https://github.com/rivermassey/dithwather/tree/main/packages/react#readme",
  "bugs": "https://github.com/rivermassey/dithwather/issues"
}
```

Update `exports` to include CJS:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js"
}
```

Update build script:
```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean --external react --external react-dom --external @dithwather/core"
  }
}
```

**Step 3: Run build to verify CJS output**

Run: `pnpm build`
Expected: Each package outputs both `.js` and `.cjs` in `dist/`

Verify:
```bash
ls packages/core/dist/index.cjs packages/react/dist/index.cjs
```

**Step 4: Commit**

```bash
git add packages/core/package.json packages/react/package.json
git commit -m "chore: add npm metadata, CJS build, sideEffects flag

Adds repository/homepage/bugs URLs, engines field, sideEffects: false
for tree-shaking, and CJS entrypoint alongside ESM."
```

---

## Task 6: Changesets for Version Management

Changesets is the standard for pnpm monorepo versioning and publishing.

**Files:**
- Create: `.changeset/config.json`
- Modify: `package.json` (root — add changeset scripts)

**Step 1: Install changesets**

Run:
```bash
cd /Users/rivermassey/Desktop/dev/dithwather && pnpm add -Dw @changesets/cli @changesets/changelog-github
```

**Step 2: Initialize changesets**

Run:
```bash
cd /Users/rivermassey/Desktop/dev/dithwather && pnpm changeset init
```

**Step 3: Update `.changeset/config.json`**

Replace with:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "rivermassey/dithwather" }],
  "commit": false,
  "fixed": [],
  "linked": [["@dithwather/*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

The `linked` field ensures core and react versions bump together.

**Step 4: Add root scripts**

Add to root `package.json` scripts:

```json
{
  "changeset": "changeset",
  "version-packages": "changeset version",
  "release": "turbo build && changeset publish"
}
```

**Step 5: Run build to verify nothing broke**

Run: `pnpm build`
Expected: clean

**Step 6: Commit**

```bash
git add .changeset/ package.json pnpm-lock.yaml
git commit -m "chore: add changesets for version management

Linked versioning for @dithwather/* packages.
Uses @changesets/changelog-github for release notes."
```

---

## Task 7: GitHub Actions CI

No CI exists. Add a workflow that runs on push and PR.

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm typecheck

      - run: pnpm build

      - run: pnpm test
```

**Step 2: Verify the file is valid YAML**

Run:
```bash
cat .github/workflows/ci.yml | python3 -c "import sys,yaml; yaml.safe_load(sys.stdin); print('valid YAML')"
```
Expected: `valid YAML`

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow

Runs typecheck, build, and test on Node 18/20/22 for push and PR."
```

---

## Task 8: ESLint Setup

No lint configuration exists. The `turbo lint` task is defined but has no backing scripts.

**Files:**
- Create: `eslint.config.mjs` (root — flat config)
- Modify: `packages/core/package.json` (add lint script)
- Modify: `packages/react/package.json` (add lint script)

**Step 1: Install ESLint + TypeScript plugin**

Run:
```bash
cd /Users/rivermassey/Desktop/dev/dithwather && pnpm add -Dw eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
```

**Step 2: Create root flat config**

Create `eslint.config.mjs`:

```js
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.*'],
  }
)
```

**Step 3: Add lint scripts to each package**

In `packages/core/package.json` scripts:
```json
"lint": "eslint src/"
```

In `packages/react/package.json` scripts:
```json
"lint": "eslint src/"
```

**Step 4: Run lint**

Run: `pnpm lint`
Expected: may have warnings. Fix any errors. Warnings are acceptable for now.

**Step 5: Commit**

```bash
git add eslint.config.mjs packages/core/package.json packages/react/package.json pnpm-lock.yaml
git commit -m "chore: add ESLint with TypeScript and React hooks rules

Flat config at root. Lint script added to core and react packages."
```

---

## Task 9: Per-Package READMEs

npm shows the README on the package page. No per-package READMEs exist.

**Files:**
- Create: `packages/core/README.md`
- Create: `packages/react/README.md`

**Step 1: Write `@dithwather/core` README**

Create `packages/core/README.md` covering:
- One-line description
- Install command
- Quick example (renderGradientDither usage)
- List of exported functions and types
- Link to playground
- License

Keep it concise — under 100 lines.

**Step 2: Write `@dithwather/react` README**

Create `packages/react/README.md` covering:
- One-line description
- Install command (peer deps note)
- Quick example (DitherBox with gradient props)
- DitherButton example
- Mask mode example
- Animation/interaction example
- Props reference table
- Link to playground
- License

Keep it concise — under 150 lines.

**Step 3: Commit**

```bash
git add packages/core/README.md packages/react/README.md
git commit -m "docs: add per-package READMEs for npm

Core: API reference and quick start.
React: component examples, props table, mask mode guide."
```

---

## Task 10: Investigate PNG Encoding Optimization

This is the biggest performance win available. Currently `renderGradientToDataURL` calls `canvas.toDataURL()` which synchronously encodes PNG + base64 — ~3-6ms at 960x600, roughly 40-50% of total frame time during animation.

**Goal:** Determine the best replacement strategy and implement the quickest viable win.

**Research summary (already completed):**

| Approach | Estimated gain | Complexity | Notes |
|----------|---------------|------------|-------|
| `toBlob()` + `URL.createObjectURL()` | ~30-40% faster | Low | Async, avoids base64 string alloc |
| WebGL shader | ~95% faster (0.2ms) | High | Eliminates encoding entirely |
| OffscreenCanvas + Worker | ~50% off main thread | Medium | Still encodes PNG, but non-blocking |
| BMP / raw bitmap | Varies | Medium | Browser support uneven |

**Files:**
- Modify: `packages/core/src/gradients/render.ts`
- Modify: `packages/react/src/components/DitherBox.tsx`
- Create: `packages/core/src/gradients/render-blob.ts` (if blob approach chosen)

### Phase A: Quick Win — `toBlob` + `createObjectURL`

**Step 1: Add `renderGradientToObjectURL` in core**

In `packages/core/src/gradients/render.ts`, add a new function after `renderGradientToDataURL`:

```ts
/**
 * Render a dithered gradient to a blob object URL.
 * Faster than toDataURL (avoids base64 encoding overhead).
 * Caller must call URL.revokeObjectURL() when done.
 */
export function renderGradientToObjectURL(
  options: GradientDitherOptions,
  callback: (url: string) => void
): void {
  if (typeof document === 'undefined') return

  const imageData = renderGradientDither(options)
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  canvas.toBlob((blob) => {
    if (blob) {
      callback(URL.createObjectURL(blob))
    }
  })
}
```

**Step 2: Export from core index**

Add to `packages/core/src/gradients/index.ts`:
```ts
export { renderGradientToObjectURL } from './render'
```

Add to `packages/core/src/index.ts` gradients export block:
```ts
renderGradientToObjectURL,
```

**Step 3: Update DitherBox to use object URLs with revocation**

In `packages/react/src/components/DitherBox.tsx`, modify the gradient rendering useEffect (line ~193-234):

```ts
useEffect(() => {
  if (!resolvedGradient) return
  if (width <= 0 || height <= 0) return

  const alg = (algorithm ?? configToUse.algorithm ?? 'bayer4x4')
  if (!isOrderedAlgorithm(alg)) {
    console.warn(/* existing message */)
    return
  }

  let cancelled = false
  let currentObjectURL: string | null = null

  // Use synchronous toDataURL during animation for frame accuracy,
  // async toBlob for static renders (better perf for non-animated cases)
  const bias = configToUse.threshold !== undefined ? (configToUse.threshold - 0.5) * 2 : 0
  const renderOpts = {
    gradient: resolvedGradient,
    algorithm: alg as OrderedAlgorithm,
    width,
    height,
    threshold: bias,
    pixelScale,
    glitch,
  }

  if (isAnimating) {
    // Synchronous path during animation — frame accuracy matters
    const url = renderGradientToDataURL(renderOpts)
    if (!cancelled) setGradientDataURL(url)
  } else {
    // Async path for static — avoid base64 overhead
    renderGradientToObjectURL(renderOpts, (url) => {
      if (!cancelled) {
        currentObjectURL = url
        setGradientDataURL(url)
      } else {
        URL.revokeObjectURL(url)
      }
    })
  }

  return () => {
    cancelled = true
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL)
    }
  }
}, [/* same deps as before, plus isAnimating */])
```

This gives the quick win for static renders. During animation the synchronous path is still needed for frame accuracy.

**Step 4: Write a test for the new function**

Add to `packages/core/src/gradients/render.test.ts`:

```ts
describe('renderGradientToObjectURL', () => {
  it('calls callback with a blob: URL', async () => {
    const url = await new Promise<string>((resolve) => {
      renderGradientToObjectURL(
        {
          gradient: makeGradient(),
          algorithm: 'bayer4x4',
          width: 16,
          height: 16,
        },
        resolve
      )
    })
    expect(url).toContain('blob:')
  })
})
```

**Step 5: Run all tests**

Run: `pnpm test`
Expected: all PASS

**Step 6: Run build**

Run: `pnpm build`
Expected: clean

**Step 7: Commit**

```bash
git add packages/core/src/gradients/render.ts packages/core/src/gradients/index.ts packages/core/src/index.ts packages/core/src/gradients/render.test.ts packages/react/src/components/DitherBox.tsx
git commit -m "perf: add renderGradientToObjectURL for faster static renders

Uses toBlob + createObjectURL to avoid base64 encoding overhead.
DitherBox uses async path for static renders, sync path during animation."
```

### Phase B: WebGL Shader (Future — Spike Only)

This is a larger effort that should be spiked separately. Documenting the approach here for future planning:

1. **Create `packages/core/src/gradients/render-webgl.ts`** — WebGL2 renderer that runs the Bayer dither as a fragment shader
2. **The shader receives:** gradient stops as a uniform array, Bayer matrix as a texture, threshold/bias as a uniform
3. **Output:** renders directly to a WebGL canvas — no encoding step at all
4. **DitherBox change:** instead of setting `backgroundImage: url(dataURL)`, mount a `<canvas>` element with the WebGL context
5. **Fallback:** detect WebGL2 support, fall back to current CPU path

Expected improvement: ~95% reduction in per-frame cost (0.2ms vs 3-6ms). This eliminates both the CPU pixel loop AND the PNG encoding.

**Recommendation:** Create a separate plan document for this when ready to tackle it. The `toBlob` quick win in Phase A addresses the static-render case immediately.

---

## Task 11: Final Verification

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: all packages pass

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: 0 errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: 0 errors (warnings acceptable)

**Step 4: Run build**

Run: `pnpm build`
Expected: all packages clean, both `.js` and `.cjs` output

**Step 5: Verify package contents**

Run:
```bash
cd packages/core && pnpm pack --dry-run
cd ../react && pnpm pack --dry-run
```

Expected: `dist/`, `README.md`, `LICENSE`, `package.json` included. No `src/` or test files.

**Step 6: Visual check**

Run: `pnpm --filter playground dev`

Verify in browser:
- Gradient demos render correctly (no scanlines unless glitch is on)
- Glitch demo shows deliberate effect
- Mask reveal demos work on hover (content hidden → revealed)
- Control panel mask subjects render correctly
- Animations are smooth
- With `prefers-reduced-motion: reduce` enabled in dev tools, animations snap instantly

**Step 7: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final production readiness fixes"
```

---

## Summary

| Task | What | Priority |
|------|------|----------|
| 1 | prefers-reduced-motion | P0 (a11y) |
| 2 | DitherBox tests | P0 (quality) |
| 3 | DitherButton tests | P0 (quality) |
| 4 | useDitherAnimation tests | P0 (quality) |
| 5 | Package.json metadata + CJS | P0 (publish) |
| 6 | Changesets | P0 (publish) |
| 7 | GitHub Actions CI | P1 (infra) |
| 8 | ESLint | P1 (infra) |
| 9 | Per-package READMEs | P1 (publish) |
| 10 | PNG encoding optimization | P1 (perf) |
| 11 | Final verification | P0 (ship) |

Estimated: 11 tasks, ~45-60 bite-sized steps total.
