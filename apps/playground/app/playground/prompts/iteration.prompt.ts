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

## RDNA Rules (MUST follow)

1. Use only semantic tokens: \`surface-*\`, \`content-*\`, \`edge-*\`, \`action-*\`, \`status-*\`
2. Never hardcode colors (no hex, rgb, oklch, or Tailwind color palette classes)
3. Never hardcode spacing with arbitrary values — use Tailwind scale classes
4. Never use raw HTML elements when RDNA wrappers exist (Button, Input, Select, Dialog)
5. Preserve the exact prop interface — variations must be drop-in replaceable
6. Use \`rounded-sm\` or \`rounded-md\` (RDNA radius tokens), not arbitrary radius
7. Motion: ease-out only, max 300ms, CSS-first
8. Icons: Lucide base (24x24 grid, 2px stroke)

## Task

Generate ${opts.variationCount} design variation(s) of the ${opts.componentId} component.

Each variation:
- Must be a complete, self-contained .tsx file with 'use client' directive
- Must export a named function matching the component name with the same prop interface
- Must use only RDNA semantic tokens
- Must use class-variance-authority (cva) for variant styling
- Should explore different visual treatments while staying within the design system

${opts.customInstructions ? `## Additional Instructions\n\n${opts.customInstructions}\n` : ""}

## Output Format

Output each variation as a separate fenced TSX code block. Do not include filenames, explanations, or any text outside the code blocks. Each code block should contain exactly one complete component file.
`;
}
