import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getRegistryForMode } from '../constants';
import { IconPreview } from '../previews/IconPreview';

describe('pixel-playground icons registry', () => {
  it('uses the converted bitmap icon source instead of the tiny authored bridge', () => {
    const icons = getRegistryForMode('icons');

    expect(icons.length).toBeGreaterThan(900);
    expect(new Set(icons.map((entry) => entry.name)).size).toBe(icons.length);
    expect(icons.find((entry) => entry.name === 'close')).toMatchObject({
      name: 'close',
      width: 16,
      height: 16,
    });
    expect(icons.find((entry) => entry.name === 'hand-point')).toMatchObject({
      name: 'hand-point',
      width: 24,
      height: 24,
    });
  });
});

describe('IconPreview', () => {
  it('renders baked bitmap icon specimens for a selected converted icon', () => {
    const handPoint = getRegistryForMode('icons').find((entry) => entry.name === 'hand-point');
    expect(handPoint).toBeTruthy();

    const { container } = render(
      <IconPreview grid={handPoint!} selectedEntry={handPoint!} />,
    );

    expect(screen.getByText('Icon preview')).toBeInTheDocument();
    expect(screen.getByText('Converted runtime')).toBeInTheDocument();
    expect(container.querySelector('[data-rdna="bitmap-icon"][data-size="16"]')).not.toBeNull();
    expect(container.querySelector('[data-rdna="bitmap-icon"][data-size="24"]')).not.toBeNull();
  });
});
