import { describe, expect, it } from 'vitest';
import { renderTemplateString } from '../template';

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

  it('replaces package-name tokens used in the scaffold manifest', () => {
    const rendered = renderTemplateString('"name": "__PACKAGE_NAME__"', {
      appName: 'my-app',
      appPascalName: 'MyApp',
      appCamelName: 'myApp',
      packageName: 'my-app'
    });

    expect(rendered).toBe('"name": "my-app"');
  });
});
