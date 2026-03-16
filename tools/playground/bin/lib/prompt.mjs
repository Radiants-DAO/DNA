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
9. Icons: Use generated components from \`@rdna/radiants/icons\` (source: \`assets/icons/\` SVGs, 16x16 pixel-art grid) — NEVER custom SVGs or other icon libraries

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

function buildEnergyLevel(index) {
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
    const level = buildEnergyLevel(i);
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

export function extractCodeBlocks(stdout) {
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

export function buildFixPrompt({ componentId, sourcePath, schemaPath, annotation }) {
  const source = tryRead(sourcePath);
  const schema = schemaPath ? tryRead(schemaPath) : null;
  const designDoc = tryRead("packages/radiants/DESIGN.md");

  return `You are fixing a specific issue in a DNA/RDNA component.
A human reviewer left this annotation — address it precisely.

## Annotation

**Intent:** ${annotation.intent}
**Priority:** ${annotation.priority ?? "unset"}
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
