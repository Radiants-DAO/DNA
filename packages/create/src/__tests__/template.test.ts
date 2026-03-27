import { describe, expect, it } from 'vitest';
import { renderTemplateString, resolveRadiantsDependency } from '../template';

describe('template rendering', () => {
  it('replaces app tokens in plain text files', () => {
    const rendered = renderTemplateString('Hello __APP_PASCAL_NAME__', {
      appName: 'my-app',
      appPascalName: 'MyApp',
      appCamelName: 'myApp',
      packageName: 'my-app'
    });
    expect(rendered).toBe('Hello MyApp');
  });

  it('supports workspace radiants mode during local smoke tests', () => {
    expect(resolveRadiantsDependency('workspace', '/abs/radiants')).toBe(
      'file:/abs/radiants'
    );
  });
});
