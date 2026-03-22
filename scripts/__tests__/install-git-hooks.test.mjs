import test from "node:test";
import assert from "node:assert/strict";

import {
  getDesiredHooksPath,
  getHookInstallPlan,
} from "../install-git-hooks-lib.mjs";

test("getDesiredHooksPath points git to the repo-managed hooks directory", () => {
  assert.equal(
    getDesiredHooksPath("/Users/rivermassey/Desktop/dev/DNA"),
    "/Users/rivermassey/Desktop/dev/DNA/.githooks",
  );
});

test("install plan skips non-git directories", () => {
  assert.deepEqual(
    getHookInstallPlan({
      repoRoot: "/repo",
      isGitRepo: false,
      currentHooksPath: null,
    }),
    {
      shouldConfigure: false,
      desiredHooksPath: "/repo/.githooks",
      reason: "not_git_repo",
    },
  );
});

test("install plan is a no-op when git already points at the repo hooks", () => {
  assert.deepEqual(
    getHookInstallPlan({
      repoRoot: "/repo",
      isGitRepo: true,
      currentHooksPath: "/repo/.githooks",
    }),
    {
      shouldConfigure: false,
      desiredHooksPath: "/repo/.githooks",
      reason: "already_configured",
    },
  );
});

test("install plan requests configuration when hooksPath is missing or different", () => {
  assert.deepEqual(
    getHookInstallPlan({
      repoRoot: "/repo",
      isGitRepo: true,
      currentHooksPath: null,
    }),
    {
      shouldConfigure: true,
      desiredHooksPath: "/repo/.githooks",
      reason: "configure_hooks_path",
    },
  );

  assert.deepEqual(
    getHookInstallPlan({
      repoRoot: "/repo",
      isGitRepo: true,
      currentHooksPath: "/repo/.husky",
    }),
    {
      shouldConfigure: true,
      desiredHooksPath: "/repo/.githooks",
      reason: "configure_hooks_path",
    },
  );
});
