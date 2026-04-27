# Agent 5 — Weak Type Strengthening (Stage 1)

**Head:** d658b2b568bdb0ff4921f83c4ada8bcedd76df55
**Branch:** main
**Scope:** Read-only audit of `any`, `object`, `Function`, `{}`, `Record<string, any>`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` across `apps/rad-os`, `packages/radiants`, `packages/preview`, `packages/ctrl`, `packages/pixel`, `packages/create`.

## Critical assessment

The repo is in **very good shape** for weak typing. There are no `@ts-ignore` or `@ts-expect-error` suppressions, and no `Function`/`object`/`{}` type annotations. Zero hand-authored `any[]` type annotations appear outside the vendored Dotting engine.

Weak types cluster in three hot spots:

1. **`packages/radiants/registry/runtime-attachments.tsx`** — 13 `as any` casts in component Demo render functions. These originate because the Demo functions receive `Record<string, unknown>` (the registry's generic dispatch contract) and then forward into narrow-union props. Many of these have publicly exported target types (`InputSize`, `TabsMode`) or can be resolved with `React.ComponentProps<typeof X>['prop']` — no new exports required.
2. **`packages/radiants/generated/blocknote-blocks.tsx`** plus its generator (`scripts/generate-blocknote-blocks.ts`) — 35+ `any` type annotations, all auto-generated. The generator's own comment cites BlockNote's deeply generic types, but the repo already ships `BlockNoteRenderProps` in `packages/radiants/blocknote/types.ts` and every hand-written render function consumes it. The generator should emit that type instead of `any`.
3. **Two cross-cutting type aliases** — `ComponentMeta<any>` in `contract-fields.ts` and `ComponentType<any>` in `preview/PreviewPage.tsx`. Both have clean, provable fixes using the default generic `Record<string, unknown>` (or plain `ComponentMeta` / `ComponentType`).

One finding that is **intentional and NOT to be removed** in this pass: the eight `@ts-nocheck` files in `apps/rad-os/lib/dotting/`. These are a vendored canvas engine with comments explaining the suppression. Migration is out of scope.

## Ordered by confidence + severity

| ID | File | Confidence | Proposed type |
|---|---|---|---|
| WEAK-001 | `packages/radiants/registry/contract-fields.ts:5` | 0.95 | `ComponentMeta` (default TProps) |
| WEAK-014 | `packages/radiants/registry/runtime-attachments.tsx:618` | 0.95 | `mode as TabsMode` (already exported) |
| WEAK-008 | `packages/radiants/registry/runtime-attachments.tsx:329` | 0.94 | `size as InputSize` (already exported) |
| WEAK-003 | `packages/radiants/components/core/Input/Input.tsx:76` | 0.93 | `FieldValidity.State` from `@base-ui/react/field` |
| WEAK-004 | `packages/radiants/scripts/generate-blocknote-blocks.ts:181,186,191` + generated file | 0.92 | `BlockNoteRenderProps` |
| WEAK-009 | `packages/radiants/registry/runtime-attachments.tsx:361,364` | 0.92 | `name as string`, `className as string` |
| WEAK-002 | `packages/preview/src/PreviewPage.tsx:7` | 0.90 | `ComponentType<Record<string, unknown>>` |
| WEAK-018 | `apps/rad-os/lib/dotting/**` (8 files) | 0.90 | keep_with_reason (vendored) |
| WEAK-005 | `packages/radiants/registry/runtime-attachments.tsx:97` | 0.85 | `variant as AlertVariant` (requires export) |
| WEAK-011 | `packages/radiants/registry/runtime-attachments.tsx:553` | 0.84 | `ComponentProps<typeof Select.Trigger>['size']` |
| WEAK-006 | `packages/radiants/registry/runtime-attachments.tsx:282` | 0.82 | `ComponentProps<typeof Drawer.Provider>['direction']` |
| WEAK-007 | `packages/radiants/registry/runtime-attachments.tsx:312` | 0.82 | `ComponentProps<typeof DropdownMenuContent>['side']` |
| WEAK-010 | `packages/radiants/registry/runtime-attachments.tsx:413` | 0.82 | `ComponentProps<typeof NavigationMenu.Root>['orientation']` |
| WEAK-012 | `packages/radiants/registry/runtime-attachments.tsx:601` | 0.82 | `ComponentProps<typeof Slider>['size']` |
| WEAK-013 | `packages/radiants/registry/runtime-attachments.tsx:609` | 0.82 | `ComponentProps<typeof Switch>['size']` + `['labelPosition']` |
| WEAK-016 | `packages/radiants/registry/runtime-attachments.tsx:682` | 0.82 | `ComponentProps<typeof Toolbar.Root>['orientation']` |
| WEAK-017 | `packages/radiants/registry/runtime-attachments.tsx:700` | 0.82 | `ComponentProps<typeof Tooltip>['position']` |
| WEAK-015 | `packages/radiants/registry/runtime-attachments.tsx:670` | 0.80 | `ComponentProps<typeof ToggleGroup>['variant']` |
| WEAK-019 | `packages/radiants/registry/runtime-attachments.tsx:*` (`as string/boolean/number`) | 0.60 | keep_with_reason (not weak — scalar narrowings) |

## Categorical notes

- **`unknown` kept as-is** — Every `Record<string, unknown>` I inspected in the app and packages (migration function in `store/index.ts`, serialization validators, Demo prop dispatch, registry metadata) is genuinely correct usage. `unknown` is the type when the real type cannot yet be determined, and the codebase uses it consistently with narrowing. None of them are downgraded `any` — they all perform `typeof` / `as X` narrowing before use.
- **No `@ts-ignore` / `@ts-expect-error`** anywhere in the repo. That category is empty, so there are no dead suppressions to report as `comment_cleanup`.
- **No explicit `Function`, `object`, or bare `{}` type annotations.** These categories are also empty.
- **Most `as any` usages are in a single file** (`runtime-attachments.tsx`) and can be cleaned up with a consistent approach: either publicly export the narrow prop union types from each component or use `React.ComponentProps<typeof X>['prop']` inline. The former is slightly nicer for consumers; the latter is zero-diff outside the file.

## Dependencies

- WEAK-004 depends on regenerating the output file. Approvals must pair the generator edit with a follow-up run of `pnpm --filter @rdna/radiants generate:blocknote` and include `packages/radiants/generated/blocknote-blocks.tsx` in the edit_scope.
- WEAK-005 requires adding a new export to Alert.tsx. Alternative: skip the export and use `React.ComponentProps<typeof Alert.Root>['variant']` to keep the edit scope to a single file.
- WEAK-008 and WEAK-014 — the required types (`InputSize`, `TabsMode`) are already publicly exported, so these are single-file edits.

## Out of scope / not reported

- Occurrences of the word `any` inside comments, markdown strings, JSDoc notes, and `expect.any(...)` Jest matchers were filtered out.
- `.next/` compiled validator output (Next.js type harness) is not a hand-authored file.
- The `: {}` pattern (empty object literal default values, e.g. `propSchema: {}`, `slots: {}`) is used in `.meta.ts` contract files. These are values, not types, so they are not weak-type violations. They are the contract's canonical encoding of "no declared slots/props."
