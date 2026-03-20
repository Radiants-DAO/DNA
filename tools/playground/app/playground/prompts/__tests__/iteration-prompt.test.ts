import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs to avoid reading real files during tests
vi.mock("fs", () => ({
  readFileSync: vi.fn((path: string) => {
    if (path.includes("Button.tsx")) return "export function Button() {}";
    if (path.includes("Button.schema.json"))
      return JSON.stringify({ name: "Button", props: {} });
    if (path.includes("DESIGN.md")) return "# RDNA Design System\n\nMock content";
    throw new Error(`ENOENT: ${path}`);
  }),
}));

import { buildIterationPrompt } from "../iteration.prompt";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildIterationPrompt", () => {
  const BASE_OPTS = {
    componentId: "button",
    sourcePath: "packages/radiants/components/core/Button/Button.tsx",
    variationCount: 2,
  };

  it("includes the component ID in the prompt", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).toContain("## Source Component (button)");
  });

  it("includes the source file path", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).toContain(
      "File: packages/radiants/components/core/Button/Button.tsx",
    );
  });

  it("includes the source file content in a code block", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).toContain("```tsx\nexport function Button() {}\n```");
  });

  it("includes the design system reference", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).toContain("## Design System Reference");
    expect(prompt).toContain("# RDNA Design System");
  });

  it("includes the variation count in the task section", () => {
    const prompt = buildIterationPrompt({ ...BASE_OPTS, variationCount: 3 });
    expect(prompt).toContain("Generate 3 design variation(s)");
  });

  it("includes RDNA rules", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).toContain("## RDNA Rules");
    expect(prompt).toContain("NEVER hardcode colors");
    expect(prompt).toContain("Prop shape preservation");
  });

  it("includes schema when schemaPath is provided", () => {
    const prompt = buildIterationPrompt({
      ...BASE_OPTS,
      schemaPath:
        "packages/radiants/components/core/Button/Button.schema.json",
    });
    expect(prompt).toContain("## Schema");
    expect(prompt).toContain('"name":"Button"');
  });

  it("omits schema section when schemaPath is not provided", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).not.toContain("## Schema");
  });

  it("includes custom instructions when provided", () => {
    const prompt = buildIterationPrompt({
      ...BASE_OPTS,
      customInstructions: "Use a brutalist aesthetic",
    });
    expect(prompt).toContain("## Additional Instructions");
    expect(prompt).toContain("Use a brutalist aesthetic");
  });

  it("omits custom instructions section when not provided", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).not.toContain("## Additional Instructions");
  });

  it("handles missing source files gracefully", () => {
    const prompt = buildIterationPrompt({
      ...BASE_OPTS,
      sourcePath: "nonexistent/file.tsx",
    });
    expect(prompt).toContain("[file not found: nonexistent/file.tsx]");
  });

  it("includes output format instructions", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    expect(prompt).toContain("## Output Format");
    expect(prompt).toContain("separate fenced TSX code block");
  });

  it("includes all 19 RDNA rules", () => {
    const prompt = buildIterationPrompt(BASE_OPTS);
    // Check key rules from each section
    expect(prompt).toContain("semantic tokens");
    expect(prompt).toContain("rounded-sm");
    expect(prompt).toContain("shadow-resting");
    expect(prompt).toContain("ease-out only, max 300ms");
    expect(prompt).toContain("drop-in replacement");
    expect(prompt).toContain("class-variance-authority");
  });
});
