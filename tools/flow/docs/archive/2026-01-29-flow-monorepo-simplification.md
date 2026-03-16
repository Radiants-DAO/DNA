# Flow + Monorepo Simplification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate redundant wiring between DNA theme packages and RadFlow by leveraging monorepo conventions to auto-generate component preview routes, unify schema discovery, and remove manual bridge installation.

**Architecture:** Introduce a shared `@rdna/preview` package that auto-generates the `/__component` route from barrel exports + schema files. Move schema/DNA metadata inline via co-located TypeScript exports so components are self-describing. Standardize dev server conventions so RadFlow discovers ports without parsing scripts.

**Tech Stack:** React 19, Next.js 16, Tauri 2 (Rust), Tailwind v4, pnpm workspaces, SWC, lightningcss

---

## Problem Summary

| Problem | Current State | Impact |
|---------|--------------|--------|
| Double registration | Components exported in `index.ts` AND manually registered in `/__component/page.tsx` per app | Every app duplicates a registry; new components need changes in 2+ places |
| Schema drift | `.schema.json` + `.dna.json` are separate files from `.tsx` | 3 files per component, no compile-time guarantee they match |
| Manual bridge setup | Each app must install `@rdna/bridge` and create `/__component` route | Boilerplate per app; preview fails silently if missing |
| Fragile port detection | Rust parses `package.json` scripts string for port number | Breaks on custom dev commands, turbo pipelines |
| Hardcoded preview URL | `/__component?name={name}` convention baked into CanvasComponentPreview | Not standardized; each app reimplements |

---

## Task 1: Create `@rdna/preview` — Auto-Generated Component Route

**Files:**
- Create: `packages/preview/package.json`
- Create: `packages/preview/src/PreviewPage.tsx`
- Create: `packages/preview/src/index.ts`
- Create: `packages/preview/tsconfig.json`

**What this does:** A shared Next.js page component that reads the theme's barrel export (`components/core/index.ts`) and renders any component by name via query param. Apps import this instead of hand-rolling `/__component/page.tsx`.

**Step 1: Create package scaffold**

```json
// packages/preview/package.json
{
  "name": "@rdna/preview",
  "version": "0.1.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./page": "./src/PreviewPage.tsx"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "next": "^16.0.0"
  }
}
```

**Step 2: Create PreviewPage component**

```tsx
// packages/preview/src/PreviewPage.tsx
"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";

type ComponentRegistry = Record<string, React.ComponentType<any>>;

function ComponentRenderer({ registry }: { registry: ComponentRegistry }) {
  const params = useSearchParams();
  const name = params.get("name");

  if (!name) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace" }}>
        <h2>Available components:</h2>
        <ul>
          {Object.keys(registry).map((n) => (
            <li key={n}>
              <a href={`?name=${n}`}>{n}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const Component = registry[name];
  if (!Component) {
    return <div style={{ padding: 24, color: "red" }}>Unknown component: {name}</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Component />
    </div>
  );
}

export function PreviewPage({ registry }: { registry: ComponentRegistry }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentRenderer registry={registry} />
    </Suspense>
  );
}
```

**Step 3: Create barrel export**

```tsx
// packages/preview/src/index.ts
export { PreviewPage } from "./PreviewPage";
```

**Step 4: Commit**

```bash
git add packages/preview/
git commit -m "feat(preview): add @rdna/preview package for auto component routes"
```

---

## Task 2: Migrate Apps to Use `@rdna/preview`

**Files:**
- Modify: `apps/monolith-hackathon/package.json` — add `@rdna/preview` dep
- Modify: `apps/monolith-hackathon/app/__component/page.tsx` — replace manual registry
- Modify: `apps/rad-os/package.json` — add `@rdna/preview` dep (if `__component` route exists)

**Step 1: Update monolith-hackathon to use @rdna/preview**

Replace the entire `apps/monolith-hackathon/app/__component/page.tsx` with:

```tsx
// apps/monolith-hackathon/app/__component/page.tsx
import { PreviewPage } from "@rdna/preview/page";
import * as components from "@rdna/monolith/components/core";

export default function Page() {
  return <PreviewPage registry={components as Record<string, React.ComponentType>} />;
}
```

**Step 2: Add workspace dependency**

```bash
cd apps/monolith-hackathon
pnpm add @rdna/preview@workspace:*
```

**Step 3: Verify the route still works**

Run: `cd apps/monolith-hackathon && pnpm dev`
Navigate to: `http://localhost:3001/__component`
Expected: Component list renders. `?name=Button` renders Button.

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/
git commit -m "refactor(monolith-hackathon): use @rdna/preview for component route"
```

---

## Task 3: Co-locate Schema Metadata with Components

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx` (example component)
- Modify: `packages/radiants/components/core/Button/Button.schema.json` (keep for backward compat, mark deprecated)
- Create: `packages/radiants/components/core/Button/Button.meta.ts`

**What this does:** Export schema + DNA metadata as TypeScript alongside the component. This enables compile-time validation and eliminates drift. The `.schema.json` and `.dna.json` files remain for RadFlow's Rust scanner but are generated from the `.meta.ts` source of truth.

**Step 1: Create Button.meta.ts**

```tsx
// packages/radiants/components/core/Button/Button.meta.ts
import type { ComponentMeta } from "@rdna/preview";

export const ButtonMeta: ComponentMeta = {
  name: "Button",
  description: "Polymorphic button with retro shadow depth effect",
  props: {
    variant: {
      type: "enum",
      values: ["primary", "secondary", "outline", "ghost"],
      default: "primary",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
    },
    fullWidth: { type: "boolean", default: false },
    href: { type: "string" },
    disabled: { type: "boolean", default: false },
  },
  slots: {
    children: { description: "Button label text" },
    icon: { description: "Icon component" },
  },
  tokenBindings: {
    base: {
      border: "line",
      shadow: "btn",
    },
    primary: {
      background: "accent",
      text: "main",
    },
    secondary: {
      background: "inv",
      text: "flip",
    },
  },
};
```

**Step 2: Add ComponentMeta type to @rdna/preview**

```tsx
// packages/preview/src/types.ts
export interface PropDef {
  type: "string" | "number" | "boolean" | "enum";
  values?: string[];
  default?: unknown;
  required?: boolean;
}

export interface SlotDef {
  description: string;
}

export interface ComponentMeta {
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  tokenBindings?: Record<string, Record<string, string>>;
}
```

Update `packages/preview/src/index.ts`:
```tsx
export { PreviewPage } from "./PreviewPage";
export type { ComponentMeta, PropDef, SlotDef } from "./types";
```

**Step 3: Commit**

```bash
git add packages/preview/src/types.ts packages/preview/src/index.ts packages/radiants/components/core/Button/Button.meta.ts
git commit -m "feat(preview): add ComponentMeta type and Button.meta.ts co-located metadata"
```

---

## Task 4: Add `dna.port` Convention to Package.json

**Files:**
- Modify: `apps/monolith-hackathon/package.json` — add `"dna": { "port": 3001 }`
- Modify: `apps/rad-os/package.json` — add `"dna": { "port": 3000 }`
- Modify: `tools/flow/tauri/src/commands/workspace.rs` — read `dna.port` field first, fall back to script parsing

**What this does:** Standardize port discovery. Instead of regex-parsing `"dev": "next dev -p 3001"`, RadFlow reads `package.json#dna.port`. Script parsing remains as fallback.

**Step 1: Add dna field to monolith-hackathon**

Add to `apps/monolith-hackathon/package.json`:
```json
{
  "dna": {
    "port": 3001,
    "theme": "@rdna/monolith",
    "previewRoute": "/__component"
  }
}
```

**Step 2: Add dna field to rad-os**

Add to `apps/rad-os/package.json`:
```json
{
  "dna": {
    "port": 3000,
    "theme": "@rdna/radiants",
    "previewRoute": "/__component"
  }
}
```

**Step 3: Update Rust workspace scanner**

In `tools/flow/tauri/src/commands/workspace.rs`, update `detect_dev_port()` to check `dna.port` first:

```rust
fn detect_dev_port(pkg_json: &serde_json::Value) -> Option<u16> {
    // Priority 1: Explicit dna.port field
    if let Some(port) = pkg_json.get("dna")
        .and_then(|d| d.get("port"))
        .and_then(|p| p.as_u64())
    {
        return Some(port as u16);
    }

    // Priority 2: Parse from dev script (existing fallback)
    // ... existing regex logic ...
}
```

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/package.json apps/rad-os/package.json tools/flow/tauri/src/commands/workspace.rs
git commit -m "feat(flow): add dna.port convention for reliable port discovery"
```

---

## Task 5: Update RadFlow CanvasComponentPreview to Use `dna.previewRoute`

**Files:**
- Modify: `tools/flow/app/components/component-canvas/CanvasComponentPreview.tsx`
- Modify: `tools/flow/app/stores/slices/workspaceSlice.ts` — store `previewRoute` from dna config

**What this does:** Instead of hardcoding `/__component?name=...`, read the route from `package.json#dna.previewRoute`. Default remains `/__component` for backward compat.

**Step 1: Add previewRoute to workspace state**

In `workspaceSlice.ts`, add to the workspace/app entry type:
```tsx
previewRoute: string; // defaults to "/__component"
```

When scanning apps, read from `dna.previewRoute` field.

**Step 2: Update CanvasComponentPreview**

In `CanvasComponentPreview.tsx`, replace hardcoded route:
```tsx
// Before:
const previewUrl = `${serverUrl}/__component?name=${encodeURIComponent(componentName)}`;

// After:
const previewRoute = useAppStore((s) => s.activeApp?.previewRoute ?? "/__component");
const previewUrl = `${serverUrl}${previewRoute}?name=${encodeURIComponent(componentName)}`;
```

**Step 3: Commit**

```bash
git add tools/flow/app/components/component-canvas/CanvasComponentPreview.tsx tools/flow/app/stores/slices/workspaceSlice.ts
git commit -m "feat(flow): read previewRoute from dna config instead of hardcoding"
```

---

## Task 6: Add Schema Generation Script (meta.ts → .schema.json)

**Files:**
- Create: `packages/preview/src/generate-schemas.ts`
- Modify: `packages/radiants/package.json` — add `"generate:schemas"` script

**What this does:** For backward compatibility with RadFlow's Rust scanner (which reads `.schema.json`), provide a script that generates JSON from `.meta.ts` files. This keeps `.meta.ts` as source of truth while Rust still reads JSON.

**Step 1: Create generation script**

```tsx
// packages/preview/src/generate-schemas.ts
import { readdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";

async function generateSchemas(componentsDir: string) {
  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of dirs) {
    const metaPath = join(componentsDir, dir.name, `${dir.name}.meta.ts`);
    if (!existsSync(metaPath)) continue;

    const mod = await import(metaPath);
    const meta = Object.values(mod).find((v: any) => v?.name && v?.props);
    if (!meta) continue;

    const { tokenBindings, ...schema } = meta as any;

    // Write .schema.json
    writeFileSync(
      join(componentsDir, dir.name, `${dir.name}.schema.json`),
      JSON.stringify(schema, null, 2) + "\n"
    );

    // Write .dna.json if tokenBindings exist
    if (tokenBindings) {
      writeFileSync(
        join(componentsDir, dir.name, `${dir.name}.dna.json`),
        JSON.stringify({ component: schema.name, tokenBindings }, null, 2) + "\n"
      );
    }
  }

  console.log(`Generated schemas for ${dirs.length} components`);
}

const componentsDir = process.argv[2];
if (!componentsDir) {
  console.error("Usage: tsx generate-schemas.ts <components-dir>");
  process.exit(1);
}
generateSchemas(componentsDir);
```

**Step 2: Add script to radiants**

In `packages/radiants/package.json`, add:
```json
{
  "scripts": {
    "generate:schemas": "tsx ../preview/src/generate-schemas.ts ./components/core"
  }
}
```

**Step 3: Verify generation**

Run: `cd packages/radiants && pnpm generate:schemas`
Expected: `Button.schema.json` regenerated from `Button.meta.ts`

**Step 4: Commit**

```bash
git add packages/preview/src/generate-schemas.ts packages/radiants/package.json
git commit -m "feat(preview): add schema generation from .meta.ts files"
```

---

## Migration Path

This plan is **incremental and non-breaking**:

1. **Tasks 1-2:** New package + migrate apps (existing `.schema.json` files still work)
2. **Task 3:** Add `.meta.ts` alongside existing files (both coexist)
3. **Tasks 4-5:** Standardize port/route discovery (fallback to old behavior)
4. **Task 6:** Generation script bridges `.meta.ts` → `.schema.json` for Rust scanner

Each task can be shipped independently. Nothing breaks if only some tasks are completed.

---

## Future Work (Not in This Plan)

- **Rust schema scanner reads `.meta.ts` directly** — eliminate JSON intermediary entirely (requires SWC eval or V8 embedding in Tauri)
- **Auto-detect bridge installation** — RadFlow checks if `@rdna/preview` is in deps and skips bridge setup prompt
- **Component preview without dev server** — render components directly in Tauri webview using Vite SSR, eliminating iframe entirely
- **Schema validation in CI** — run `generate:schemas` in CI and fail if JSON output differs from committed files
