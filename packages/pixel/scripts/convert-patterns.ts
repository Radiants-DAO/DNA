import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(SCRIPT_DIR, '../src/patterns/registry.ts');
const ENTRY_BLOCK_RE = /\{[^{}]*\}/gs;
const NAME_RE = /\bname:\s*(['"])(.*?)\1/s;
const HEX_RE = /\bhex:\s*(['"])(.*?)\1/s;
const BITS_RE = /\bbits:\s*(['"])(.*?)\1/s;

export function hexToBitstring(hex: string): string {
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

export function extractPatternEntries(
  source: string,
): Array<{ name: string; bits: string }> {
  const entries = [...source.matchAll(ENTRY_BLOCK_RE)]
    .map((match) => match[0])
    .map((block) => {
      const nameMatch = block.match(NAME_RE);
      const hexMatch = block.match(HEX_RE);
      const bitsMatch = block.match(BITS_RE);

      if (!nameMatch) {
        return null;
      }

      return {
        name: nameMatch[2],
        bits: bitsMatch ? bitsMatch[2] : hexMatch ? hexToBitstring(hexMatch[2]) : '',
      };
    })
    .filter(
      (entry): entry is { name: string; bits: string } =>
        entry !== null && entry.bits.length > 0,
    );

  return entries;
}

async function main(): Promise<void> {
  const source = await readFile(REGISTRY_PATH, 'utf8');
  const entries = extractPatternEntries(source);

  if (entries.length === 0) {
    throw new Error(`No pattern entries found in ${REGISTRY_PATH}`);
  }

  for (const entry of entries) {
    console.log(
      `  { name: '${entry.name}', width: 8, height: 8, bits: '${entry.bits}' },`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
