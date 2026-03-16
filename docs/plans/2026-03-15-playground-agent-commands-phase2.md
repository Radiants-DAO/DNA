# Playground Agent Commands Phase 2: create-variants + fix

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace the generic `variations generate` with a creativity-ladder `create-variants` command, and add a `fix` command that resolves annotations by spawning Claude to patch the source component.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` (main checkout, `main` branch)

**Architecture:** Both commands are CLI-only — they live in `bin/commands/`, read files from disk, build prompts locally, spawn `claude --print`, then use existing server routes (`POST /generate/write`, `POST /adopt`, `POST /agent/annotation`) for lint-gated writes and annotation mutations. Work signals bracket all agent activity. No new server routes.

**Tech Stack:** Node.js ESM (`.mjs`), `child_process.spawn`, existing playground HTTP API

---

## Scope

- **`create-variants <component> [count]`** — replaces `variations generate`. Spawns `claude --print` with a creativity ladder prompt. Each variant gets a different energy level (Safe → Improvement → Bold → Wild → Beyond). Default count: 4. RDNA-lint-gated writes via existing server route.
- **`fix <component> --annotation <id>`** — spawns `claude --print` to fix a specific annotation. Writes the fix as an iteration, auto-adopts into source, resolves the annotation. Rolls back cleanly if lint fails.
- **Remove `variations generate`** — replaced by `create-variants`.

## Existing Infrastructure

- `bin/rdna-playground.mjs` — command dispatch (`COMMANDS` map)
- `bin/lib/api.mjs` — `get()`, `post()`, `del()` HTTP helpers to `localhost:3004`
- `bin/commands/variations.mjs` — `generate` subcommand to remove, `list/write/trash/adopt` to keep
- `bin/commands/work-signal.mjs` — `workStart(args)` / `workEnd(args)` pattern
- `POST /generate/write` — lint-gated iteration write (accepts `{ componentId, contents }`)
- `POST /adopt` — adopt iteration into source (accepts `{ componentId, iterationFile }`)
- `POST /agent/annotation` — resolve annotation (accepts `{ action: "resolve", id, summary }`)
- `POST /agent/signal` — work-start/work-end signals
- `generated/registry.manifest.json` — component metadata with sourcePaths
- `app/playground/lib/code-blocks.ts` — `extractCodeBlocks()` parses TSX from Claude output

## Execution Order

**Phase 1:** Task 1 (prompt builders) + Task 2 (tests) — parallel
**Phase 2:** Task 3 (`create-variants` command)
**Phase 3:** Task 4 (`fix` command)
**Phase 4:** Task 5 (wire into CLI + remove old generate)
**Phase 5:** Task 6 (README + docs)

---

## Task 1: Creativity Ladder + Fix Prompt Builders

**Files:**
- Create: `tools/playground/bin/lib/prompt.mjs`

**Step 1: Write the prompt builder module**

```js
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = resolve(__dirname, "../..");
const MONO_ROOT = resolve(PLAYGROUND_ROOT, "../..");

function tryRead(relPath) {
  try {
    return readFileSync(resolve(MONO_ROOT, relPath), "utf-8");
  } catch {
    return `[file not found: ${relPath}]`;
  }
}

function readManifest() {
  const raw = readFileSync(
    resolve(PLAYGROUND_ROOT, "generated/registry.manifest.json"),
    "utf-8",
  );
  const manifest = JSON.parse(raw);
  return Object.values(manifest).flatMap((pkg) =>
    pkg.components.map((c) => ({
      id: c.name.toLowerCase(),
      label: c.name,
      sourcePath: c.sourcePath ?? "",
      schemaPath: c.schemaPath,
    })),
  );
}

export function lookupComponent(componentId) {
  const registry = readManifest();
  const entry = registry.find((e) => e.id === componentId.toLowerCase());
  if (!entry) throw new Error(`Unknown component: ${componentId}`);
  return entry;
}

const RDNA_RULES = `### Token usage
1. Use ONLY semantic tokens: \`surface-*\`, \`content-*\`, \`edge-*\`, \`action-*\`, \`status-*\`
2. NEVER hardcode colors — no hex (#fff), rgb(), oklch(), or Tailwind palette classes (bg-blue-500)
3. NEVER use arbitrary spacing values (p-[12px], m-[1.5rem]) — use Tailwind scale classes (p-2, p-4)
4. NEVER use arbitrary typography (text-[14px], font-[600]) — use RDNA scale (text-sm through text-3xl)

### Radius, shadow, motion
5. Use \`rounded-sm\` or \`rounded-md\` (RDNA radius tokens) — NEVER \`rounded-[6px]\` or arbitrary radius
6. Use RDNA shadow tokens (shadow-resting, shadow-raised, shadow-floating) — NEVER \`shadow-[0_2px_4px]\`
7. Motion: ease-out only, max 300ms, CSS transitions preferred — NEVER arbitrary duration/easing

### Component integrity
8. NEVER use raw HTML elements when RDNA wrappers exist (Button, Input, Select, Dialog, etc.)
9. Icons: Lucide only (24x24 grid, 2px stroke) — NEVER custom SVGs or other icon libraries

### Prop shape preservation (CRITICAL)
10. The variation MUST export the EXACT same function name and prop interface as the source component
11. The variation MUST be a drop-in replacement — same props in, same behavior out
12. Do NOT add new required props, remove existing props, or change prop types
13. Do NOT change the component's export name or add/remove 'use client' directives
14. If the source uses class-variance-authority (cva), the variation MUST also use cva
15. If the source uses sub-components (CardHeader, CardBody), the variation MUST preserve those exports

### What to vary
16. Visual treatment: backgrounds, borders, shadows, spacing, typography weight/size within RDNA tokens
17. Layout within the component: flex direction, alignment, internal spacing rhythm
18. State styling: hover, focus, active, disabled visual feedback
19. DO NOT change the component's purpose or fundamental interaction pattern`;

function buildEnergyLevel(index, total) {
  const levels = [
    {
      name: "Safe Iteration",
      brief:
        "Minimal changes. Polish the existing design: tighten spacing, refine borders, adjust visual weight. Stay extremely close to the source. This should feel like a careful refinement by the same designer.",
    },
    {
      name: "Confident Improvement",
      brief:
        "Meaningful enhancement within the same visual language. Try a different spacing rhythm, weight distribution, or visual hierarchy. This should feel like 'version 2' of the same component — clearly better, same DNA.",
    },
    {
      name: "Bold Departure",
      brief:
        "Break one or two conventions. Try an unexpected layout, dramatically different visual weight, or an unconventional approach to the component's visual treatment. Surprise the viewer while keeping it functional.",
    },
    {
      name: "Wild Card",
      brief:
        "Completely reimagine the visual treatment. Swing for the fences. This variant should make someone say 'whoa, I didn't think of that.' Push the design system to its expressive limits. Think editorial design, fashion, architecture — not typical UI.",
    },
  ];

  if (index < levels.length) return levels[index];

  return {
    name: `Beyond (Level ${index + 1})`,
    brief: `Escalate further than Variant ${index}. Find inspiration outside digital UI entirely — print, signage, brutalist architecture, haute couture, record sleeves, museum wayfinding. Make it unforgettable. Every variant at this level should feel like it came from a different designer with a wildly different point of view.`,
  };
}

export function buildCreativityLadderPrompt({ componentId, sourcePath, schemaPath, count }) {
  const source = tryRead(sourcePath);
  const schema = schemaPath ? tryRead(schemaPath) : null;
  const designDoc = tryRead("packages/radiants/DESIGN.md");

  const ladder = Array.from({ length: count }, (_, i) => {
    const level = buildEnergyLevel(i, count);
    return `### Variant ${i + 1}: ${level.name}\n${level.brief}`;
  }).join("\n\n");

  return `You are generating ${count} design variations of a DNA/RDNA component.
Each variant has a DIFFERENT energy level — read the Creativity Ladder carefully
and match the ambition of each variant to its assigned level.

## Design System Reference

${designDoc}

## Source Component (${componentId})

File: ${sourcePath}

\`\`\`tsx
${source}
\`\`\`

${schema ? `## Schema\n\n\`\`\`json\n${schema}\n\`\`\`\n` : ""}

## RDNA Rules (MUST follow — violations will be rejected)

${RDNA_RULES}

## Creativity Ladder

${ladder}

## Output Format

Output each variation as a separate fenced TSX code block, in order (Variant 1 first).
Do not include filenames, explanations, or any text outside the code blocks.
Each code block must contain exactly one complete, self-contained .tsx component file
with 'use client' directive and the same named export as the source.
`;
}

export function buildFixPrompt({ componentId, sourcePath, schemaPath, annotation }) {
  const source = tryRead(sourcePath);
  const schema = schemaPath ? tryRead(schemaPath) : null;
  const designDoc = tryRead("packages/radiants/DESIGN.md");

  return `You are fixing a specific issue in a DNA/RDNA component.
A human reviewer left this annotation — address it precisely.

## Annotation

**Intent:** ${annotation.intent}
**Severity:** ${annotation.severity}
**Message:** ${annotation.message}

## Design System Reference

${designDoc}

## Source Component (${componentId})

File: ${sourcePath}

\`\`\`tsx
${source}
\`\`\`

${schema ? `## Schema\n\n\`\`\`json\n${schema}\n\`\`\`\n` : ""}

## RDNA Rules (MUST follow — violations will be rejected)

${RDNA_RULES}

## Task

Fix the issue described in the annotation above. Your output must be the COMPLETE
component file with the fix applied — not a diff, not a snippet, the whole file.

Requirements:
- Address the annotation's concern directly
- Preserve the exact same export name and prop interface
- Follow all RDNA token and styling rules
- Do not change anything unrelated to the annotation

## Output Format

Output exactly ONE fenced TSX code block containing the complete fixed component file.
No explanations, no filenames, no prose — just the code block.
`;
}
```

**Step 2: Commit**

```bash
git add tools/playground/bin/lib/prompt.mjs
git commit -m "feat(playground): add creativity ladder and fix prompt builders"
```

---

## Task 2: Tests for Prompt Builders

**Files:**
- Create: `tools/playground/app/playground/__tests__/prompt-builders.test.ts`

**Step 1: Write the tests**

These tests verify prompt structure. They need the manifest and source files to exist, so they run against the real repo (integration-style).

```ts
import { describe, expect, it } from "vitest";
import { resolve } from "path";

// Import the .mjs module — vitest handles ESM
const PROMPT_MODULE = resolve(
  import.meta.dirname,
  "../../../bin/lib/prompt.mjs",
);

async function loadPromptModule() {
  return import(PROMPT_MODULE) as Promise<{
    lookupComponent: (id: string) => { id: string; sourcePath: string; schemaPath?: string };
    buildCreativityLadderPrompt: (opts: {
      componentId: string;
      sourcePath: string;
      schemaPath?: string;
      count: number;
    }) => string;
    buildFixPrompt: (opts: {
      componentId: string;
      sourcePath: string;
      schemaPath?: string;
      annotation: { intent: string; severity: string; message: string };
    }) => string;
  }>;
}

describe("prompt builders", () => {
  describe("lookupComponent", () => {
    it("finds a known component", async () => {
      const { lookupComponent } = await loadPromptModule();
      const entry = lookupComponent("button");
      expect(entry.id).toBe("button");
      expect(entry.sourcePath).toContain("Button");
    });

    it("throws for unknown component", async () => {
      const { lookupComponent } = await loadPromptModule();
      expect(() => lookupComponent("nonexistent-xyz")).toThrow("Unknown component");
    });

    it("is case-insensitive", async () => {
      const { lookupComponent } = await loadPromptModule();
      const entry = lookupComponent("Button");
      expect(entry.id).toBe("button");
    });
  });

  describe("buildCreativityLadderPrompt", () => {
    it("includes all energy levels for count=4", async () => {
      const { lookupComponent, buildCreativityLadderPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildCreativityLadderPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        schemaPath: entry.schemaPath,
        count: 4,
      });

      expect(prompt).toContain("Variant 1: Safe Iteration");
      expect(prompt).toContain("Variant 2: Confident Improvement");
      expect(prompt).toContain("Variant 3: Bold Departure");
      expect(prompt).toContain("Variant 4: Wild Card");
    });

    it("generates Beyond levels for count > 4", async () => {
      const { lookupComponent, buildCreativityLadderPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildCreativityLadderPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        count: 6,
      });

      expect(prompt).toContain("Variant 5: Beyond (Level 5)");
      expect(prompt).toContain("Variant 6: Beyond (Level 6)");
    });

    it("includes RDNA rules", async () => {
      const { lookupComponent, buildCreativityLadderPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildCreativityLadderPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        count: 1,
      });

      expect(prompt).toContain("RDNA Rules");
      expect(prompt).toContain("semantic tokens");
      expect(prompt).toContain("Prop shape preservation");
    });

    it("includes source code", async () => {
      const { lookupComponent, buildCreativityLadderPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildCreativityLadderPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        count: 1,
      });

      expect(prompt).toContain("```tsx");
      expect(prompt).toContain("use client");
    });

    it("includes design doc reference", async () => {
      const { lookupComponent, buildCreativityLadderPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildCreativityLadderPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        count: 1,
      });

      expect(prompt).toContain("Design System Reference");
    });
  });

  describe("buildFixPrompt", () => {
    it("includes annotation details", async () => {
      const { lookupComponent, buildFixPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildFixPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        annotation: {
          intent: "fix",
          severity: "blocking",
          message: "Border radius should use radius-sm token",
        },
      });

      expect(prompt).toContain("**Intent:** fix");
      expect(prompt).toContain("**Severity:** blocking");
      expect(prompt).toContain("Border radius should use radius-sm token");
    });

    it("asks for exactly one code block", async () => {
      const { lookupComponent, buildFixPrompt } = await loadPromptModule();
      const entry = lookupComponent("button");
      const prompt = buildFixPrompt({
        componentId: entry.id,
        sourcePath: entry.sourcePath,
        annotation: {
          intent: "change",
          severity: "suggestion",
          message: "Try warmer hover",
        },
      });

      expect(prompt).toContain("exactly ONE fenced TSX code block");
    });
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/playground && pnpm test -- --run`
Expected: All pass (prompt builder tests should find the manifest and source files)

**Step 3: Commit**

```bash
git add tools/playground/app/playground/__tests__/prompt-builders.test.ts
git commit -m "test(playground): add prompt builder tests for creativity ladder and fix"
```

---

## Task 3: Create `create-variants` Command

**Files:**
- Create: `tools/playground/bin/commands/create-variants.mjs`

**Step 1: Write the command**

```js
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { post } from "../lib/api.mjs";
import { lookupComponent, buildCreativityLadderPrompt } from "../lib/prompt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONO_ROOT = resolve(__dirname, "../../../..");

function extractCodeBlocks(stdout) {
  const blocks = [];
  const fenceRegex = /```tsx?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(stdout)) !== null) {
    const code = match[1].trim();
    if (code.length > 50) blocks.push(code);
  }
  if (blocks.length === 0) {
    const trimmed = stdout.trim();
    if (trimmed.includes("'use client'") || trimmed.includes('"use client"')) {
      blocks.push(trimmed);
    }
  }
  return blocks;
}

export async function run(args) {
  const componentId = args[0];
  const count = Number.parseInt(args[1] ?? "4", 10);

  if (!componentId) {
    console.log(`
Usage: rdna-playground create-variants <component> [count]

Generates design variants with escalating creativity:
  1 — Safe Iteration (polish, refine)
  2 — Confident Improvement (meaningful enhancement)
  3 — Bold Departure (break conventions)
  4 — Wild Card (swing for the fences)
  5+ — Beyond (increasingly experimental)

Default count: 4
`);
    return;
  }

  const entry = lookupComponent(componentId);

  console.log(`Creating ${count} variant(s) for ${entry.label}...`);
  console.log(`Energy levels: ${Array.from({ length: count }, (_, i) => {
    const names = ["Safe", "Improvement", "Bold", "Wild"];
    return i < names.length ? names[i] : `Beyond(${i + 1})`;
  }).join(" → ")}`);

  // Signal work start
  try {
    await post("/agent/signal", { action: "work-start", componentId: entry.id });
  } catch {
    // Playground might not be running — continue anyway
  }

  try {
    const prompt = buildCreativityLadderPrompt({
      componentId: entry.id,
      sourcePath: entry.sourcePath,
      schemaPath: entry.schemaPath,
      count,
    });

    console.log(`\nSpawning claude --print (this may take a moment)...`);

    const result = await new Promise((resolvePromise) => {
      const child = spawn("claude", ["--print"], {
        cwd: MONO_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      });

      child.stdin.write(prompt);
      child.stdin.end();

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        process.stdout.write(".");
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        console.log(""); // newline after dots
        resolvePromise({ exitCode: code ?? 1, stdout, stderr });
      });
    });

    if (result.exitCode !== 0) {
      throw new Error(`Claude exited with code ${result.exitCode}${result.stderr ? `: ${result.stderr.slice(0, 200)}` : ""}`);
    }

    const codeBlocks = extractCodeBlocks(result.stdout);

    if (codeBlocks.length === 0) {
      throw new Error("Claude responded but output contained no extractable TSX code blocks");
    }

    console.log(`Extracted ${codeBlocks.length} variant(s), writing...`);

    const writtenFiles = [];
    for (let i = 0; i < codeBlocks.length; i++) {
      const names = ["Safe", "Improvement", "Bold", "Wild"];
      const levelName = i < names.length ? names[i] : `Beyond(${i + 1})`;

      try {
        const writeResult = await post("/generate/write", {
          componentId: entry.id,
          contents: codeBlocks[i],
        });
        writtenFiles.push(writeResult.fileName);
        console.log(`  ✓ Variant ${i + 1} (${levelName}): ${writeResult.fileName}`);
      } catch (error) {
        console.error(`  ✗ Variant ${i + 1} (${levelName}): RDNA lint failed — ${error.message}`);
      }
    }

    console.log(`\n${writtenFiles.length}/${codeBlocks.length} variant(s) written successfully.`);
  } finally {
    // Signal work end
    try {
      await post("/agent/signal", { action: "work-end", componentId: entry.id });
    } catch {
      // Playground might not be running
    }
  }
}
```

**Step 2: Commit**

```bash
git add tools/playground/bin/commands/create-variants.mjs
git commit -m "feat(playground): add create-variants command with creativity ladder"
```

---

## Task 4: Create `fix` Command

**Files:**
- Create: `tools/playground/bin/commands/agent-fix.mjs`

**Step 1: Write the command**

```js
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { get, post } from "../lib/api.mjs";
import { lookupComponent, buildFixPrompt } from "../lib/prompt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONO_ROOT = resolve(__dirname, "../../../..");

function extractCodeBlocks(stdout) {
  const blocks = [];
  const fenceRegex = /```tsx?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(stdout)) !== null) {
    const code = match[1].trim();
    if (code.length > 50) blocks.push(code);
  }
  if (blocks.length === 0) {
    const trimmed = stdout.trim();
    if (trimmed.includes("'use client'") || trimmed.includes('"use client"')) {
      blocks.push(trimmed);
    }
  }
  return blocks;
}

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

export async function run(args) {
  const componentId = args[0];
  const annotationId = extractFlag(args, "--annotation");

  if (!componentId || !annotationId) {
    console.log(`
Usage: rdna-playground fix <component> --annotation <id>

Spawns Claude to fix a specific annotation. On success:
  1. Writes fix as a lint-gated iteration
  2. Auto-adopts into source
  3. Resolves the annotation

The fix agent gets full context: source, schema, DESIGN.md, RDNA rules,
and the annotation's message/intent/severity.
`);
    return;
  }

  const entry = lookupComponent(componentId);

  // Fetch the annotation
  const annotationData = await get(`/agent/annotation?componentId=${entry.id}`);
  const annotation = annotationData.annotations?.find((a) => a.id === annotationId);

  if (!annotation) {
    throw new Error(`Annotation ${annotationId} not found for component ${entry.id}`);
  }

  if (annotation.status !== "pending" && annotation.status !== "acknowledged") {
    throw new Error(`Annotation ${annotationId} is already ${annotation.status}`);
  }

  console.log(`Fixing: "${annotation.message}"`);
  console.log(`  Intent: ${annotation.intent} | Severity: ${annotation.severity}`);
  console.log(`  Component: ${entry.label} (${entry.sourcePath})\n`);

  // Signal work start
  try {
    await post("/agent/signal", { action: "work-start", componentId: entry.id });
  } catch {
    // Playground might not be running
  }

  try {
    const prompt = buildFixPrompt({
      componentId: entry.id,
      sourcePath: entry.sourcePath,
      schemaPath: entry.schemaPath,
      annotation: {
        intent: annotation.intent,
        severity: annotation.severity,
        message: annotation.message,
      },
    });

    console.log("Spawning claude --print...");

    const result = await new Promise((resolvePromise) => {
      const child = spawn("claude", ["--print"], {
        cwd: MONO_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      });

      child.stdin.write(prompt);
      child.stdin.end();

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        process.stdout.write(".");
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        console.log("");
        resolvePromise({ exitCode: code ?? 1, stdout, stderr });
      });
    });

    if (result.exitCode !== 0) {
      throw new Error(`Claude exited with code ${result.exitCode}${result.stderr ? `: ${result.stderr.slice(0, 200)}` : ""}`);
    }

    const codeBlocks = extractCodeBlocks(result.stdout);

    if (codeBlocks.length === 0) {
      throw new Error("Claude responded but output contained no extractable TSX code blocks");
    }

    if (codeBlocks.length > 1) {
      console.warn(`Warning: Claude returned ${codeBlocks.length} code blocks, using the first one`);
    }

    // Step 1: Write as lint-gated iteration
    console.log("Writing fix as iteration (RDNA lint gate)...");
    const writeResult = await post("/generate/write", {
      componentId: entry.id,
      contents: codeBlocks[0],
    });
    console.log(`  Written: ${writeResult.fileName}`);

    // Step 2: Auto-adopt into source
    console.log("Adopting into source...");
    try {
      const adoptResult = await post("/adopt", {
        componentId: entry.id,
        iterationFile: writeResult.fileName,
      });
      console.log(`  Adopted: ${adoptResult.targetPath}`);
    } catch (adoptError) {
      console.error(`  Adopt failed: ${adoptError.message}`);
      console.log("  The iteration file is still available for manual review.");
      throw new Error("Adopt failed — fix iteration preserved for manual review");
    }

    // Step 3: Resolve the annotation
    console.log("Resolving annotation...");
    await post("/agent/annotation", {
      action: "resolve",
      id: annotationId,
      summary: `Fixed by agent: ${annotation.message.slice(0, 80)}`,
    });

    console.log(`\nDone. Annotation resolved, source updated.`);
  } finally {
    try {
      await post("/agent/signal", { action: "work-end", componentId: entry.id });
    } catch {
      // Playground might not be running
    }
  }
}
```

**Step 2: Commit**

```bash
git add tools/playground/bin/commands/agent-fix.mjs
git commit -m "feat(playground): add fix command to resolve annotations via agent"
```

---

## Task 5: Wire Commands into CLI + Remove Old Generate

**Files:**
- Modify: `tools/playground/bin/rdna-playground.mjs`
- Modify: `tools/playground/bin/commands/variations.mjs`

**Step 1: Remove `generate` from `variations.mjs`**

In `variations.mjs`, remove the `generate` entry from `SUBCOMMANDS` and delete the `generate` function (lines 51-61). Update the help text:

Replace the `SUBCOMMANDS` object:

```js
const SUBCOMMANDS = {
  list,
  write,
  adopt,
  trash,
};
```

And update the usage text inside `run()`:

```js
    console.log(`
Usage: rdna-playground variations <subcommand>

Subcommands:
  list [component]
  write <component> <file>
  trash <component> <iteration-file>
  adopt <component> <iteration-file>

To generate new variants, use: rdna-playground create-variants <component>
`);
```

Delete the entire `generate` function (lines 51-61).

**Step 2: Add new commands to `rdna-playground.mjs`**

Add to the `COMMANDS` object:

```js
  "create-variants": () => import("./commands/create-variants.mjs").then((m) => m.run(args)),
  fix: () => import("./commands/agent-fix.mjs").then((m) => m.run(args)),
```

Update `printHelp()`:

```js
function printHelp() {
  console.log(`
rdna-playground

Usage:
  rdna-playground work-start <component>
  rdna-playground work-end [component]
  rdna-playground status
  rdna-playground variations <subcommand>
  rdna-playground create-variants <component> [count]
  rdna-playground fix <component> --annotation <id>
  rdna-playground annotate <component> <message> [--intent fix|change|question|approve] [--severity blocking|important|suggestion]
  rdna-playground annotations [component] [--status pending]
  rdna-playground resolve <annotation-id> [summary]
  rdna-playground dismiss <annotation-id> <reason>
`);
}
```

**Step 3: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/playground && pnpm test -- --run`
Expected: All pass (no test relied on `variations generate` existing)

**Step 4: Commit**

```bash
git add tools/playground/bin/rdna-playground.mjs tools/playground/bin/commands/variations.mjs
git commit -m "feat(playground): wire create-variants + fix into CLI, remove variations generate"
```

---

## Task 6: Update README

**Files:**
- Modify: `tools/playground/README.md`

**Step 1: Update the Variation lifecycle section**

Replace the current "Variation lifecycle" section (lines 169-179) with:

```markdown
### Variation lifecycle

```bash
node bin/rdna-playground.mjs create-variants <component> [count]            # Generate via Claude with creativity ladder
node bin/rdna-playground.mjs variations list [component]                    # List iterations
node bin/rdna-playground.mjs variations write <component> <file>            # Write a local file as iteration
node bin/rdna-playground.mjs variations trash <component> <iteration-file>  # Delete an iteration
node bin/rdna-playground.mjs variations adopt <component> <iteration-file>  # Adopt into source
```

`create-variants` uses a **creativity ladder** — each variant gets a different energy level:

| Variant | Level | Description |
|---------|-------|-------------|
| 1 | Safe | Polish, refine, stay close to source |
| 2 | Improvement | Meaningful enhancement, same visual language |
| 3 | Bold | Break conventions, surprise the viewer |
| 4 | Wild | Reimagine completely, swing for the fences |
| 5+ | Beyond | Escalating experimentation, outside-UI inspiration |

Default count: 4. All variants are RDNA-lint-gated before writing.
```

**Step 2: Add a "Fix" section after Annotations**

Add after the Annotations section (after line 188):

```markdown
### Agent fix

```bash
node bin/rdna-playground.mjs fix <component> --annotation <id>
```

Spawns Claude to address a specific annotation. On success: writes a lint-gated iteration, auto-adopts into source, and resolves the annotation. The agent gets full context: source, schema, DESIGN.md, RDNA rules, and the annotation's details.
```

**Step 3: Update the file structure**

Add `create-variants.mjs` and `agent-fix.mjs` to the file structure diagram in the `bin/commands/` section:

```
bin/
├── rdna-playground.mjs          # CLI entry point
├── lib/
│   ├── api.mjs                  # Shared HTTP client (get/post/del)
│   └── prompt.mjs               # Prompt builders (creativity ladder, fix)
└── commands/
    ├── work-signal.mjs          # work-start, work-end
    ├── status.mjs               # status
    ├── variations.mjs           # list, write, trash, adopt
    ├── create-variants.mjs      # Creativity ladder variant generation
    ├── agent-fix.mjs            # Fix command (annotation → agent → adopt)
    └── annotate.mjs             # annotate, annotations, resolve, dismiss
```

**Step 4: Commit**

```bash
git add tools/playground/README.md
git commit -m "docs(playground): update README for create-variants and fix commands"
```

---

## Verification Checklist

- [ ] `pnpm --filter @rdna/playground test` — all tests pass
- [ ] `node bin/rdna-playground.mjs create-variants` — prints usage with creativity ladder
- [ ] `node bin/rdna-playground.mjs fix` — prints usage
- [ ] `node bin/rdna-playground.mjs variations` — no longer shows `generate` subcommand, mentions `create-variants`
- [ ] `node bin/rdna-playground.mjs help` — shows new commands
- [ ] Smoke: `node bin/rdna-playground.mjs create-variants button 2` — generates 2 variants (Safe + Improvement), writes lint-gated iterations
- [ ] Smoke: Create an annotation, then `node bin/rdna-playground.mjs fix button --annotation <id>` — fixes, adopts, resolves
