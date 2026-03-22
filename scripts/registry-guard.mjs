#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getRegistryPlan,
  shouldSkipPackageGuard,
} from "./registry-guard-lib.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  execFileSync(command, args, {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

function read(command, args) {
  return execFileSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
}

function readPathList(command, args) {
  try {
    return read(command, args).split("\0").filter(Boolean);
  } catch {
    return [];
  }
}

function readStagedFiles() {
  return readPathList("git", [
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
    "-z",
  ]);
}

function readChangedFiles(fromRef, toRef) {
  if (!fromRef || !toRef) return [];
  return readPathList("git", [
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    "-z",
    fromRef,
    toRef,
    "--",
  ]);
}

function hasRef(ref) {
  try {
    read("git", ["rev-parse", "--verify", ref]);
    return true;
  } catch {
    return false;
  }
}

function executePlan(plan) {
  if (!plan.run || !plan.command) {
    console.log(`RDNA registry guard: skip (${plan.reason}).`);
    return;
  }

  const [command, ...args] = plan.command;
  console.log(`RDNA registry guard: ${plan.reason} -> ${command} ${args.join(" ")}`);
  run(command, args);
}

const mode = process.argv[2];

if (!mode) {
  console.error("Usage: node scripts/registry-guard.mjs <mode> [hook args]");
  process.exit(1);
}

if ((mode === "pre-dev" || mode === "pre-build") && shouldSkipPackageGuard()) {
  console.log(`RDNA registry guard: skip (${mode}, inherited root wrapper).`);
  process.exit(0);
}

switch (mode) {
  case "pre-commit":
    executePlan(getRegistryPlan(mode, readStagedFiles()));
    break;
  case "pre-dev":
  case "pre-build":
  case "pre-push":
  case "ci":
    executePlan(getRegistryPlan(mode));
    break;
  case "post-checkout":
    executePlan(getRegistryPlan(mode, readChangedFiles(process.argv[3], process.argv[4])));
    break;
  case "post-merge":
    executePlan(
      getRegistryPlan(
        mode,
        hasRef("ORIG_HEAD") ? readChangedFiles("ORIG_HEAD", "HEAD") : [],
      ),
    );
    break;
  default:
    console.error(`Unsupported registry guard mode: ${mode}`);
    process.exit(1);
}
