import { describe, expect, it } from 'vitest';
import { normalizeScaffoldName, toPascalCase, toCamelCase } from '../index';

describe('name helpers', () => {
  it('normalizes arbitrary input to kebab-case', () => {
    expect(normalizeScaffoldName('My Cool App')).toBe('my-cool-app');
  });

  it('derives PascalCase and camelCase names', () => {
    expect(toPascalCase('my-cool-app')).toBe('MyCoolApp');
    expect(toCamelCase('my-cool-app')).toBe('myCoolApp');
  });
});
