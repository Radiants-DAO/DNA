import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { scanForLegacyColors } from '../packages/radiants/eslint/lib/no-legacy-color-format.mjs';

const DEFAULT_TOKEN_FILES = [
  'packages/radiants/tokens.css',
  'packages/radiants/dark.css',
];
const targetFiles = process.argv.slice(2);
const files = targetFiles.length > 0 ? targetFiles : DEFAULT_TOKEN_FILES;

let totalViolations = 0;

for (const relPath of files) {
  const absPath = resolve(relPath);
  const css = readFileSync(absPath, 'utf-8');
  const violations = scanForLegacyColors(css, basename(relPath));

  for (const v of violations) {
    console.error(`${relPath}:${v.line}:${v.column} - Legacy ${v.type} color: ${v.value}`);
    totalViolations++;
  }
}

if (totalViolations > 0) {
  console.error(`\n✗ ${totalViolations} legacy color format(s) found. Use oklch() instead.`);
  process.exit(1);
} else {
  console.log('✓ All token CSS files use oklch color format.');
  process.exit(0);
}
