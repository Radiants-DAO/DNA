import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const designPath = resolve(repoRoot, 'packages/radiants/DESIGN.md');
const before = readFileSync(designPath, 'utf8');

const generate = spawnSync('pnpm', ['--filter', '@rdna/radiants', 'generate:design-md'], {
  cwd: repoRoot,
  encoding: 'utf8',
  stdio: 'inherit',
});

if (generate.status !== 0) {
  process.exit(generate.status ?? 1);
}

const after = readFileSync(designPath, 'utf8');

if (after !== before) {
  console.error('packages/radiants/DESIGN.md is out of sync. Run pnpm registry:generate.');
  spawnSync('git', ['diff', '--', 'packages/radiants/DESIGN.md'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  process.exit(1);
}
