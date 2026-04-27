# Pretext Authoring Studio + Layout Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use /wf-execute to implement this plan task-by-task.

**Goal:** Turn Scratchpad into a markdown-first pretext authoring studio that previews documents inside real RadOS window constraints, saves a portable `*.md` + `*.pretext.json` pair, and extracts three reusable text layout primitives (`editorial`, `broadsheet`, `book`) from the current GoodNews and Manifesto prototypes.

**Architecture:** Keep markdown as the portable content source and store non-portable layout state in a sidecar JSON settings file. Draft persistence stays in localStorage for v1, while export/import flows handle the portable `*.md` + `*.pretext.json` pair via download, upload, and clipboard paste. Introduce a shared primitive registry plus three renderer/layout pipelines so Scratchpad preview, RadOS apps, and future blog consumers all render through the same components. Current one-off apps (`GoodNewsApp`, `ManifestoApp`) become thin wrappers over the shared primitive layer instead of owning bespoke layout code.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, `@chenglou/pretext`, `@rdna/radiants` pretext helpers, `useContainerSize`, `unified` + `remark-parse` + `remark-gfm`, localStorage for drafts, browser download/upload/clipboard flows for `.md` + `.pretext.json` export/import.

***

## Decisions Locked By This Plan

1. **Scratchpad becomes markdown-first.** The current BlockNote document JSON is no longer the canonical authoring format for new docs. Existing localStorage BlockNote docs are preserved as `legacy` drafts and can be converted later, but all new pretext docs are markdown + settings.

2. **The v1 primitive set is fixed to three kinds.**

   * `editorial` — long-form article / blog / essay, scrolling, usually one column with optional pullquote and drop cap

   * `broadsheet` — newspaper spread / front page, masthead, multi-column flow, obstacle-aware hero media

   * `book` — paginated document, chapters/sections, images as rect obstacles, page-aware flow

3. **Settings live beside markdown, not inside it.** The markdown file remains portable text. The sidecar JSON stores primitive choice, geometry, preview/window hints, asset bindings, and RadOS-specific defaults.

4. **localStorage is the working draft store.** V1 does not need a real filesystem backend. The portability story is: draft in localStorage, download files when needed, and rehydrate from upload or paste.

5. **The preview uses the real runtime.** Scratchpad preview and RadOS consumption both render through the same shared `PretextDocumentView` entrypoint.

6. **The older pretext editor plans are out of scope here.** This plan does not depend on `packages/controls` or the standalone inspector panel. It solves authoring and runtime reuse first.

7. **V1 explicitly does not support arbitrary RDNA slash-menu blocks inside markdown preview.** Scratchpad’s current BlockNote slash menu remains a legacy surface until there is a real markdown story for custom block components.

***

## Current Repo Reality

* Scratchpad today is BlockNote + localStorage only:

  * `apps/rad-os/components/apps/ScratchpadApp.tsx`

  * `apps/rad-os/components/apps/scratchpad/ScratchpadEditor.tsx`

  * `apps/rad-os/components/apps/scratchpad/use-scratchpad-docs.ts`

* The shared pretext helpers already exist in `@rdna/radiants`:

  * `packages/radiants/patterns/pretext-type-scale.ts`

  * `packages/radiants/patterns/pretext-prepare.ts`

  * `packages/radiants/patterns/pretext-hyphenation.ts`

  * `packages/radiants/patterns/pretext-justify.ts`

* Two prototype apps already prove the runtime direction:

  * `apps/rad-os/components/apps/GoodNewsApp.tsx`

  * `apps/rad-os/components/apps/manifesto/manifesto-layout.ts`

  * `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx`

* Typography playground already contains a strong seed for the third primitive:

  * `apps/rad-os/components/apps/typography-playground/layouts/EditorialLayout.tsx`

  * `apps/rad-os/components/apps/typography-playground/layouts/BroadsheetLayout.tsx`

***

### Task 1: Define The Canonical Pretext Document Contract

**Files:**

* Create: `apps/rad-os/components/apps/pretext/types.ts`

* Create: `apps/rad-os/components/apps/pretext/primitive-registry.ts`

* Test: `apps/rad-os/test/pretext-doc-contract.test.ts`

**Step 1: Write the failing contract test**

Create `apps/rad-os/test/pretext-doc-contract.test.ts` with coverage for:

* accepted primitive kinds: `editorial`, `broadsheet`, `book`

* required sidecar fields: `version`, `id`, `title`, `slug`, `primitive`, `primitiveSettings`

* stable default preview metadata

* per-primitive settings narrowing

Use this target shape in the test:

```ts
import { describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  primitiveKinds,
  type PretextPrimitiveKind,
} from '@/components/apps/pretext/primitive-registry';

describe('pretext document contract', () => {
  it('defines the v1 primitive registry', () => {
    expect(primitiveKinds).toEqual(['editorial', 'broadsheet', 'book']);
  });

  it('creates default editorial settings', () => {
    const settings = createDefaultSettings('editorial');
    expect(settings.primitive).toBe('editorial');
    expect(settings.version).toBe(1);
    expect(settings.preview.windowWidth).toBeGreaterThan(0);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-doc-contract.test.ts`

Expected: FAIL because the new modules do not exist.

**Step 3: Implement the contract**

Create `apps/rad-os/components/apps/pretext/types.ts` with:

```ts
export type PretextPrimitiveKind = 'editorial' | 'broadsheet' | 'book';

export interface PretextPreviewSettings {
  windowWidth: number;
  windowHeight: number;
  density: 'compact' | 'comfortable';
}

export interface EditorialSettings {
  primitive: 'editorial';
  dropCap: boolean;
  pullquote: boolean;
  columnCount: 1 | 2;
}

export interface BroadsheetSettings {
  primitive: 'broadsheet';
  columns: 2 | 3;
  masthead: string;
  heroImageKey?: string;
  heroWrap: 'leftSide' | 'rightSide' | 'both';
}

export interface BookSettings {
  primitive: 'book';
  pageWidth: number;
  pageHeight: number;
  columns: 1 | 2;
  coverImageKey?: string;
}

export type PrimitiveSettings =
  | EditorialSettings
  | BroadsheetSettings
  | BookSettings;

export interface PretextDocumentSettings {
  version: 1;
  id: string;
  title: string;
  slug: string;
  primitive: PretextPrimitiveKind;
  preview: PretextPreviewSettings;
  primitiveSettings: PrimitiveSettings;
  assets: Record<string, string>;
}
```

Create `apps/rad-os/components/apps/pretext/primitive-registry.ts` with:

* `primitiveKinds`

* `createDefaultSettings(kind)`

* `isPrimitiveKind(value)`

**Step 4: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-doc-contract.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  apps/rad-os/components/apps/pretext/types.ts \
  apps/rad-os/components/apps/pretext/primitive-registry.ts \
  apps/rad-os/test/pretext-doc-contract.test.ts
git commit -m "feat(rad-os): add pretext document contract and primitive registry"
```

***

### Task 2: Add Markdown + Sidecar Serialization

**Files:**

* Create: `apps/rad-os/components/apps/pretext/serialization.ts`

* Create: `apps/rad-os/components/apps/pretext/legacy.ts`

* Test: `apps/rad-os/test/pretext-serialization.test.ts`

* Modify: `apps/rad-os/package.json`

**Step 1: Add explicit markdown dependencies**

Add the runtime dependencies needed for markdown parsing:

```json
{
  "dependencies": {
    "remark-gfm": "^4.0.1",
    "remark-parse": "^11.0.0",
    "unified": "^11.0.5"
  }
}
```

Do not rely on transitive markdown packages from BlockNote.

**Step 2: Write the failing serialization test**

Create `apps/rad-os/test/pretext-serialization.test.ts` with cases for:

* serializing a bundle into `{ markdown, settingsJson }`

* parsing back into the exact same settings

* rejecting invalid primitive names

* preserving legacy scratchpad docs as `legacy` instead of silently deleting them

Use this target API:

```ts
import { describe, expect, it } from 'vitest';
import {
  deserializePretextBundle,
  serializePretextBundle,
} from '@/components/apps/pretext/serialization';

describe('pretext bundle serialization', () => {
  it('round-trips markdown + settings', () => {
    const bundle = {
      markdown: '# Hello\n\nBody copy.',
      settings: {
        version: 1,
        id: 'doc-1',
        title: 'Hello',
        slug: 'hello',
        primitive: 'editorial',
        preview: { windowWidth: 720, windowHeight: 900, density: 'comfortable' },
        primitiveSettings: { primitive: 'editorial', dropCap: true, pullquote: false, columnCount: 1 },
        assets: {},
      },
    } as const;

    const encoded = serializePretextBundle(bundle);
    const decoded = deserializePretextBundle(encoded.markdown, encoded.settingsJson);
    expect(decoded).toEqual(bundle);
  });
});
```

**Step 3: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-serialization.test.ts`

Expected: FAIL because the serializer and legacy adapter do not exist.

**Step 4: Implement the serializer + legacy adapter**

Create `apps/rad-os/components/apps/pretext/serialization.ts` with:

* `serializePretextBundle({ markdown, settings })`

* `deserializePretextBundle(markdown, settingsJson)`

* `downloadPretextBundle(bundle)` returning filenames:

  * `${slug}.md`

  * `${slug}.pretext.json`

* `deserializePretextBundleFromPaste(text)` supporting:

  * raw markdown paste

  * markdown followed by a fenced JSON settings block

  * raw JSON settings pasted separately into the import UI

Create `apps/rad-os/components/apps/pretext/legacy.ts` with:

* `type ScratchpadDraft = LegacyScratchpadDraft | PretextScratchpadDraft`

* `coerceStoredDoc(raw)` that preserves old BlockNote JSON docs as `{ kind: 'legacy-blocknote' }`

* no destructive migration in this task

**Step 5: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-serialization.test.ts`

Expected: PASS.

**Step 6: Commit**

```bash
git add \
  apps/rad-os/package.json \
  apps/rad-os/components/apps/pretext/serialization.ts \
  apps/rad-os/components/apps/pretext/legacy.ts \
  apps/rad-os/test/pretext-serialization.test.ts
git commit -m "feat(rad-os): add pretext bundle serialization"
```

***

### Task 3: Normalize Markdown Into Shared Pretext Blocks

**Files:**

* Create: `apps/rad-os/components/apps/pretext/markdown.ts`

* Test: `apps/rad-os/test/pretext-markdown.test.ts`

**Step 1: Write the failing normalization test**

Create `apps/rad-os/test/pretext-markdown.test.ts` covering:

* `h1`/`h2`/`h3`

* paragraphs

* ordered and unordered lists

* blockquotes

* thematic breaks

* fenced code blocks

* images

Use this target shape:

```ts
import { describe, expect, it } from 'vitest';
import { markdownToPretextBlocks } from '@/components/apps/pretext/markdown';

describe('markdownToPretextBlocks', () => {
  it('converts common markdown blocks', () => {
    const blocks = markdownToPretextBlocks(`# Title\n\nParagraph\n\n> Quote\n\n- A\n- B\n\n---`);
    expect(blocks.map((b) => b.type)).toEqual([
      'heading',
      'paragraph',
      'blockquote',
      'list',
      'rule',
    ]);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-markdown.test.ts`

Expected: FAIL because the parser does not exist.

**Step 3: Implement the markdown normalizer**

Create `apps/rad-os/components/apps/pretext/markdown.ts` with:

* a `PretextBlock` union

* `markdownToPretextBlocks(markdown: string): PretextBlock[]`

* `extractDocumentTitle(markdown: string, fallback: string): string`

Implementation rules:

* keep inline formatting as plain text for v1, except links/code spans if they are cheap to preserve

* do not implement tables, HTML, footnotes, or arbitrary MDX

* keep image nodes as `{ type: 'image', alt, src }` so the primitive layer can bind them via `assets`

**Step 4: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-markdown.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  apps/rad-os/components/apps/pretext/markdown.ts \
  apps/rad-os/test/pretext-markdown.test.ts
git commit -m "feat(rad-os): add markdown normalization for pretext documents"
```

***

### Task 4: Create The Shared Primitive Renderer Entry Point

**Files:**

* Create: `apps/rad-os/components/apps/pretext/PretextDocumentView.tsx`

* Create: `apps/rad-os/components/apps/pretext/PretextPreviewFrame.tsx`

* Test: `apps/rad-os/test/pretext-renderer.test.tsx`

**Step 1: Write the failing renderer smoke test**

Create `apps/rad-os/test/pretext-renderer.test.tsx` with:

* a smoke render for each primitive kind

* assertion that the correct primitive component is chosen

* assertion that the preview container passes real width/height through

Target API:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PretextDocumentView } from '@/components/apps/pretext/PretextDocumentView';

describe('PretextDocumentView', () => {
  it('renders the editorial primitive', () => {
    render(<PretextDocumentView markdown="# Hello" settings={/* editorial settings */} />);
    expect(screen.getByTestId('pretext-primitive-editorial')).toBeInTheDocument();
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-renderer.test.tsx`

Expected: FAIL because the shared renderer entrypoint does not exist.

**Step 3: Implement the shared renderer shell**

Create `apps/rad-os/components/apps/pretext/PretextDocumentView.tsx`:

* normalize markdown once

* switch on `settings.primitive`

* render one of:

  * `EditorialView`

  * `BroadsheetView`

  * `BookView`

Create `apps/rad-os/components/apps/pretext/PretextPreviewFrame.tsx`:

* wraps the preview in a RadOS-like surface

* uses `useContainerSize`

* passes width/height to the primitive view

For now, stub the three primitive components with obvious `data-testid` markers. Real implementations land in Tasks 5–7.

**Step 4: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-renderer.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  apps/rad-os/components/apps/pretext/PretextDocumentView.tsx \
  apps/rad-os/components/apps/pretext/PretextPreviewFrame.tsx \
  apps/rad-os/test/pretext-renderer.test.tsx
git commit -m "feat(rad-os): add shared pretext document renderer shell"
```

***

### Task 5: Extract The `book` Primitive From Manifesto

**Files:**

* Create: `apps/rad-os/components/apps/pretext/primitives/book/BookView.tsx`

* Create: `apps/rad-os/components/apps/pretext/primitives/book/book-layout.ts`

* Modify: `apps/rad-os/components/apps/pretext/PretextDocumentView.tsx`

* Modify: `apps/rad-os/components/apps/manifesto/manifesto-layout.ts`

* Modify: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx`

* Test: `apps/rad-os/test/pretext-book-layout.test.ts`

**Step 1: Write the failing&#x20;**`book`**&#x20;primitive test**

Create `apps/rad-os/test/pretext-book-layout.test.ts` with cases for:

* page creation when content exceeds page height

* obstacle-aware image placement

* heading + body font scaling via `resolveFluid()` and `lineHeight`

* stable return type for `BookView`

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-book-layout.test.ts`

Expected: FAIL because the shared book primitive does not exist.

**Step 3: Extract the generic book layout engine**

Move generic logic out of manifesto-specific files into:

* `book-layout.ts` — generic pagination and image obstacle handling

* `BookView.tsx` — visual renderer for paginated pages

Keep manifesto-specific content and trigger/glossary behavior in `ManifestoBook.tsx`. That wrapper should adapt manifesto content into the new shared primitive instead of owning the full layout engine.

**Step 4: Wire the book primitive into the shared renderer**

Update `PretextDocumentView.tsx` so `settings.primitive === 'book'` renders `BookView`.

**Step 5: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-book-layout.test.ts test/pretext-renderer.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add \
  apps/rad-os/components/apps/pretext/primitives/book/BookView.tsx \
  apps/rad-os/components/apps/pretext/primitives/book/book-layout.ts \
  apps/rad-os/components/apps/pretext/PretextDocumentView.tsx \
  apps/rad-os/components/apps/manifesto/manifesto-layout.ts \
  apps/rad-os/components/apps/manifesto/ManifestoBook.tsx \
  apps/rad-os/test/pretext-book-layout.test.ts
git commit -m "refactor(rad-os): extract shared book primitive from manifesto"
```

***

### Task 6: Extract The `broadsheet` Primitive From GoodNews

**Files:**

* Create: `apps/rad-os/components/apps/pretext/primitives/broadsheet/BroadsheetView.tsx`

* Create: `apps/rad-os/components/apps/pretext/primitives/broadsheet/broadsheet-layout.ts`

* Modify: `apps/rad-os/components/apps/pretext/PretextDocumentView.tsx`

* Modify: `apps/rad-os/components/apps/GoodNewsApp.tsx`

* Test: `apps/rad-os/test/pretext-broadsheet-layout.test.ts`

**Step 1: Write the failing&#x20;**`broadsheet`**&#x20;primitive test**

Create `apps/rad-os/test/pretext-broadsheet-layout.test.ts` with cases for:

* 2- or 3-column flow

* masthead + dateline output

* hero obstacle wrap slot selection

* drop-cap positioning

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-broadsheet-layout.test.ts`

Expected: FAIL because the shared broadsheet primitive does not exist.

**Step 3: Extract the generic broadsheet engine**

Create `broadsheet-layout.ts` by lifting the reusable parts of `GoodNewsApp.tsx`:

* column geometry

* obstacle wrap slot calculation

* masthead line layout

* body flow around a hero obstacle

Keep interactive drag/resize behavior in `GoodNewsApp.tsx` for now. The shared primitive owns layout; the app wrapper owns editor-like interactions.

**Step 4: Wire the primitive into the shared renderer**

Update `PretextDocumentView.tsx` so `settings.primitive === 'broadsheet'` renders `BroadsheetView`.

**Step 5: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-broadsheet-layout.test.ts test/pretext-renderer.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add \
  apps/rad-os/components/apps/pretext/primitives/broadsheet/BroadsheetView.tsx \
  apps/rad-os/components/apps/pretext/primitives/broadsheet/broadsheet-layout.ts \
  apps/rad-os/components/apps/pretext/PretextDocumentView.tsx \
  apps/rad-os/components/apps/GoodNewsApp.tsx \
  apps/rad-os/test/pretext-broadsheet-layout.test.ts
git commit -m "refactor(rad-os): extract shared broadsheet primitive from good news"
```

***

### Task 7: Add The `editorial` Primitive For Blogs And Essays

**Files:**

* Create: `apps/rad-os/components/apps/pretext/primitives/editorial/EditorialView.tsx`

* Create: `apps/rad-os/components/apps/pretext/primitives/editorial/editorial-layout.ts`

* Modify: `apps/rad-os/components/apps/pretext/PretextDocumentView.tsx`

* Test: `apps/rad-os/test/pretext-editorial-layout.test.ts`

**Step 1: Write the failing editorial test**

Create `apps/rad-os/test/pretext-editorial-layout.test.ts` with cases for:

* one-column article flow

* optional two-column mode on wide containers

* optional drop cap

* optional pullquote block

* image block rendering without pagination

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-editorial-layout.test.ts`

Expected: FAIL because the editorial primitive does not exist.

**Step 3: Implement the editorial primitive**

Build `EditorialView.tsx` from the typography-playground editorial direction, but make it runtime-driven:

* use normalized markdown blocks

* use pretext for line layout instead of CSS-only flow

* keep the visual language simple enough that this can become the default primitive for blog posts

The v1 editorial primitive should support:

* heading hierarchy

* body paragraphs

* blockquotes

* lists

* code blocks

* inline images between sections

**Step 4: Wire the primitive into the shared renderer**

Update `PretextDocumentView.tsx` so `settings.primitive === 'editorial'` renders `EditorialView`.

**Step 5: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-editorial-layout.test.ts test/pretext-renderer.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add \
  apps/rad-os/components/apps/pretext/primitives/editorial/EditorialView.tsx \
  apps/rad-os/components/apps/pretext/primitives/editorial/editorial-layout.ts \
  apps/rad-os/components/apps/pretext/PretextDocumentView.tsx \
  apps/rad-os/test/pretext-editorial-layout.test.ts
git commit -m "feat(rad-os): add editorial pretext primitive"
```

***

### Task 8: Rebuild Scratchpad Around Markdown, Settings, And Live Preview

**Files:**

* Modify: `apps/rad-os/components/apps/ScratchpadApp.tsx`

* Modify: `apps/rad-os/components/apps/scratchpad/use-scratchpad-docs.ts`

* Replace: `apps/rad-os/components/apps/scratchpad/ScratchpadEditor.tsx`

* Create: `apps/rad-os/components/apps/scratchpad/MarkdownEditorPane.tsx`

* Create: `apps/rad-os/components/apps/scratchpad/PrimitiveSettingsPanel.tsx`

* Create: `apps/rad-os/components/apps/scratchpad/ExportImportControls.tsx`

* Test: `apps/rad-os/test/scratchpad-pretext.test.tsx`

**Step 1: Write the failing Scratchpad authoring test**

Create `apps/rad-os/test/scratchpad-pretext.test.tsx` covering:

* creating a new doc from each primitive

* editing markdown updates the preview

* editing primitive settings updates the preview

* export generates `.md` + `.pretext.json`

* importing the pair restores the same preview

* pasting exported markdown back into Scratchpad preserves headings, paragraphs, lists, quotes, rules, code blocks, and images

* legacy BlockNote docs still appear and are not deleted

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/scratchpad-pretext.test.tsx`

Expected: FAIL because Scratchpad is still BlockNote-only.

**Step 3: Replace Scratchpad’s storage model**

Refactor `use-scratchpad-docs.ts` to store a discriminated union:

```ts
type ScratchpadDraft =
  | { kind: 'pretext'; id: string; title: string; markdown: string; settings: PretextDocumentSettings; updatedAt: number }
  | { kind: 'legacy-blocknote'; id: string; title: string; content: unknown[]; updatedAt: number };
```

Rules:

* existing localStorage docs load as `legacy-blocknote`

* new docs always use `kind: 'pretext'`

* do not silently convert or discard legacy docs

**Step 4: Replace the editor surface**

Delete the BlockNote-first editor path for new docs and replace it with:

* `MarkdownEditorPane.tsx` — plain markdown textarea/editor surface

* `PrimitiveSettingsPanel.tsx` — primitive chooser + per-primitive controls

* `ExportImportControls.tsx` — download/upload/paste the `.md` + `.pretext.json` pair

`ScratchpadApp.tsx` should become a 3-pane layout:

* document list / actions

* markdown source

* live preview + settings

Legacy docs may still open in a read-only compatibility pane with a banner:

* “Legacy BlockNote draft — create a new pretext doc to continue”

Import UX rules:

* uploading both files is the highest-fidelity path

* pasting markdown alone creates or updates a doc body while preserving current settings

* pasting markdown plus a fenced JSON settings block rehydrates both body and primitive settings in one shot

* the import surface must show which primitive/settings were inferred before overwriting the active doc

**Step 5: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/scratchpad-pretext.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add \
  apps/rad-os/components/apps/ScratchpadApp.tsx \
  apps/rad-os/components/apps/scratchpad/use-scratchpad-docs.ts \
  apps/rad-os/components/apps/scratchpad/ScratchpadEditor.tsx \
  apps/rad-os/components/apps/scratchpad/MarkdownEditorPane.tsx \
  apps/rad-os/components/apps/scratchpad/PrimitiveSettingsPanel.tsx \
  apps/rad-os/components/apps/scratchpad/ExportImportControls.tsx \
  apps/rad-os/test/scratchpad-pretext.test.tsx
git commit -m "feat(rad-os): turn scratchpad into pretext authoring studio"
```

***

### Task 9: Prove RadOS Consumption With Real `.md` + `.pretext.json` Samples

**Files:**

* Create: `apps/rad-os/public/pretext/editorial-demo.md`

* Create: `apps/rad-os/public/pretext/editorial-demo.pretext.json`

* Create: `apps/rad-os/public/pretext/broadsheet-demo.md`

* Create: `apps/rad-os/public/pretext/broadsheet-demo.pretext.json`

* Create: `apps/rad-os/public/pretext/book-demo.md`

* Create: `apps/rad-os/public/pretext/book-demo.pretext.json`

* Create: `apps/rad-os/components/apps/pretext/load-pretext-bundle.ts`

* Test: `apps/rad-os/test/pretext-bundle-loader.test.ts`

**Step 1: Write the failing loader test**

Create `apps/rad-os/test/pretext-bundle-loader.test.ts` with cases for:

* loading a markdown string + settings JSON pair

* validating the primitive kind

* returning a `PretextDocumentView`-ready object

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter rad-os exec vitest run test/pretext-bundle-loader.test.ts`

Expected: FAIL because the loader and sample bundles do not exist.

**Step 3: Add sample bundles and loader**

Create three real sample bundles under `apps/rad-os/public/pretext/`:

* `editorial-demo.*` — small article / blog post

* `broadsheet-demo.*` — newspaper-style front page

* `book-demo.*` — short multi-page booklet excerpt

Create `load-pretext-bundle.ts` with:

* `loadPretextBundle(basePath: string)`

* `loadPretextBundleFromFiles(markdownFile: File, settingsFile: File)`

Use the same deserialize path from Task 2. Do not add a second parser.

**Step 4: Run the test to verify it passes**

Run: `pnpm --filter rad-os exec vitest run test/pretext-bundle-loader.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add \
  apps/rad-os/public/pretext/editorial-demo.md \
  apps/rad-os/public/pretext/editorial-demo.pretext.json \
  apps/rad-os/public/pretext/broadsheet-demo.md \
  apps/rad-os/public/pretext/broadsheet-demo.pretext.json \
  apps/rad-os/public/pretext/book-demo.md \
  apps/rad-os/public/pretext/book-demo.pretext.json \
  apps/rad-os/components/apps/pretext/load-pretext-bundle.ts \
  apps/rad-os/test/pretext-bundle-loader.test.ts
git commit -m "feat(rad-os): add real pretext bundle samples and loader"
```

***

### Task 10: Full Verification And Cleanup

**Files:**

* Modify: `apps/rad-os/components/apps/scratchpad/scratchpad-spec.md`

* Modify: `archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-03-29-rados-pretext-migration-brainstorm.md`

* Modify: `archive/plans/2026-03-29-pretext-migration-phase1-foundation.md`

**Step 1: Run focused tests**

Run:

```bash
pnpm --filter rad-os exec vitest run \
  test/pretext-doc-contract.test.ts \
  test/pretext-serialization.test.ts \
  test/pretext-markdown.test.ts \
  test/pretext-renderer.test.tsx \
  test/pretext-book-layout.test.ts \
  test/pretext-broadsheet-layout.test.ts \
  test/pretext-editorial-layout.test.ts \
  test/scratchpad-pretext.test.tsx \
  test/pretext-bundle-loader.test.ts
```

Expected: PASS.

**Step 2: Run the RadOS package test suite**

Run: `pnpm --filter rad-os test`

Expected: PASS.

**Step 3: Run a production build**

Run: `pnpm --filter rad-os build`

Expected: PASS.

**Step 4: Manual smoke in the browser**

Run: `pnpm --filter rad-os dev`

Verify:

* Scratchpad can create `editorial`, `broadsheet`, and `book` docs

* editing markdown reflows preview live

* export downloads two files: `slug.md` and `slug.pretext.json`

* upload import recreates the same preview

* paste import recreates markdown structure with the correct formatting semantics

* GoodNews still works

* Manifesto still works

* sample bundles under `/pretext/*.md` can be loaded and previewed

**Step 5: Update the stale docs**

Update the old migration docs so they match the new reality:

* `archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-03-29-rados-pretext-migration-brainstorm.md`

* `archive/plans/2026-03-29-pretext-migration-phase1-foundation.md`

Specifically:

* Manifesto is no longer “next”; it is already part of the shared primitive extraction work

* Scratchpad is now the authoring surface

* the primitive set is `editorial`, `broadsheet`, `book`

**Step 6: Commit**

```bash
git add \
  apps/rad-os/components/apps/scratchpad/scratchpad-spec.md \
  archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-03-29-rados-pretext-migration-brainstorm.md \
  archive/plans/2026-03-29-pretext-migration-phase1-foundation.md
git commit -m "docs: update pretext migration plan for scratchpad authoring and primitives"
```

***

## End State

After this plan:

* Scratchpad is the canonical authoring surface for pretext docs

* the canonical storage contract is `*.md` + `*.pretext.json`

* RadOS has three real reusable text primitives:

  * `editorial`

  * `broadsheet`

  * `book`

* GoodNews and Manifesto are no longer isolated experiments

* future blog or content surfaces can consume the same document bundle without inventing another authoring format

## Explicit Non-Goals

* No `packages/controls` visual inspector in this plan

* No standalone shadow-DOM pretext panel in this plan

* No generalized VFS or desktop filesystem integration in this plan

* No arbitrary RDNA BlockNote component round-trip through markdown in v1

**Next after this plan:** if needed, add optional filesystem/VFS-backed persistence on top of the already-working localStorage + download + paste-import workflow.

⠀
