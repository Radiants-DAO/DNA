import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import {
  resolveWithinRoot,
  isWithinRoot,
  validateAndRelativize,
  PathTraversalError,
} from "../path-security.js";

describe("resolveWithinRoot", () => {
  const root = "/project/root";

  it("resolves relative paths within root", () => {
    expect(resolveWithinRoot(root, "src/file.ts")).toBe(
      resolve(root, "src/file.ts")
    );
    expect(resolveWithinRoot(root, "file.js")).toBe(resolve(root, "file.js"));
  });

  it("allows absolute paths within root", () => {
    const absPath = resolve(root, "src/deep/file.ts");
    expect(resolveWithinRoot(root, absPath)).toBe(absPath);
  });

  it("rejects ../ path traversal attempts", () => {
    expect(() => resolveWithinRoot(root, "../outside.txt")).toThrow(
      PathTraversalError
    );
    expect(() => resolveWithinRoot(root, "src/../../outside.txt")).toThrow(
      PathTraversalError
    );
    expect(() => resolveWithinRoot(root, "src/../../../etc/passwd")).toThrow(
      PathTraversalError
    );
  });

  it("rejects absolute paths outside root", () => {
    expect(() => resolveWithinRoot(root, "/etc/passwd")).toThrow(
      PathTraversalError
    );
    expect(() => resolveWithinRoot(root, "/project/other")).toThrow(
      PathTraversalError
    );
  });

  it("allows paths that contain .. but stay within root", () => {
    // src/../lib/file.ts resolves to lib/file.ts, still within root
    expect(resolveWithinRoot(root, "src/../lib/file.ts")).toBe(
      resolve(root, "lib/file.ts")
    );
  });

  it("handles paths with current directory references", () => {
    expect(resolveWithinRoot(root, "./src/file.ts")).toBe(
      resolve(root, "src/file.ts")
    );
    expect(resolveWithinRoot(root, "src/./nested/./file.ts")).toBe(
      resolve(root, "src/nested/file.ts")
    );
  });

  it("provides meaningful error messages", () => {
    try {
      resolveWithinRoot(root, "../escape.txt");
    } catch (e) {
      expect(e).toBeInstanceOf(PathTraversalError);
      expect((e as PathTraversalError).requestedPath).toBe("../escape.txt");
      expect((e as PathTraversalError).root).toBe(root);
    }
  });
});

describe("isWithinRoot", () => {
  const root = "/project/root";

  it("returns true for paths within root", () => {
    expect(isWithinRoot(root, resolve(root, "src/file.ts"))).toBe(true);
    expect(isWithinRoot(root, root)).toBe(true);
  });

  it("returns false for paths outside root", () => {
    expect(isWithinRoot(root, "/etc/passwd")).toBe(false);
    expect(isWithinRoot(root, "/project")).toBe(false);
    expect(isWithinRoot(root, "/project/root-other")).toBe(false);
  });

  it("handles roots that share common prefixes", () => {
    // Ensure /project/root-other is not considered within /project/root
    expect(isWithinRoot("/project/root", "/project/root-other")).toBe(false);
    expect(isWithinRoot("/project/root", "/project/root-other/file.ts")).toBe(
      false
    );
  });
});

describe("validateAndRelativize", () => {
  const root = "/project/root";

  it("returns relative path for valid inputs", () => {
    expect(validateAndRelativize(root, "src/file.ts")).toBe("src/file.ts");
    expect(validateAndRelativize(root, resolve(root, "lib/util.js"))).toBe(
      "lib/util.js"
    );
  });

  it("throws for invalid paths", () => {
    expect(() => validateAndRelativize(root, "../outside.txt")).toThrow(
      PathTraversalError
    );
  });
});
