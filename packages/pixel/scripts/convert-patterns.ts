import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(SCRIPT_DIR, '../../radiants/patterns/registry.ts');
const ENTRY_RE = /\{\s*name:\s*'([^']+)'.*?\bhex:\s*'([^']+)'.*?\}/g;

function hexToBitstring(hex: string): string {
  const bytes = hex.trim().split(/\s+/).filter(Boolean);

  if (bytes.length !== 8) {
    throw new Error(`Expected 8 hex bytes, received ${bytes.length}: ${hex}`);
  }

  return bytes
    .map((byte) => {
      if (!/^[\da-fA-F]{2}$/.test(byte)) {
        throw new Error(`Invalid hex byte: ${byte}`);
      }

      return Number.parseInt(byte, 16).toString(2).padStart(8, '0');
    })
    .join('');
}

async function main(): Promise<void> {
  const source = await readFile(REGISTRY_PATH, 'utf8');
  const entries = [...source.matchAll(ENTRY_RE)].map((match) => ({
    name: match[1],
    bits: hexToBitstring(match[2]),
  }));

  if (entries.length === 0) {
    throw new Error(`No pattern entries found in ${REGISTRY_PATH}`);
  }

  for (const entry of entries) {
    console.log(
      `  { name: '${entry.name}', width: 8, height: 8, bits: '${entry.bits}' },`,
    );
  }
}

await main();
