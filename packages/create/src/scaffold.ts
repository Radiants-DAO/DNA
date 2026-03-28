import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeScaffoldName, toCamelCase, toPascalCase } from './names.ts';
import { renderTemplateString } from './template.ts';

export interface ScaffoldOptions {
  appName: string;
  outDir: string;
}

const workspaceTemplateRoot = fileURLToPath(
  new URL('../../../templates/rados-app-prototype/', import.meta.url)
);
const packagedTemplateRoot = fileURLToPath(
  new URL('../templates/rados-app-prototype/', import.meta.url)
);
const workspaceRadiantsPackageJson = fileURLToPath(
  new URL('../../radiants/package.json', import.meta.url)
);
const localCreatePackageJson = fileURLToPath(
  new URL('../package.json', import.meta.url)
);

function resolveTemplateRoot(): string {
  const templateRoots = [workspaceTemplateRoot, packagedTemplateRoot];

  for (const templateRoot of templateRoots) {
    if (existsSync(templateRoot)) {
      return templateRoot;
    }
  }

  throw new Error('Unable to locate templates/rados-app-prototype');
}

function renderTemplateTree(
  templateRoot: string,
  outDir: string,
  context: {
    appName: string;
    appPascalName: string;
    appCamelName: string;
    packageName: string;
    radiantsVersion: string;
  }
): void {
  mkdirSync(outDir, { recursive: true });

  for (const entry of readdirSync(templateRoot, { withFileTypes: true })) {
    if (entry.name.endsWith('.tsbuildinfo')) {
      continue;
    }

    const sourcePath = join(templateRoot, entry.name);
    const targetName = entry.name.endsWith('.template')
      ? entry.name.slice(0, -'.template'.length)
      : entry.name;
    const targetPath = join(outDir, targetName);

    if (entry.isDirectory()) {
      renderTemplateTree(sourcePath, targetPath, context);
      continue;
    }

    const rendered = renderTemplateString(readFileSync(sourcePath, 'utf8'), context);
    writeFileSync(targetPath, rendered);
  }
}

function readPackageVersion(packageJsonPath: string): string | null {
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    version?: string;
  };

  return typeof pkg.version === 'string' && pkg.version.trim().length > 0
    ? pkg.version
    : null;
}

function resolveRadiantsVersion(): string {
  return (
    readPackageVersion(workspaceRadiantsPackageJson) ??
    readPackageVersion(localCreatePackageJson) ??
    '0.1.0'
  );
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const appName = normalizeScaffoldName(options.appName);
  const outDir = resolve(options.outDir);
  const templateRoot = resolveTemplateRoot();

  if (!appName) {
    throw new Error('app name must include at least one letter or number');
  }

  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    throw new Error('output directory must be empty');
  }

  renderTemplateTree(templateRoot, outDir, {
    appName,
    appPascalName: toPascalCase(appName),
    appCamelName: toCamelCase(appName),
    packageName: appName,
    radiantsVersion: resolveRadiantsVersion()
  });
}
