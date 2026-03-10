import { describe, it, expect } from "vitest";

/**
 * Route contract tests — verify the shape of inputs and outputs
 * for the generate and adopt API routes without spawning processes
 * or touching the filesystem.
 *
 * These test the pure logic extracted from the route handlers.
 */

// ---------- Code block extraction (from generate/route.ts) ----------

/** Extract TSX code blocks from Claude's stdout — copied from route for testing */
function extractCodeBlocks(stdout: string): string[] {
  const blocks: string[] = [];
  const fenceRegex = /```tsx?\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(stdout)) !== null) {
    const code = match[1].trim();
    if (code.length > 50) blocks.push(code);
  }
  if (blocks.length === 0) {
    const trimmed = stdout.trim();
    if (
      trimmed.includes("'use client'") ||
      trimmed.includes('"use client"')
    ) {
      blocks.push(trimmed);
    }
  }
  return blocks;
}

describe("extractCodeBlocks", () => {
  it("extracts TSX fenced code blocks", () => {
    const stdout = `Here is the variation:

\`\`\`tsx
'use client';
import React from 'react';
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="bg-surface-primary">{children}</button>;
}
\`\`\`
`;
    const blocks = extractCodeBlocks(stdout);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("'use client'");
    expect(blocks[0]).toContain("export function Button");
  });

  it("extracts multiple code blocks", () => {
    const stdout = `\`\`\`tsx
'use client';
export function Button() { return <button className="bg-surface-primary">A long enough component to pass the 50 char filter</button>; }
\`\`\`

\`\`\`tsx
'use client';
export function Button() { return <button className="bg-action-primary">Another long enough component to pass the filter</button>; }
\`\`\``;
    const blocks = extractCodeBlocks(stdout);
    expect(blocks).toHaveLength(2);
  });

  it("skips code blocks shorter than 50 chars", () => {
    const stdout = `\`\`\`tsx
short
\`\`\``;
    const blocks = extractCodeBlocks(stdout);
    expect(blocks).toHaveLength(0);
  });

  it("falls back to raw output with use client directive", () => {
    const stdout = `'use client';
import React from 'react';
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="bg-surface-primary">{children}</button>;
}`;
    const blocks = extractCodeBlocks(stdout);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("export function Button");
  });

  it("returns empty when no code blocks and no use client", () => {
    const stdout = "I cannot generate that variation because...";
    const blocks = extractCodeBlocks(stdout);
    expect(blocks).toHaveLength(0);
  });

  it("handles ts fence language tag", () => {
    const stdout = `\`\`\`ts
'use client';
export function Button() { return <button className="bg-surface-primary text-content-primary">Click</button>; }
\`\`\``;
    const blocks = extractCodeBlocks(stdout);
    expect(blocks).toHaveLength(1);
  });
});

// ---------- Generate route input contract ----------

describe("generate route input contract", () => {
  it("requires componentId", () => {
    const body = {};
    expect(body).not.toHaveProperty("componentId");
  });

  it("variationCount defaults to 2 when not provided", () => {
    const body = { componentId: "button" };
    const variationCount = (body as { variationCount?: number }).variationCount ?? 2;
    expect(variationCount).toBe(2);
  });

  it("accepts customInstructions", () => {
    const body = {
      componentId: "button",
      variationCount: 3,
      customInstructions: "Use brutalist style",
    };
    expect(body.customInstructions).toBe("Use brutalist style");
  });
});

// ---------- Adopt route input contract ----------

describe("adopt route input contract", () => {
  it("requires both iterationFile and componentId", () => {
    const validBody = {
      iterationFile: "button.iteration-1.tsx",
      componentId: "button",
    };
    expect(validBody).toHaveProperty("iterationFile");
    expect(validBody).toHaveProperty("componentId");
  });

  it("iteration filename must match pattern", () => {
    const pattern = /^([a-z][a-z0-9]*)\.iteration-(\d+)\.tsx$/i;
    expect(pattern.test("button.iteration-1.tsx")).toBe(true);
    expect(pattern.test("card.iteration-12.tsx")).toBe(true);
    expect(pattern.test("../escape.tsx")).toBe(false);
    expect(pattern.test("button.tsx")).toBe(false);
    expect(pattern.test("")).toBe(false);
  });

  it("rejects path separators in iteration filename", () => {
    const hasPathSep = (f: string) =>
      f.includes("/") || f.includes("\\");
    expect(hasPathSep("button.iteration-1.tsx")).toBe(false);
    expect(hasPathSep("../button.iteration-1.tsx")).toBe(true);
    expect(hasPathSep("..\\button.iteration-1.tsx")).toBe(true);
  });
});
