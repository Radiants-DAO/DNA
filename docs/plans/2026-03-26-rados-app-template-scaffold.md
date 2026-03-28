# RadOS App Template Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new `@rdna/create` workspace package that scaffolds a standalone Next.js RadOS prototype app, deprecates the stale in-monorepo `apps/rad-os/scripts/create-app.ts` path, and leaves a clean seam for the later isolated control-surface prototype.

**Architecture:** Introduce a new `packages/create` workspace package in `DNA-app-template` that copies a checked-in template directory, rewrites app-name tokens, and supports a local Radiants-link mode for current unpublished development. The generated app ships a simplified AppWindow/WindowContent/Taskbar shell, a generic title-bar action slot, and a `lib/controlSurface.ts` seam, but does not implement detached control surfaces yet.

**Tech Stack:** pnpm workspaces, Node + TypeScript ESM, Next.js 16, React 19, Tailwind v4, Vitest, `node --experimental-strip-types`

---

### Task 1: Create The `@rdna/create` Package Shell

**Files:**
- Create: `packages/create/package.json`
- Create: `packages/create/tsconfig.json`
- Create: `packages/create/src/names.ts`
- Create: `packages/create/src/index.ts`
- Create: `packages/create/src/cli.ts`
- Create: `packages/create/src/__tests__/names.test.ts`
- Modify: `package.json`

**Step 1: Write the failing test**

Create `packages/create/src/__tests__/names.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeScaffoldName, toPascalCase, toCamelCase } from '../index';

describe('name helpers', () => {
  it('normalizes arbitrary input to kebab-case', () => {
    expect(normalizeScaffoldName('My Cool App')).toBe('my-cool-app');
  });

  it('derives PascalCase and camelCase names', () => {
    expect(toPascalCase('my-cool-app')).toBe('MyCoolApp');
    expect(toCamelCase('my-cool-app')).toBe('myCoolApp');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/names.test.ts
```

Expected: FAIL because `@rdna/create` and `src/index.ts` do not exist yet.

**Step 3: Write minimal implementation**

Create `packages/create/package.json`:

```json
{
  "name": "@rdna/create",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "rdna-create": "./src/cli.ts"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.9"
  }
}
```

Create `packages/create/tsconfig.json` by mirroring `packages/preview/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Create `packages/create/src/names.ts`:

```ts
export function normalizeScaffoldName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toPascalCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
```

Create `packages/create/src/index.ts`:

```ts
export * from './names';
```

Create `packages/create/src/cli.ts`:

```ts
#!/usr/bin/env node

const message = 'rdna-create CLI not implemented yet';
console.log(message);
```

Add a root script in `package.json`:

```json
{
  "scripts": {
    "test:create": "pnpm --filter @rdna/create test"
  }
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/names.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add packages/create package.json
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "feat(create): add workspace package shell"
```

### Task 2: Implement Token Rendering And Radiants Dependency Resolution

**Files:**
- Create: `packages/create/src/template.ts`
- Create: `packages/create/src/__tests__/template.test.ts`
- Modify: `packages/create/src/index.ts`

**Step 1: Write the failing test**

Create `packages/create/src/__tests__/template.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderTemplateString, resolveRadiantsDependency } from '../template';

describe('template rendering', () => {
  it('replaces app tokens in plain text files', () => {
    const rendered = renderTemplateString('Hello __APP_PASCAL_NAME__', {
      appName: 'my-app',
      appPascalName: 'MyApp',
      appCamelName: 'myApp',
      packageName: 'my-app'
    });
    expect(rendered).toBe('Hello MyApp');
  });

  it('supports workspace radiants mode during local smoke tests', () => {
    expect(resolveRadiantsDependency('workspace', '/abs/radiants')).toBe('file:/abs/radiants');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/template.test.ts
```

Expected: FAIL because `template.ts` does not exist.

**Step 3: Write minimal implementation**

Create `packages/create/src/template.ts`:

```ts
export interface TemplateContext {
  appName: string;
  appPascalName: string;
  appCamelName: string;
  packageName: string;
}

export function renderTemplateString(input: string, context: TemplateContext): string {
  return input
    .replaceAll('__APP_NAME__', context.appName)
    .replaceAll('__APP_PASCAL_NAME__', context.appPascalName)
    .replaceAll('__APP_CAMEL_NAME__', context.appCamelName)
    .replaceAll('__PACKAGE_NAME__', context.packageName);
}

export function resolveRadiantsDependency(
  mode: 'workspace' | 'published',
  radiantsPath?: string
): string {
  if (mode === 'workspace') {
    if (!radiantsPath) {
      throw new Error('workspace mode requires --radiants-path');
    }
    return `file:${radiantsPath}`;
  }
  return '^0.1.0';
}
```

Update `packages/create/src/index.ts`:

```ts
export * from './template';
export * from './names';
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/template.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add packages/create/src
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "feat(create): add template token rendering"
```

### Task 3: Create The Checked-In Prototype Template Tree

**Files:**
- Create: `templates/rados-app-prototype/package.json.template`
- Create: `templates/rados-app-prototype/next.config.ts`
- Create: `templates/rados-app-prototype/postcss.config.mjs`
- Create: `templates/rados-app-prototype/tsconfig.json`
- Create: `templates/rados-app-prototype/app/layout.tsx`
- Create: `templates/rados-app-prototype/app/globals.css`
- Create: `templates/rados-app-prototype/app/page.tsx`
- Create: `templates/rados-app-prototype/components/AppWindow.tsx`
- Create: `templates/rados-app-prototype/components/WindowContent.tsx`
- Create: `templates/rados-app-prototype/components/Taskbar.tsx`
- Create: `templates/rados-app-prototype/components/app/MyApp.tsx`
- Create: `templates/rados-app-prototype/lib/types.ts`
- Create: `templates/rados-app-prototype/lib/controlSurface.ts`
- Create: `templates/rados-app-prototype/README.md.template`
- Create: `templates/rados-app-prototype/CLAUDE.md.template`
- Create: `templates/rados-app-prototype/MERGE-GUIDE.md.template`
- Create: `packages/create/src/__tests__/template-files.test.ts`

**Step 1: Write the failing test**

Create `packages/create/src/__tests__/template-files.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'templates/rados-app-prototype');

describe('template files', () => {
  it('includes the standalone app shell', () => {
    expect(existsSync(resolve(root, 'app/page.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/WindowContent.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'lib/controlSurface.ts'))).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/template-files.test.ts
```

Expected: FAIL because `templates/rados-app-prototype/` does not exist yet.

**Step 3: Write minimal implementation**

Use checked-in template files, not string blobs inside the CLI.

`templates/rados-app-prototype/package.json.template`:

```json
{
  "name": "__PACKAGE_NAME__",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "@rdna/radiants": "__RADIANTS_DEP__",
    "next": "16.1.6",
    "react": "19.2.1",
    "react-dom": "19.2.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.10",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^2.1.9"
  }
}
```

`templates/rados-app-prototype/lib/types.ts`:

```ts
import type { ReactNode } from 'react';

export interface AppProps {
  windowId: string;
}

export type WindowContentMode =
  | 'single-column'
  | 'sidebar'
  | 'tabbed'
  | 'full-bleed';

export interface WindowSizePreset {
  label: string;
  width: number;
  height: number;
}

export interface AppWindowProps {
  title: string;
  children: ReactNode;
  titleBarActions?: ReactNode;
}
```

`templates/rados-app-prototype/lib/controlSurface.ts`:

```ts
export type ControlSurfaceDock = 'left' | 'right' | 'bottom';

export interface AppControlSurfaceConfig {
  enabled: boolean;
  dock?: ControlSurfaceDock;
  autoOpen?: boolean;
}

export const defaultControlSurface: AppControlSurfaceConfig = {
  enabled: false,
  dock: 'right',
  autoOpen: false
};
```

Keep the rest of the files minimal but real: a one-page Next app, one `AppWindow`, one `WindowContent`, one `Taskbar`, one example app component, and human/AI docs.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/template-files.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add templates/rados-app-prototype packages/create/src/__tests__/template-files.test.ts
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "feat(create): add checked-in prototype template"
```

### Task 4: Bake In The Control-Surface Seam Without Implementing It

**Files:**
- Modify: `templates/rados-app-prototype/components/AppWindow.tsx`
- Modify: `templates/rados-app-prototype/components/WindowContent.tsx`
- Modify: `templates/rados-app-prototype/components/app/MyApp.tsx`
- Modify: `templates/rados-app-prototype/lib/types.ts`
- Modify: `templates/rados-app-prototype/lib/controlSurface.ts`
- Create: `packages/create/src/__tests__/template-contract.test.ts`

**Step 1: Write the failing test**

Create `packages/create/src/__tests__/template-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'templates/rados-app-prototype');

describe('template control-surface seam', () => {
  it('uses a generic title-bar action slot instead of control-specific booleans', () => {
    const appWindow = readFileSync(resolve(root, 'components/AppWindow.tsx'), 'utf8');
    expect(appWindow).toContain('titleBarActions');
  });

  it('defines the future control-surface stub in lib/controlSurface.ts', () => {
    const seam = readFileSync(resolve(root, 'lib/controlSurface.ts'), 'utf8');
    expect(seam).toContain('AppControlSurfaceConfig');
    expect(seam).toContain("enabled: false");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/template-contract.test.ts
```

Expected: FAIL because the current template files do not expose the seam yet.

**Step 3: Write minimal implementation**

`templates/rados-app-prototype/components/AppWindow.tsx` should expose a generic slot:

```tsx
import type { AppWindowProps } from '../lib/types';

export function AppWindow({ title, children, titleBarActions }: AppWindowProps) {
  return (
    <section className="flex h-full flex-col border border-line bg-card">
      <header className="flex items-center gap-3 border-b border-line px-4 py-2">
        <span className="font-joystix text-xs uppercase text-main">{title}</span>
        <div className="ml-auto flex items-center gap-2">{titleBarActions}</div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
```

`templates/rados-app-prototype/components/WindowContent.tsx` should formalize the new modes:

```tsx
import type { ReactNode } from 'react';
import type { WindowContentMode } from '../lib/types';

export function WindowContent({ mode = 'single-column', children }: {
  mode?: WindowContentMode;
  children: ReactNode;
}) {
  const modeClass = {
    'single-column': 'mx-auto flex max-w-3xl flex-col gap-6 p-6',
    sidebar: 'grid min-h-0 grid-cols-[16rem_1fr]',
    tabbed: 'flex min-h-0 flex-col',
    'full-bleed': 'h-full'
  }[mode];

  return <div className={modeClass}>{children}</div>;
}
```

Do not add detached windows yet. Keep this task strictly to the seam.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/template-contract.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add templates/rados-app-prototype packages/create/src/__tests__/template-contract.test.ts
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "feat(create): add control-surface seam to template shell"
```

### Task 5: Wire The CLI Copy Logic And Local Smoke-Test Mode

**Files:**
- Create: `packages/create/src/scaffold.ts`
- Create: `packages/create/src/__tests__/scaffold.test.ts`
- Modify: `packages/create/src/cli.ts`
- Modify: `packages/create/src/index.ts`
- Modify: `package.json`

**Step 1: Write the failing integration test**

Create `packages/create/src/__tests__/scaffold.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { scaffoldProject } from '../scaffold';

describe('scaffoldProject', () => {
  it('writes a standalone app with local Radiants dependency during workspace simulation', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'rdna-create-'));

    await scaffoldProject({
      appName: 'motion-lab',
      outDir,
      radiantsSource: 'workspace',
      radiantsPath: '/Users/rivermassey/Desktop/dev/DNA-app-template/packages/radiants'
    });

    expect(existsSync(resolve(outDir, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(outDir, 'lib/controlSurface.ts'))).toBe(true);

    const pkg = readFileSync(resolve(outDir, 'package.json'), 'utf8');
    expect(pkg).toContain('"name": "motion-lab"');
    expect(pkg).toContain('"@rdna/radiants": "file:/Users/rivermassey/Desktop/dev/DNA-app-template/packages/radiants"');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/scaffold.test.ts
```

Expected: FAIL because `scaffoldProject` does not exist yet.

**Step 3: Write minimal implementation**

Create `packages/create/src/scaffold.ts` with:

```ts
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { normalizeScaffoldName, toPascalCase, toCamelCase } from './names';
import { renderTemplateString, resolveRadiantsDependency } from './template';

export interface ScaffoldOptions {
  appName: string;
  outDir: string;
  radiantsSource: 'workspace' | 'published';
  radiantsPath?: string;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const appName = normalizeScaffoldName(options.appName);
  const templateRoot = resolve(process.cwd(), 'templates/rados-app-prototype');
  mkdirSync(options.outDir, { recursive: true });
  cpSync(templateRoot, options.outDir, { recursive: true });

  const context = {
    appName,
    appPascalName: toPascalCase(appName),
    appCamelName: toCamelCase(appName),
    packageName: appName
  };

  // Replace tokens in all *.template and text files here.
  // Also replace __RADIANTS_DEP__ with resolveRadiantsDependency(...).
}
```

Update `packages/create/src/cli.ts` to parse:

```ts
rdna-create <app-name> --out-dir <dir> --radiants-source workspace --radiants-path /abs/path
```

Add a root smoke script:

```json
{
  "scripts": {
    "create:smoke": "pnpm --filter @rdna/create exec node --experimental-strip-types src/cli.ts"
  }
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/scaffold.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add packages/create package.json
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "feat(create): scaffold standalone prototype apps"
```

### Task 6: Remove The Legacy RadOS Scaffolder And Update Guidance

**Files:**
- Delete: `apps/rad-os/scripts/create-app.ts`
- Modify: `apps/rad-os/package.json`
- Modify: `apps/rad-os/CLAUDE.md`
- Modify: `apps/rad-os/README.md`
- Modify: `apps/rad-os/SPEC.md`
- Create: `packages/create/src/__tests__/legacy-cleanup.test.ts`

**Step 1: Write the failing repo-contract test**

Create `packages/create/src/__tests__/legacy-cleanup.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('legacy cleanup', () => {
  it('removes the stale rad-os create-app script', () => {
    const pkgPath = resolve(process.cwd(), 'apps/rad-os/package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts['create-app']).toBeUndefined();
    expect(existsSync(resolve(process.cwd(), 'apps/rad-os/scripts/create-app.ts'))).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/legacy-cleanup.test.ts
```

Expected: FAIL because the old script still exists and `apps/rad-os/package.json` still exposes it.

**Step 3: Write minimal implementation**

Delete `apps/rad-os/scripts/create-app.ts`.

Update `apps/rad-os/package.json` by removing:

```json
"create-app": "npx ts-node scripts/create-app.ts"
```

Update `apps/rad-os/CLAUDE.md`, `apps/rad-os/README.md`, and `apps/rad-os/SPEC.md` so they point developers at `@rdna/create` instead of the removed script.

Keep the doc changes narrow:
- replace command examples
- replace “create-app scaffolding” wording
- do not rewrite unrelated architecture sections

**Step 4: Run test and grep verification**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec vitest run src/__tests__/legacy-cleanup.test.ts
rg -n "scripts/create-app.ts|create-app\"" /Users/rivermassey/Desktop/dev/DNA-app-template/apps/rad-os /Users/rivermassey/Desktop/dev/DNA-app-template/docs
```

Expected:
- Vitest PASS
- `rg` only returns historical docs that you intentionally keep

**Step 5: Commit**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add apps/rad-os/package.json apps/rad-os/CLAUDE.md apps/rad-os/README.md apps/rad-os/SPEC.md packages/create/src/__tests__/legacy-cleanup.test.ts
git -C /Users/rivermassey/Desktop/dev/DNA-app-template rm apps/rad-os/scripts/create-app.ts
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "refactor(create): remove stale rad-os scaffolder"
```

### Task 7: Simulate The Scaffold End-To-End Before Calling It Done

**Files:**
- No code changes expected unless verification fails

**Step 1: Run the create package test suite**

Run:

```bash
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create test
```

Expected: PASS.

**Step 2: Generate a smoke-test app into `/tmp`**

Run:

```bash
rm -rf /tmp/rdna-create-smoke
pnpm --dir /Users/rivermassey/Desktop/dev/DNA-app-template --filter @rdna/create exec node --experimental-strip-types src/cli.ts motion-lab --out-dir /tmp/rdna-create-smoke --radiants-source workspace --radiants-path /Users/rivermassey/Desktop/dev/DNA-app-template/packages/radiants
```

Expected: CLI prints the created path and the generated app contains `components/AppWindow.tsx`, `components/Taskbar.tsx`, and `lib/controlSurface.ts`.

**Step 3: Install and verify the generated app**

Run:

```bash
cd /tmp/rdna-create-smoke
pnpm install
pnpm lint
pnpm test
pnpm build
```

Expected: all four commands PASS.

**Step 4: Run the generated app and manually inspect the shell**

Run:

```bash
cd /tmp/rdna-create-smoke
pnpm dev
```

Expected manual checks:
- the prototype AppWindow renders
- the Taskbar renders and resizes the prototype shell
- `WindowContent` modes are present in code and usable
- there is a `lib/controlSurface.ts` stub, but no detached control-surface implementation yet

**Step 5: Commit any verification fixes**

```bash
git -C /Users/rivermassey/Desktop/dev/DNA-app-template add -A
git -C /Users/rivermassey/Desktop/dev/DNA-app-template commit -m "test(create): verify scaffolded app workflow"
```

## Notes For The Follow-Up Control-Surface Prototype

- The first isolated prototype should be generated from `@rdna/create`, not built inside `apps/rad-os`.
- Keep `@rdna/radiants` as the primitive dependency only.
- The first prototype app should consume `lib/controlSurface.ts` as the seam and replace that stub with the real control-surface package later.
- Detached companion windows are explicitly out of scope for this scaffold phase.
