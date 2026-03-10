import { describe, it, expect } from "vitest";
import {
  parseIterationName,
  sortIterationFiles,
  filterByComponent,
  validateAdoptionFile,
} from "../iteration-naming";

// ---------------------------------------------------------------------------
// parseIterationName
// ---------------------------------------------------------------------------

describe("parseIterationName", () => {
  it("parses a valid iteration filename", () => {
    expect(parseIterationName("button.iteration-1.tsx")).toEqual({
      componentId: "button",
      n: 1,
    });
  });

  it("parses multi-digit iteration numbers", () => {
    expect(parseIterationName("card.iteration-42.tsx")).toEqual({
      componentId: "card",
      n: 42,
    });
  });

  it("lowercases the componentId", () => {
    expect(parseIterationName("Button.iteration-3.tsx")).toEqual({
      componentId: "button",
      n: 3,
    });
  });

  it("rejects files without .iteration- pattern", () => {
    expect(parseIterationName("button.tsx")).toBeNull();
    expect(parseIterationName("index.ts")).toBeNull();
    expect(parseIterationName(".gitkeep")).toBeNull();
  });

  it("rejects files with wrong extension", () => {
    expect(parseIterationName("button.iteration-1.ts")).toBeNull();
    expect(parseIterationName("button.iteration-1.jsx")).toBeNull();
  });

  it("rejects files with invalid componentId characters", () => {
    expect(parseIterationName("-button.iteration-1.tsx")).toBeNull();
    expect(parseIterationName("123.iteration-1.tsx")).toBeNull();
  });

  it("rejects files with non-numeric iteration number", () => {
    expect(parseIterationName("button.iteration-abc.tsx")).toBeNull();
  });

  it("rejects path-like strings", () => {
    expect(parseIterationName("../button.iteration-1.tsx")).toBeNull();
    expect(parseIterationName("foo/button.iteration-1.tsx")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sortIterationFiles
// ---------------------------------------------------------------------------

describe("sortIterationFiles", () => {
  it("sorts by component then iteration number", () => {
    const input = [
      "card.iteration-2.tsx",
      "button.iteration-3.tsx",
      "button.iteration-1.tsx",
      "card.iteration-1.tsx",
      "button.iteration-2.tsx",
    ];
    expect(sortIterationFiles(input)).toEqual([
      "button.iteration-1.tsx",
      "button.iteration-2.tsx",
      "button.iteration-3.tsx",
      "card.iteration-1.tsx",
      "card.iteration-2.tsx",
    ]);
  });

  it("filters out non-iteration files", () => {
    const input = [
      "button.iteration-1.tsx",
      "index.ts",
      ".gitkeep",
      "tree.json",
      "card.iteration-1.tsx",
    ];
    expect(sortIterationFiles(input)).toEqual([
      "button.iteration-1.tsx",
      "card.iteration-1.tsx",
    ]);
  });

  it("returns empty for empty input", () => {
    expect(sortIterationFiles([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// filterByComponent
// ---------------------------------------------------------------------------

describe("filterByComponent", () => {
  const files = [
    "button.iteration-1.tsx",
    "button.iteration-2.tsx",
    "card.iteration-1.tsx",
    "input.iteration-1.tsx",
  ];

  it("returns only files for the requested component", () => {
    expect(filterByComponent(files, "button")).toEqual([
      "button.iteration-1.tsx",
      "button.iteration-2.tsx",
    ]);
  });

  it("is case-insensitive on componentId", () => {
    expect(filterByComponent(files, "Button")).toEqual([
      "button.iteration-1.tsx",
      "button.iteration-2.tsx",
    ]);
  });

  it("returns empty when no matches", () => {
    expect(filterByComponent(files, "dialog")).toEqual([]);
  });

  it("does not prefix-match: 'but' should not match 'button'", () => {
    expect(filterByComponent(files, "but")).toEqual([]);
  });

  it("does not prefix-match: 'buttongroup' should not match 'button'", () => {
    expect(
      filterByComponent(
        [...files, "buttongroup.iteration-1.tsx"],
        "button",
      ),
    ).toEqual(["button.iteration-1.tsx", "button.iteration-2.tsx"]);
  });
});

// ---------------------------------------------------------------------------
// validateAdoptionFile
// ---------------------------------------------------------------------------

describe("validateAdoptionFile", () => {
  it("accepts valid file matching target component", () => {
    const result = validateAdoptionFile("button.iteration-1.tsx", "button");
    expect(result).toEqual({
      valid: true,
      componentId: "button",
      iterationNumber: 1,
    });
  });

  it("is case-insensitive on componentId comparison", () => {
    const result = validateAdoptionFile("Button.iteration-2.tsx", "button");
    expect(result).toEqual({
      valid: true,
      componentId: "button",
      iterationNumber: 2,
    });
  });

  it("rejects path traversal with forward slash", () => {
    const result = validateAdoptionFile("../button.iteration-1.tsx", "button");
    expect(result).toEqual({
      valid: false,
      error: "iterationFile must be a bare filename, not a path",
    });
  });

  it("rejects path traversal with backslash", () => {
    const result = validateAdoptionFile("..\\button.iteration-1.tsx", "button");
    expect(result).toEqual({
      valid: false,
      error: "iterationFile must be a bare filename, not a path",
    });
  });

  it("rejects invalid filename pattern", () => {
    const result = validateAdoptionFile("random-file.tsx", "button");
    expect(result.valid).toBe(false);
    expect((result as { error: string }).error).toContain("expected pattern");
  });

  it("rejects cross-component adoption: button iteration → card target", () => {
    const result = validateAdoptionFile("button.iteration-1.tsx", "card");
    expect(result).toEqual({
      valid: false,
      error: 'Component mismatch: iteration file belongs to "button" but adoption target is "card"',
    });
  });

  it("rejects cross-component adoption: card iteration → input target", () => {
    const result = validateAdoptionFile("card.iteration-3.tsx", "input");
    expect(result.valid).toBe(false);
    expect((result as { error: string }).error).toContain("Component mismatch");
  });
});
