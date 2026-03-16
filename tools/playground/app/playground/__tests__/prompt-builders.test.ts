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
      annotation: { intent: string; priority: string | null; message: string };
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
          priority: "P1",
          message: "Border radius should use radius-sm token",
        },
      });

      expect(prompt).toContain("**Intent:** fix");
      expect(prompt).toContain("**Priority:** P1");
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
          priority: "P3",
          message: "Try warmer hover",
        },
      });

      expect(prompt).toContain("exactly ONE fenced TSX code block");
    });
  });
});
