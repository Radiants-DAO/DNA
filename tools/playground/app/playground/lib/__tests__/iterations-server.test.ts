import { mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { execSync } from "child_process";
import {
  groupIterationsByComponent,
  listAllIterations,
  writeVerifiedIteration,
} from "../iterations.server";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

describe("iterations.server", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("groups iteration files by component", () => {
    expect(
      groupIterationsByComponent([
        "button.iteration-1.tsx",
        "button.iteration-2.tsx",
        "card.iteration-1.tsx",
      ]),
    ).toEqual({
      button: ["button.iteration-1.tsx", "button.iteration-2.tsx"],
      card: ["card.iteration-1.tsx"],
    });
  });

  it("writes and verifies an iteration file", () => {
    const dir = mkdtempSync(join(tmpdir(), "playground-iterations-"));

    const result = writeVerifiedIteration({
      monoRoot: process.cwd(),
      iterationsDir: dir,
      componentId: "button",
      contents: "'use client'; export function Button(){ return <button>OK</button>; }",
    });

    expect(result.fileName).toBe("button.iteration-1.tsx");
    expect(readFileSync(join(dir, result.fileName), "utf-8")).toContain("export function Button");
    expect(execSync).toHaveBeenCalled();
  });
});
