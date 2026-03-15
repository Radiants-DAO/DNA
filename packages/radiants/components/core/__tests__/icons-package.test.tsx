import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '../../../../..');

describe('radiants icons package', () => {
  test('exports shared RadOS logo components', async () => {
    const icons = await import('../../../icons');

    expect(icons).toHaveProperty('WordmarkLogo');
    expect(icons).toHaveProperty('RadSunLogo');
    expect(icons).toHaveProperty('CloseIcon');
    expect(icons).toHaveProperty('CopyIcon');
    expect(icons).toHaveProperty('HelpIcon');
    expect(icons).toHaveProperty('ComponentsIcon');

    const { container: wordmarkContainer } = render(<icons.WordmarkLogo />);
    const { container: radSunContainer } = render(<icons.RadSunLogo />);
    const { container: closeContainer } = render(<icons.CloseIcon />);
    const { container: componentsContainer } = render(<icons.ComponentsIcon />);

    expect(wordmarkContainer.querySelector('svg')).toBeInTheDocument();
    expect(radSunContainer.querySelector('svg')).toBeInTheDocument();
    expect(closeContainer.querySelector('svg')).toBeInTheDocument();
    expect(componentsContainer.querySelector('svg')).toBeInTheDocument();
  });

  test('includes RadOS custom SVG assets in the shared icon directory', () => {
    const requiredIcons = [
      'discord.svg',
      'moon.svg',
      'radiants-logo.svg',
      'twitter.svg',
    ];

    for (const iconName of requiredIcons) {
      const iconPath = path.resolve(repoRoot, 'packages/radiants/assets/icons', iconName);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });
});
