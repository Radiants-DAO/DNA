import { describe, it, expect } from "vitest";
import { extractCodeBlocks } from "../../lib/code-blocks";
import { validateAdoptionFile } from "../../lib/iteration-naming";

/**
 * Route contract tests — verify the shared logic used by the
 * generate and adopt API routes. Tests import the real implementations
 * so drift between tests and routes is caught.
 */

// ---------- Code block extraction (used by generate/route.ts) ----------

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

// ---------- Adoption validation (used by adopt/route.ts) ----------

describe("validateAdoptionFile", () => {
  it("accepts valid iteration file for matching component", () => {
    const result = validateAdoptionFile("button.iteration-1.tsx", "button");
    expect(result.valid).toBe(true);
  });

  it("accepts case-insensitive component matching", () => {
    const result = validateAdoptionFile("Button.iteration-1.tsx", "button");
    expect(result.valid).toBe(true);
  });

  it("rejects path traversal with forward slash", () => {
    const result = validateAdoptionFile("../button.iteration-1.tsx", "button");
    expect(result.valid).toBe(false);
    expect((result as { error: string }).error).toContain("bare filename");
  });

  it("rejects path traversal with backslash", () => {
    const result = validateAdoptionFile("..\\button.iteration-1.tsx", "button");
    expect(result.valid).toBe(false);
  });

  it("rejects non-iteration filenames", () => {
    const result = validateAdoptionFile("button.tsx", "button");
    expect(result.valid).toBe(false);
  });

  it("rejects cross-component adoption", () => {
    const result = validateAdoptionFile("card.iteration-1.tsx", "button");
    expect(result.valid).toBe(false);
    expect((result as { error: string }).error).toContain("mismatch");
  });
});
