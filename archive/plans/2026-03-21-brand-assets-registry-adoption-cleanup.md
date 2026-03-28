# Brand Assets Registry Adoption + Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adopt the shared registry controls in Brand Assets, make forced-state inspection real in both consumers, and delete the remaining legacy registry drift residue tied to the old runtime copy.

**Architecture:** This plan assumes `docs/plans/2026-03-21-canonical-registry-contract-playground-migration.md` is already complete. `rad-os` consumes the shared `PropControls` and canonical registry metadata directly, forced-state CSS is extracted once into `@rdna/radiants`, and the final cleanup removes `registry.overrides.tsx` while keeping regression coverage pointed at `runtime-attachments.tsx`, the real runtime source.

**Tech Stack:** TypeScript, React 19, Next.js 16, Vitest, CSS, `rad-os`.

---

### Task 1: Extract Shared Forced-State CSS

**Files:**
- Create: `packages/radiants/registry/forced-states.css`
- Modify: `packages/radiants/package.json`
- Modify: `tools/playground/app/globals.css`
- Modify: `apps/rad-os/app/globals.css`
- Delete: `tools/playground/app/playground/forced-states.css`

**Step 1: Verify the current gap**

Run:

```bash
rg -n "forced-states\\.css|data-force-state" \
  tools/playground/app \
  apps/rad-os/app \
  packages/radiants/registry
```

Expected: only the playground local stylesheet exists, and `rad-os` has no matching forced-state rules.

**Step 2: Create the shared stylesheet**

Move the current rule set into `packages/radiants/registry/forced-states.css` verbatim. The file should own selectors like:

```css
[data-force-state="hover"] [data-slot="button-root"][data-mode="solid"]:not([data-state="selected"]) {
  transform: translateY(-1px);
  filter: drop-shadow(0 1px 0 var(--color-ink));
}

[data-force-state="focus"] button,
[data-force-state="focus"] input,
[data-force-state="focus"] [role="button"] {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

[data-force-state="error"] [data-slot="field-root"] {
  --field-error: 1;
}
```

Export the stylesheet from `packages/radiants/package.json` so Next can import it by package path:

```json
"./registry/forced-states.css": "./registry/forced-states.css"
```

Replace the playground-local import with the shared package import:

```css
@import "@rdna/radiants/registry/forced-states.css";
```

Add the same import to `apps/rad-os/app/globals.css`.

Delete `tools/playground/app/playground/forced-states.css`.

**Step 3: Verify the import path works**

Run:

```bash
pnpm --filter @rdna/playground exec vitest run \
  app/playground/__tests__/registry.test.ts \
  --cache=false
pnpm --filter rad-os exec tsc --noEmit
```

Expected: PASS. If the package-path CSS import fails, fix package export wiring here. Do **not** duplicate the rules into `rad-os`.

**Step 4: Commit**

```bash
git add \
  packages/radiants/registry/forced-states.css \
  packages/radiants/package.json \
  tools/playground/app/globals.css \
  apps/rad-os/app/globals.css \
  tools/playground/app/playground/forced-states.css
git commit -m "feat(registry): share forced state inspection styles"
```

---

### Task 2: Adopt Shared Controls In Brand Assets

**Files:**
- Modify: `apps/rad-os/components/ui/DesignSystemTab.tsx`

**Step 1: Write down the current missing behavior**

Run:

```bash
rg -n "PropControls|useShowcaseProps|data-force-state|controlledProps" \
  apps/rad-os/components/ui/DesignSystemTab.tsx
```

Expected: no matches.

**Step 2: Add the shared controls and state wiring**

Update `apps/rad-os/components/ui/DesignSystemTab.tsx` to use the shared layer:

```tsx
import {
  PropControls,
  useShowcaseProps,
  type ForcedState,
} from "@rdna/radiants/registry";
```

Inside `ComponentShowcaseCard`, replace the static preview logic with shared prop state:

```tsx
const Component = entry.component;
const { props, remountKey, setPropValue, resetProps } = useShowcaseProps(entry);
const [forcedState, setForcedState] = useState<"default" | ForcedState>("default");
const stateAttr = forcedState === "default" ? undefined : forcedState;
const hasControllableProps =
  Object.keys(entry.props).length > 0 &&
  !(entry.renderMode === "custom" && entry.controlledProps?.length === 0);
```

Render the preview through the same props object:

```tsx
<div data-force-state={stateAttr} key={remountKey}>
  {entry.Demo ? <entry.Demo {...props} /> : Component ? <Component {...props} /> : null}
</div>
```

Render the state strip only when `entry.states?.length` is non-zero, and render `<PropControls>` only when `hasControllableProps` is true:

```tsx
<PropControls
  props={entry.props}
  values={props}
  onChange={setPropValue}
  onReset={resetProps}
  controlledProps={entry.controlledProps}
  renderMode={entry.renderMode}
/>
```

Keep the existing `rad-os` card chrome. Do not copy the playground card layout into this file.

**Step 3: Verify the shared Brand Assets behavior**

Run:

```bash
pnpm --filter rad-os exec tsc --noEmit
```

Expected: PASS.

Manual smoke test:

```bash
pnpm --filter rad-os dev
```

Then verify in the browser:

1. Open Brand Assets and navigate to `04 UI Toolkit`.
2. Confirm `Label`, `TextArea`, and `Radio` show their own prop panels.
3. Toggle a forced state and confirm it visibly changes the preview.
4. Change a prop override and confirm the preview updates.

**Step 4: Commit**

```bash
git add apps/rad-os/components/ui/DesignSystemTab.tsx
git commit -m "feat(rad-os): adopt shared registry prop controls"
```

---

### Task 3: Delete Drift Residue And Keep Coverage Pointed At The Real Runtime Source

**Files:**
- Delete: `packages/radiants/registry/registry.overrides.tsx`
- Delete: `packages/radiants/registry/__tests__/registry-overrides-props.test.ts`
- Create: `packages/radiants/registry/__tests__/runtime-attachments-props.test.ts`
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Verify nothing live still imports the old runtime copy**

Run:

```bash
rg -n "registry\\.overrides" \
  packages/radiants \
  tools/playground \
  apps/rad-os
```

Expected: only the old cleanup test should still mention it.

**Step 2: Write the failing replacement regression test**

Create `packages/radiants/registry/__tests__/runtime-attachments-props.test.ts` so it targets the active runtime file instead of the deleted copy:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "registry/runtime-attachments.tsx"),
  "utf8",
);

describe("runtime attachments prop forwarding", () => {
  it("threads Select forwarding props through the active runtime demo", () => {
    expect(source).toContain(
      "Demo: ({ size = 'md', disabled, placeholder = 'Pick a color', error, fullWidth, value }: Record<string, unknown>) => {",
    );
    expect(source).toContain(
      "const { state, actions } = Select.useSelectState({ value: typeof value === 'string' ? value : undefined });",
    );
  });

  it("threads Drawer and Sheet panel props through the active runtime demo", () => {
    expect(source).toContain(
      "Demo: ({ direction = 'bottom', defaultOpen }: Record<string, unknown>) => {",
    );
    expect(source).toContain("<Sheet side={side as string} {...rest}>");
  });
});
```

**Step 3: Delete the dead copy and update the docs**

Delete `packages/radiants/registry/registry.overrides.tsx` and the old `registry-overrides-props.test.ts`.

Update `packages/radiants/DESIGN.md` anywhere it still implies there are two runtime sources. The doc should say:

```md
- `build-registry-metadata.ts` is the canonical server-safe metadata builder.
- `runtime-attachments.tsx` is the only runtime wiring layer for custom demos.
- Shared consumers should use canonical registry metadata instead of ad hoc manifest joins.
```

**Step 4: Run the cleanup verification**

Run:

```bash
pnpm --filter @rdna/radiants exec vitest run \
  registry/__tests__/runtime-coverage.test.ts \
  registry/__tests__/runtime-attachments-props.test.ts \
  --cache=false
pnpm --filter @rdna/playground check:registry-freshness
pnpm --filter rad-os exec tsc --noEmit
```

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  packages/radiants/registry/registry.overrides.tsx \
  packages/radiants/registry/__tests__/registry-overrides-props.test.ts \
  packages/radiants/registry/__tests__/runtime-attachments-props.test.ts \
  packages/radiants/DESIGN.md
git commit -m "chore(registry): delete legacy runtime drift residue"
```

---

### Implementation Notes

- Do not re-introduce a local `forced-states.css` copy under either consumer after the shared file lands.
- If forced-state imports prove impossible through the package surface, fix package exports first. Do not silently drop the feature while the UI still exposes the controls.
- Keep runtime-forwarding regression coverage tied to `runtime-attachments.tsx`, because that is the real runtime source after this cleanup.
- Do not touch `BrandAssetsApp.tsx` unless `DesignSystemTab` needs a new prop contract. The expected path is to keep the adoption isolated to `DesignSystemTab.tsx`.
