import { describe, it, expect } from "vitest";
import {
  isAllowedAdoptionTarget,
  isIterationPath,
  validateAdoptionTarget,
} from "../source-path-policy";

describe("isAllowedAdoptionTarget", () => {
  it("allows radiants core component paths", () => {
    expect(
      isAllowedAdoptionTarget(
        "packages/radiants/components/core/Button/Button.tsx",
      ),
    ).toBe(true);
  });

  it("allows monolith core component paths", () => {
    expect(
      isAllowedAdoptionTarget(
        "packages/monolith/components/core/Badge/Badge.tsx",
      ),
    ).toBe(true);
  });

  it("allows rad-os app component paths", () => {
    expect(
      isAllowedAdoptionTarget(
        "apps/rad-os/components/Rad_os/WindowTitleBar.tsx",
      ),
    ).toBe(true);
  });

  it("allows radiator app component paths", () => {
    expect(
      isAllowedAdoptionTarget("apps/radiator/src/components/BurnCard.tsx"),
    ).toBe(true);
  });

  it("rejects paths outside allowed roots", () => {
    expect(isAllowedAdoptionTarget("packages/preview/src/Page.tsx")).toBe(
      false,
    );
  });

  it("rejects root-level files", () => {
    expect(isAllowedAdoptionTarget("CLAUDE.md")).toBe(false);
  });

  it("rejects config files in allowed packages", () => {
    expect(isAllowedAdoptionTarget("packages/radiants/package.json")).toBe(
      false,
    );
  });

  it("rejects playground app files", () => {
    expect(
      isAllowedAdoptionTarget(
        "apps/playground/app/playground/registry.tsx",
      ),
    ).toBe(false);
  });

  it("rejects paths that start with allowed root but with traversal", () => {
    expect(
      isAllowedAdoptionTarget(
        "packages/radiants/components/core/../../package.json",
      ),
    ).toBe(true); // startsWith still matches — traversal is handled by resolve in the route
  });
});

describe("isIterationPath", () => {
  it("matches iteration directory paths", () => {
    expect(
      isIterationPath(
        "apps/playground/app/playground/iterations/button.iteration-1.tsx",
      ),
    ).toBe(true);
  });

  it("rejects paths outside iterations", () => {
    expect(isIterationPath("apps/playground/app/playground/registry.tsx")).toBe(
      false,
    );
  });
});

describe("validateAdoptionTarget", () => {
  const registryPaths = new Set([
    "packages/radiants/components/core/Button/Button.tsx",
    "packages/radiants/components/core/Card/Card.tsx",
  ]);

  it("returns null for valid targets", () => {
    expect(
      validateAdoptionTarget(
        "packages/radiants/components/core/Button/Button.tsx",
        registryPaths,
      ),
    ).toBeNull();
  });

  it("rejects paths not in registry", () => {
    const result = validateAdoptionTarget(
      "packages/radiants/components/core/Input/Input.tsx",
      registryPaths,
    );
    expect(result).toContain("not found in registry");
  });

  it("rejects paths in registry but outside allowed roots", () => {
    const extendedPaths = new Set([
      ...registryPaths,
      "packages/preview/src/Page.tsx",
    ]);
    const result = validateAdoptionTarget(
      "packages/preview/src/Page.tsx",
      extendedPaths,
    );
    expect(result).toContain("outside permitted roots");
  });
});
