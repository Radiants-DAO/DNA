#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const [, , mode, ...command] = process.argv;

if (!mode || command.length === 0) {
  console.error(
    "Usage: node scripts/with-registry-guard.mjs <mode> <command> [args...]",
  );
  process.exit(1);
}

const guard = spawnSync("node", ["scripts/registry-guard.mjs", mode], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: process.env,
});

if (guard.status !== 0) {
  process.exit(guard.status ?? 1);
}

const result = spawnSync(command[0], command.slice(1), {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    RDNA_REGISTRY_GUARD_SKIP_PACKAGE: "1",
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
