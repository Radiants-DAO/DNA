import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = resolve(packageRoot, '../../templates/rados-app-prototype');
const targetRoot = resolve(packageRoot, 'templates/rados-app-prototype');

if (!existsSync(sourceRoot)) {
  throw new Error(`Missing scaffold template source at ${sourceRoot}`);
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(resolve(packageRoot, 'templates'), { recursive: true });
cpSync(sourceRoot, targetRoot, {
  recursive: true,
  filter: (source) => !source.endsWith('.tsbuildinfo')
});
