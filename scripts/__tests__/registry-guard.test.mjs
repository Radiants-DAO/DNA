import test from "node:test";
import assert from "node:assert/strict";

import {
  getRegistryPlan,
  isRegistryRelevantPath,
  shouldRunRegistryGuard,
  shouldSkipPackageGuard,
} from "../registry-guard-lib.mjs";

test("isRegistryRelevantPath matches the registry surfaces we actually depend on", () => {
  assert.equal(
    isRegistryRelevantPath("packages/radiants/components/core/Button/Button.tsx"),
    true,
  );
  assert.equal(
    isRegistryRelevantPath("packages/radiants/registry/build-registry.ts"),
    true,
  );
  assert.equal(
    isRegistryRelevantPath("apps/rad-os/components/ui/DesignSystemTab.tsx"),
    true,
  );
  assert.equal(
    isRegistryRelevantPath("apps/rad-os/components/apps/AboutApp.tsx"),
    false,
  );
});

test("shouldRunRegistryGuard only trips when at least one changed path is registry-relevant", () => {
  assert.equal(
    shouldRunRegistryGuard([
      "README.md",
      "apps/rad-os/components/apps/AboutApp.tsx",
    ]),
    false,
  );

  assert.equal(
    shouldRunRegistryGuard([
      "README.md",
      "apps/rad-os/components/ui/DesignSystemTab.tsx",
    ]),
    true,
  );
});

test("pre-commit runs the fast registry checks only when relevant files are staged", () => {
  assert.deepEqual(
    getRegistryPlan("pre-commit", ["README.md"]),
    {
      run: false,
      command: null,
      reason: "no_registry_changes",
    },
  );

  assert.deepEqual(
    getRegistryPlan("pre-commit", [
      "packages/radiants/components/core/Button/Button.meta.ts",
    ]),
    {
      run: true,
      command: ["pnpm", "registry:generate"],
      reason: "staged_registry_changes",
    },
  );
});

test("dev, build, push, and ci each map to the intended registry plan", () => {
  assert.deepEqual(getRegistryPlan("pre-dev"), {
    run: true,
    command: ["pnpm", "registry:generate"],
    reason: "dev_start",
  });

  assert.deepEqual(getRegistryPlan("pre-build"), {
    run: true,
    command: ["pnpm", "registry:generate"],
    reason: "build_start",
  });

  assert.deepEqual(getRegistryPlan("pre-push"), {
    run: true,
    command: ["pnpm", "registry:generate"],
    reason: "push_gate",
  });

  assert.deepEqual(getRegistryPlan("ci"), {
    run: true,
    command: ["pnpm", "registry:generate"],
    reason: "ci_gate",
  });
});

test("package guards honor the root wrapper skip environment", () => {
  assert.equal(shouldSkipPackageGuard({}), false);
  assert.equal(
    shouldSkipPackageGuard({ RDNA_REGISTRY_GUARD_SKIP_PACKAGE: "1" }),
    true,
  );
});
