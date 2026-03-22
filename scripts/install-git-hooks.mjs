#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

import { getHookInstallPlan } from "./install-git-hooks-lib.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readGit(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function runGit(args) {
  execFileSync("git", args, {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}

function isGitRepo() {
  try {
    return readGit(["rev-parse", "--is-inside-work-tree"]) === "true";
  } catch {
    return false;
  }
}

function getCurrentHooksPath() {
  try {
    return readGit(["config", "--get", "core.hooksPath"]) || null;
  } catch {
    return null;
  }
}

const plan = getHookInstallPlan({
  repoRoot: REPO_ROOT,
  isGitRepo: isGitRepo(),
  currentHooksPath: getCurrentHooksPath(),
});

if (!plan.shouldConfigure) {
  if (plan.reason === "not_git_repo") {
    console.log("RDNA hooks: skipping install outside a Git worktree.");
  } else {
    console.log("RDNA hooks: core.hooksPath already configured.");
  }
  process.exit(0);
}

mkdirSync(plan.desiredHooksPath, { recursive: true });
runGit(["config", "core.hooksPath", plan.desiredHooksPath]);
console.log(`RDNA hooks: configured core.hooksPath -> ${plan.desiredHooksPath}`);
