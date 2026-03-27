export interface TemplateContext {
  appName: string;
  appPascalName: string;
  appCamelName: string;
  packageName: string;
  radiantsDependency: string;
}

export function renderTemplateString(
  input: string,
  context: TemplateContext
): string {
  return input
    .replaceAll('__APP_NAME__', context.appName)
    .replaceAll('__APP_PASCAL_NAME__', context.appPascalName)
    .replaceAll('__APP_CAMEL_NAME__', context.appCamelName)
    .replaceAll('__PACKAGE_NAME__', context.packageName)
    .replaceAll('__RADIANTS_DEP__', context.radiantsDependency);
}

export function resolveRadiantsDependency(
  mode: 'workspace' | 'published',
  radiantsPath?: string
): string {
  if (mode === 'workspace') {
    if (!radiantsPath) {
      throw new Error('workspace mode requires --radiants-path');
    }

    return `file:${radiantsPath}`;
  }

  return '^0.1.0';
}
