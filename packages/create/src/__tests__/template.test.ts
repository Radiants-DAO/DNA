import { describe, expect, it } from 'vitest';
import { renderTemplateString, resolveRadiantsDependency } from '../template';

describe('template rendering', () => {
  it('replaces app tokens in plain text files', () => {
    const rendered = renderTemplateString('Hello __APP_PASCAL_NAME__', {
      appName: 'my-app',
      appPascalName: 'MyApp',
      appCamelName: 'myApp',
      packageName: 'my-app',
      radiantsDependency: '^0.1.0'
    });
    expect(rendered).toBe('Hello MyApp');
  });

  it('replaces the radiants dependency token', () => {
    const rendered = renderTemplateString('"@rdna/radiants": "__RADIANTS_DEP__"', {
      appName: 'my-app',
      appPascalName: 'MyApp',
      appCamelName: 'myApp',
      packageName: 'my-app',
      radiantsDependency: 'file:/abs/radiants'
    });

    expect(rendered).toBe('"@rdna/radiants": "file:/abs/radiants"');
  });

  it('supports workspace radiants mode during local smoke tests', () => {
    expect(resolveRadiantsDependency('workspace', '/abs/radiants')).toBe(
      'file:/abs/radiants'
    );
  });
});
