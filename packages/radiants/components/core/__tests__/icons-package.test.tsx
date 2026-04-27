import fs from 'node:fs';
import path from 'node:path';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '../../../../..');

describe('radiants icons package', () => {
  test('exports the Icon component and brand logos on the public surface', async () => {
    const icons = await import('../../../icons');

    expect(icons).toHaveProperty('Icon');
    expect(icons).toHaveProperty('WordmarkLogo');
    expect(icons).toHaveProperty('RadSunLogo');
    expect(icons).toHaveProperty('RadMarkIcon');
    expect(icons).toHaveProperty('FontAaIcon');

    // Brand/logo icons still render as inline <svg>.
    const { container: wordmarkContainer } = render(<icons.WordmarkLogo />);
    const { container: radSunContainer } = render(<icons.RadSunLogo />);
    expect(wordmarkContainer.querySelector('svg')).toBeInTheDocument();
    expect(radSunContainer.querySelector('svg')).toBeInTheDocument();
  }, 10000);

  test('Icon renders through the generated SVG importer path', async () => {
    const { Icon } = await import('../../../icons');

    const { container: closeContainer } = render(
      <Icon name="close" aria-label="Close" />,
    );
    await waitFor(() => expect(closeContainer.querySelector('svg')).toBeInTheDocument());
    const closeEl = closeContainer.querySelector('svg');
    expect(closeEl).toHaveAttribute('aria-label', 'Close');
    expect(closeEl).toHaveAttribute('width', '16');
    expect(closeEl).toHaveAttribute('height', '16');

    const { container: gridContainer } = render(
      <Icon name="grid-3x3" aria-label="Grid" />,
    );
    await waitFor(() => expect(gridContainer.querySelector('svg')).toBeInTheDocument());
    const gridEl = gridContainer.querySelector('svg');
    expect(gridEl).toHaveAttribute('aria-label', 'Grid');
  }, 10000);

  test('includes RadOS custom SVG assets in the shared icon directory', () => {
    const requiredIcons = [
      'discord.svg',
      'moon.svg',
      'twitter.svg',
    ];

    for (const iconName of requiredIcons) {
      const iconPath = path.resolve(repoRoot, 'packages/radiants/assets/icons/16px', iconName);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });
});
