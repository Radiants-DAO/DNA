#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(resolve(PACKAGE_ROOT, "package.json"), "utf8"),
);

function getExportEntries(exportsField) {
  return Object.entries(exportsField).map(([subpath, target]) => {
    if (typeof target === "string") {
      return [subpath, { import: target }];
    }

    return [subpath, target];
  });
}

for (const [subpath, target] of getExportEntries(packageJson.exports)) {
  for (const field of ["import", "types"]) {
    const value = target[field];
    if (!value) {
      continue;
    }

    if (!value.startsWith("./dist/")) {
      throw new Error(`${subpath} ${field} target must point at ./dist: ${value}`);
    }

    await access(resolve(PACKAGE_ROOT, value));
  }
}

for (const [, target] of getExportEntries(packageJson.exports)) {
  if (!target.import) {
    continue;
  }

  await import(pathToFileURL(resolve(PACKAGE_ROOT, target.import)).href);
}
