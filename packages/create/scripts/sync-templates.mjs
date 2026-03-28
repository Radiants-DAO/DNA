import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = resolve(packageRoot, '../../templates/rados-app-prototype');
const targetRoot = resolve(packageRoot, 'templates/rados-app-prototype');
const radiantsPackageJsonPath = resolve(packageRoot, '../radiants/package.json');

if (!existsSync(sourceRoot)) {
  throw new Error(`Missing scaffold template source at ${sourceRoot}`);
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(resolve(packageRoot, 'templates'), { recursive: true });
cpSync(sourceRoot, targetRoot, {
  recursive: true,
  filter: (source) => !source.endsWith('.tsbuildinfo')
});

const radiantsPkg = JSON.parse(readFileSync(radiantsPackageJsonPath, 'utf8'));
const templateManifestPath = resolve(targetRoot, 'package.json.template');
const templateManifest = readFileSync(templateManifestPath, 'utf8').replaceAll(
  '__RDNA_RADIANTS_VERSION__',
  radiantsPkg.version
);

writeFileSync(templateManifestPath, templateManifest);
