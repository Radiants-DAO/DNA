import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LogoMakerControls,
  type LogoMakerControlsProps,
} from '@/components/apps/brand-assets/LogoMakerControls';

const noop = () => {};

function renderControls(overrides: Partial<LogoMakerControlsProps> = {}) {
  const props: LogoMakerControlsProps = {
    size: 512,
    sizeMin: 16,
    sizeMax: 2048,
    sizeTicks: [16, 128, 512, 1024, 2048],
    sizeUnit: 'PX',
    onSizeChange: noop,

    color: 'ink',
    availableColors: ['cream', 'ink', 'yellow'],
    onColorChange: noop,

    pattern: 'checkerboard',
    availablePatterns: [
      { name: 'checkerboard', preview: <span>c</span> },
      { name: 'grid', preview: <span>g</span> },
    ],
    onPatternChange: noop,

    aspectRatio: 'square-512',
    onAspectRatioChange: noop,

    exportMultiplier: 1,
    availableMultipliers: [1, 2, 4],
    onExportMultiplierChange: noop,

    format: 'png',
    onFormatChange: noop,

    onCopy: noop,
    onDownload: noop,
    ...overrides,
  };

  return render(<LogoMakerControls {...props} />);
}

describe('LogoMakerControls', () => {
  afterEach(cleanup);

  it('renders all seven numbered sections', () => {
    renderControls();

    for (const title of [
      '1. SIZE',
      '2. COLOR',
      '3. PATTERN',
      '4. ASPECT RATIO',
      '5. EXPORT SIZE',
      '6. FORMAT',
      '7. EXPORT',
    ]) {
      expect(
        screen.getByRole('button', { name: new RegExp(title, 'i') }),
      ).toBeInTheDocument();
    }
  });

  it('shows the size readout using the PX unit', () => {
    renderControls({ size: 512 });
    expect(screen.getByText(/512 PX/)).toBeInTheDocument();
  });

  it('wires the copy action', async () => {
    const onCopy = vi.fn();
    renderControls({ onCopy });

    const copyButton = screen.getByRole('button', { name: /^Copy$/ });
    copyButton.click();
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('flips the copy label when copied=true', () => {
    renderControls({ copied: true });
    expect(screen.getByRole('button', { name: /^Copied$/ })).toBeInTheDocument();
  });
});
