import type { RegistryEntry } from '@rdna/radiants/registry';

export type CodeFormat = 'jsx' | 'css' | 'tailwind';

export function generateComponentCode(
  format: CodeFormat,
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): string {
  switch (format) {
    case 'jsx':
      return generateJSX(entry, propValues);
    case 'css':
      return generateCSS(entry);
    case 'tailwind':
      return generateTailwind(entry, propValues);
  }
}

function generateJSX(
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): string {
  const nonDefault = getNonDefaultProps(entry, propValues);
  if (Object.keys(nonDefault).length === 0) {
    return `<${entry.name} />`;
  }

  const propStrings = Object.entries(nonDefault).map(([key, value]) => {
    if (typeof value === 'string') return `${key}="${value}"`;
    if (typeof value === 'boolean') return value ? key : `${key}={false}`;
    return `${key}={${JSON.stringify(value)}}`;
  });

  const inline = `<${entry.name} ${propStrings.join(' ')} />`;
  if (inline.length <= 80) return inline;

  const lines = [`<${entry.name}`];
  for (const p of propStrings) {
    lines.push(`  ${p}`);
  }
  lines.push('/>');
  return lines.join('\n');
}

function generateCSS(entry: RegistryEntry): string {
  const bindings = entry.tokenBindings;
  if (!bindings || Object.keys(bindings).length === 0) {
    return `/* ${entry.name} — no token bindings defined */`;
  }

  const lines = [`/* ${entry.name} — token bindings */`];
  for (const [slot, tokens] of Object.entries(bindings)) {
    lines.push(`\n/* ${slot} */`);
    for (const [prop, token] of Object.entries(tokens)) {
      lines.push(`${prop}: var(${token});`);
    }
  }
  return lines.join('\n');
}

function generateTailwind(
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): string {
  const nonDefault = getNonDefaultProps(entry, propValues);
  const propStrings = Object.entries(nonDefault).map(([key, value]) => {
    if (typeof value === 'string') return `${key}="${value}"`;
    if (typeof value === 'boolean') return value ? key : `${key}={false}`;
    return `${key}={${JSON.stringify(value)}}`;
  });

  const lines: string[] = [];
  lines.push(`import { ${entry.name} } from '@rdna/radiants/components/core';`);
  lines.push('');

  if (propStrings.length === 0) {
    lines.push(`<${entry.name} />`);
  } else {
    const inline = `<${entry.name} ${propStrings.join(' ')} />`;
    if (inline.length <= 80) {
      lines.push(inline);
    } else {
      lines.push(`<${entry.name}`);
      for (const p of propStrings) {
        lines.push(`  ${p}`);
      }
      lines.push('/>');
    }
  }

  return lines.join('\n');
}

function getNonDefaultProps(
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(propValues)) {
    const def = entry.defaultProps?.[key];
    if (value !== def && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
}
