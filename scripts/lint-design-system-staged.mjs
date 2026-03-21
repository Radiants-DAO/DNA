#!/usr/bin/env node

/**
 * Runs eslint-plugin-rdna on staged .ts/.tsx files in RDNA scope,
 * and lint-token-colors on staged token CSS files.
 * Called by .githooks/pre-commit and `pnpm lint:design-system:staged`.
 */
import { execSync } from 'node:child_process';

// Get staged files (NUL-separated for safety with special chars)
const raw = execSync('git diff --cached --name-only --diff-filter=ACMR -z', {
  encoding: 'utf-8',
});

const allStagedFiles = raw.split('\0').filter(Boolean);

// --- TS/TSX ESLint check ---
const stagedFiles = allStagedFiles.filter(f => /\.(tsx?)$/.test(f));

// Filter to in-scope paths only
const inScopePrefixes = [
  'packages/radiants/components/core/',
  'apps/rad-os/',
];

const targetFiles = stagedFiles.filter(f =>
  inScopePrefixes.some(prefix => f.startsWith(prefix))
);

// --- Token CSS color-format check ---
const TOKEN_CSS_FILES = [
  'packages/radiants/tokens.css',
  'packages/radiants/dark.css',
];

const stagedTokenFiles = allStagedFiles.filter(f => TOKEN_CSS_FILES.includes(f));

if (targetFiles.length === 0 && stagedTokenFiles.length === 0) {
  console.log('RDNA: no in-scope staged files. Skipping design-system lint.');
  process.exit(0);
}

let failed = false;

if (targetFiles.length > 0) {
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
    console.error('Use // eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123 (or issue:https://...) for approved exceptions.');
    failed = true;
  }
}

if (stagedTokenFiles.length > 0) {
  console.log(`RDNA: checking ${stagedTokenFiles.length} staged token CSS file(s)...`);

  try {
    execSync(
      `node scripts/lint-token-colors.mjs ${stagedTokenFiles.map(f => `"${f}"`).join(' ')}`,
      { stdio: 'inherit' }
    );
  } catch {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
