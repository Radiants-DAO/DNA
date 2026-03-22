import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'registry/runtime-attachments.tsx'),
  'utf8',
);

describe('runtime attachments prop forwarding', () => {
  it('threads Select forwarding props through the active runtime demo', () => {
    expect(source).toContain(
      "Demo: ({ size = 'md', disabled, placeholder = 'Pick a color', error, fullWidth, value }: Record<string, unknown>) => {",
    );
    expect(source).toContain(
      "const { state, actions } = Select.useSelectState({ value: typeof value === 'string' ? value : undefined });",
    );
  });

  it('threads Drawer, Sheet, and Popover panel props through the active runtime demo', () => {
    expect(source).toContain(
      "Demo: ({ direction = 'bottom', defaultOpen }: Record<string, unknown>) => {",
    );
    expect(source).toContain("<Sheet side={side as string} {...rest}>");
    expect(source).toContain("<Popover position={position as string} {...rest}>");
  });
});
