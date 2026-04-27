import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'ctrl.css'), 'utf8');

function blockFor(selector: string): string {
  const match = css.match(new RegExp(`${selector.replaceAll('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? '';
}

describe('ctrl theme tokens', () => {
  it('registers mode-owned surface tokens as Tailwind placeholders', () => {
    const themeBlock = blockFor('@theme');

    expect(themeBlock).toContain('--color-ctrl-cell-bg: transparent;');
    expect(themeBlock).toContain('--color-ctrl-track: transparent;');
  });

  it('defines separate e-reader light tokens and screen-dark tokens', () => {
    const rootBlock = blockFor(':root');
    const darkBlock = blockFor('.dark');

    expect(css).not.toContain(':root, .dark');

    expect(rootBlock).toContain('--color-ctrl-cell-bg: var(--color-page);');
    expect(rootBlock).toContain('--color-ctrl-track: color-mix(in oklch, var(--color-page) 86%, var(--color-main));');
    expect(rootBlock).toContain('--ctrl-lcd-text-shadow: none;');
    expect(rootBlock).toContain('--ctrl-text-glow-active: none;');

    expect(darkBlock).toContain('--color-ctrl-cell-bg: oklch(0 0 0 / 0.8);');
    expect(darkBlock).toContain('--color-ctrl-track: oklch(0 0 0 / 0.6);');
    expect(darkBlock).toContain('--ctrl-lcd-text-color: oklch(1 0 0);');
    expect(darkBlock).toContain('--ctrl-text-glow-active:');
  });
});
