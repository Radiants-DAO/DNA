import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeScaffoldName, toCamelCase, toPascalCase } from './names.ts';
import { renderTemplateString, resolveRadiantsDependency } from './template.ts';

export interface ScaffoldOptions {
  appName: string;
  outDir: string;
  radiantsSource: 'workspace' | 'published';
  radiantsPath?: string;
}

const workspaceTemplateRoot = fileURLToPath(
  new URL('../../../templates/rados-app-prototype/', import.meta.url)
);
const packagedTemplateRoot = fileURLToPath(
  new URL('./templates/rados-app-prototype/', import.meta.url)
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
    radiantsDependency: string;
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

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const appName = normalizeScaffoldName(options.appName);
  const outDir = resolve(options.outDir);
  const templateRoot = resolveTemplateRoot();
  const radiantsDependency = resolveRadiantsDependency(
    options.radiantsSource,
    options.radiantsPath
  );

  renderTemplateTree(templateRoot, outDir, {
    appName,
    appPascalName: toPascalCase(appName),
    appCamelName: toCamelCase(appName),
    packageName: appName,
    radiantsDependency
  });
}
