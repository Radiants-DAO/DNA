#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extractAddedRdnaDisableCommentsFromDiff } from '../packages/radiants/eslint/rdna-disable-comment-utils.mjs';

const SOURCE_GLOBS = [
  ':(glob)**/*.ts',
  ':(glob)**/*.tsx',
  ':(glob)**/*.js',
  ':(glob)**/*.jsx',
  ':(glob)**/*.mjs',
  ':(glob)**/*.cjs',
];

const SOURCE_EXCLUDES = [
  ':(exclude)apps/rad-os/app/dev/**',
  ':(exclude)**/__tests__/**',
  ':(exclude)**/*.test.ts',
  ':(exclude)**/*.test.tsx',
  ':(exclude)**/*.test.js',
  ':(exclude)**/*.test.jsx',
  ':(exclude)**/*.test.mjs',
  ':(exclude)**/*.test.cjs',
];

export function parseCliArgs(argv = process.argv) {
  const args = new Map();
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key?.startsWith('--') && value) {
      args.set(key, value);
    }
  }
  return args;
}

export function resolveReportDiffSpec(args) {
  const fromRef = args.get('--from-ref');
  const toRef = args.get('--to-ref') || 'HEAD';

  if (fromRef) {
    return {
      label: `${fromRef}..${toRef}`,
      mode: 'range',
      refs: [fromRef, toRef],
    };
  }

  const baseRef = args.get('--base-ref') || 'origin/main';
  return {
    baseRef,
    headRef: toRef,
    label: `${baseRef}...${toRef}`,
    mode: 'merge-base',
  };
}

export function buildReportDiffArgs(diffSpec, execGitFn = execGit) {
  if (diffSpec.mode === 'range') {
    return ['diff', '--unified=0', ...diffSpec.refs, '--', ...SOURCE_GLOBS, ...SOURCE_EXCLUDES];
  }

  const mergeBase = execGitFn(['merge-base', diffSpec.headRef, diffSpec.baseRef]).trim();
  return ['diff', '--unified=0', `${mergeBase}...${diffSpec.headRef}`, '--', ...SOURCE_GLOBS, ...SOURCE_EXCLUDES];
}

export function main(argv = process.argv, execGitFn = execGit) {
  const args = parseCliArgs(argv);
  const diffSpec = resolveReportDiffSpec(args);
  const diff = execGitFn(buildReportDiffArgs(diffSpec, execGitFn));
  const additions = extractAddedRdnaDisableCommentsFromDiff(diff);

  if (additions.length === 0) {
    console.log(`RDNA: no new rdna/* exceptions added relative to ${diffSpec.label}.`);
    return 0;
  }

  console.log(`RDNA: new rdna/* exceptions added relative to ${diffSpec.label}:`);
  for (const addition of additions) {
    console.log(
      `- ${addition.filePath}:${addition.line} [eslint-${addition.kind}] ${addition.rdnaRules.join(', ')}`
    );
  }
  console.log('RDNA: these exceptions require explicit approval in code review.');
  return 0;
}

function execGit(argsList) {
  return execFileSync('git', argsList, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main());
}
