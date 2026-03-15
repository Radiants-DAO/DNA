import { readFileSync } from "fs";
import { resolve } from "path";

const MONO_ROOT = resolve(process.cwd(), "../..");

function tryRead(path: string): string {
  try {
    return readFileSync(resolve(MONO_ROOT, path), "utf-8");
  } catch {
    return `[file not found: ${path}]`;
  }
}

interface IterationPromptOptions {
  componentId: string;
  sourcePath: string;
  schemaPath?: string;
  propsInterface?: string;
  variationCount: number;
  customInstructions?: string;
}

export function buildIterationPrompt(opts: IterationPromptOptions): string {
  const source = tryRead(opts.sourcePath);
  const schema = opts.schemaPath ? tryRead(opts.schemaPath) : null;
  const designDoc = tryRead("packages/radiants/DESIGN.md");

  return `You are generating design variations for a DNA/RDNA component.

## Design System Reference

${designDoc}

## Source Component (${opts.componentId})

File: ${opts.sourcePath}

\`\`\`tsx
${source}
\`\`\`

${schema ? `## Schema\n\n\`\`\`json\n${schema}\n\`\`\`\n` : ""}
${opts.propsInterface ? `## Props Interface\n\n\`\`\`ts\n${opts.propsInterface}\n\`\`\`\n` : ""}

## RDNA Rules (MUST follow — violations will be rejected)

### Token usage
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
19. DO NOT change the component's purpose or fundamental interaction pattern

## Task

Generate ${opts.variationCount} design variation(s) of the ${opts.componentId} component.

Each variation:
- Must be a complete, self-contained .tsx file with 'use client' directive
- Must export a named function matching the component name with the same prop interface
- Must use only RDNA semantic tokens (Tailwind classes, not CSS variables directly)
- Must use class-variance-authority (cva) for variant styling if the source does
- Should explore meaningfully different visual treatments while staying within the design system

${opts.customInstructions ? `## Additional Instructions\n\n${opts.customInstructions}\n` : ""}

## Output Format

Output each variation as a separate fenced TSX code block. Do not include filenames, explanations, or any text outside the code blocks. Each code block should contain exactly one complete component file.
`;
}
