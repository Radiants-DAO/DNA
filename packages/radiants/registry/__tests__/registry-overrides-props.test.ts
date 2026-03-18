import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const source = readFileSync(resolve(process.cwd(), 'registry/registry.overrides.tsx'), 'utf8');

describe('registry overrides prop forwarding', () => {
  it('threads Card noPadding and className into the primary demo card', () => {
    expect(source).toContain("Demo: ({ variant = 'default', className = '', noPadding = false }: Record<string, unknown>) => (");
    expect(source).toContain("<Card variant={variant as string} className={`w-full max-w-[20rem] ${className as string}`.trim()} noPadding={noPadding as boolean}>");
  });

  it('threads Select value and trigger props through the custom demo', () => {
    expect(source).toContain("Demo: ({ size = 'md', disabled, placeholder = 'Pick a color', error, fullWidth, value }: Record<string, unknown>) => {");
    expect(source).toContain("const { state, actions } = Select.useSelectState({ value: typeof value === 'string' ? value : undefined });");
    expect(source).toContain("<Select.Trigger placeholder={placeholder as string} size={size as string}");
    expect(source).toContain("{...(disabled !== undefined ? { disabled: disabled as boolean } : {})}");
    expect(source).toContain("{...(error !== undefined ? { error: error as boolean } : {})}");
    expect(source).toContain("{...(fullWidth !== undefined ? { fullWidth: fullWidth as boolean } : {})}");
  });

  it('threads defaultOpen into overlay demos that expose it', () => {
    expect(source).toContain("Demo: ({ direction = 'bottom', defaultOpen }: Record<string, unknown>) => {");
    expect(source).toContain("const { state, actions } = Drawer.useDrawerState({ defaultOpen: defaultOpen as boolean | undefined });");
    expect(source).toContain("<Sheet side={side as string} {...rest}>");
    expect(source).toContain("<Popover position={position as string} {...rest}>");
  });
});
