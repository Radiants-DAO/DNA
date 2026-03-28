#!/usr/bin/env node

import { resolve } from 'node:path';
import { scaffoldProject } from './scaffold.ts';

interface CliOptions {
  appName: string;
  outDir: string;
}

function parseArgs(argv: string[]): CliOptions {
  const [appName, ...rest] = argv;

  if (!appName) {
    throw new Error('Usage: rdna-create <app-name> [--out-dir <dir>]');
  }

  let outDir = resolve(process.cwd(), appName);

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    const value = rest[index + 1];

    if (arg === '--out-dir') {
      if (!value) {
        throw new Error('--out-dir requires a value');
      }

      outDir = resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    appName,
    outDir
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await scaffoldProject(options);
  console.log(`Created ${options.outDir}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
