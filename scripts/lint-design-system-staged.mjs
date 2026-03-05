#!/usr/bin/env node

/**
 * Runs eslint-plugin-rdna on staged .ts/.tsx files in RDNA scope.
 * Called by .githooks/pre-commit and `pnpm lint:design-system:staged`.
 */
import { execSync } from 'node:child_process';

// Get staged files (NUL-separated for safety with special chars)
const raw = execSync('git diff --cached --name-only --diff-filter=ACMR -z', {
  encoding: 'utf-8',
});

const stagedFiles = raw
  .split('\0')
  .filter(Boolean)
  .filter(f => /\.(tsx?)$/.test(f));

// Filter to in-scope paths only
const inScopePrefixes = [
  'packages/radiants/components/core/',
  'apps/rad-os/',
  'apps/radiator/',
];

const targetFiles = stagedFiles.filter(f =>
  inScopePrefixes.some(prefix => f.startsWith(prefix))
);

if (targetFiles.length === 0) {
  console.log('RDNA: no in-scope staged files. Skipping design-system lint.');
  process.exit(0);
}

console.log(`RDNA: checking ${targetFiles.length} staged file(s)...`);

try {
  execSync(
    `pnpm exec eslint --config eslint.rdna.config.mjs -- ${targetFiles.map(f => `"${f}"`).join(' ')}`,
    { stdio: 'inherit' }
  );
  console.log('RDNA: design system lint passed.');
} catch {
  console.error('');
  console.error('RDNA: design system violations found. Fix before committing.');
  console.error('Use // eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team> expires:YYYY-MM-DD issue:<link> for exceptions.');
  process.exit(1);
}
