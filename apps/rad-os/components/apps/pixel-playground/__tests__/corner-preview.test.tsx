import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrushTool } from '@/lib/dotting';

import { getRegistryForMode } from '../constants';
import { PixelPlaygroundControls } from '../PixelPlaygroundControls';
import { CornerPreview } from '../previews/CornerPreview';

afterEach(() => {
  cleanup();
});

describe('CornerPreview', () => {
  it('renders generated corner entries as a single runtime-styled box', () => {
    const chamfer = getRegistryForMode('corners', 8).find((entry) => entry.name === 'chamfer-8');
    expect(chamfer).toBeTruthy();

    const { container } = render(
      <CornerPreview
        grid={chamfer!}
        cornerSize={8}
        settings={{ pixelScale: 7 }}
      />,
    );

    expect(screen.getByLabelText('Corner shape preview')).toBeInTheDocument();
    expect(container.querySelector('[data-preview-kind="single-box"]')).not.toBeNull();
    expect(container.querySelector('[data-corner-shape="chamfer"]')).not.toBeNull();
    expect(container.querySelector('[data-pixel-scale="7"]')).not.toBeNull();
    expect(screen.getByLabelText('Corner shape preview')).toHaveAttribute(
      'data-corner-source',
      'registry',
    );
    expect(
      screen.getByLabelText('Corner shape preview').style.getPropertyValue('--px-tl-border'),
    ).toContain('M7%2C0');
    expect(container.querySelector('.pat-pixel-shadow')).not.toBeNull();
    expect(container.querySelector('.pat-pixel-shadow__fill')).not.toBeNull();
  });

  it('falls back to a circle runtime box before a shape is selected', () => {
    const { container } = render(
      <CornerPreview grid={null} cornerSize={12} settings={{ pixelScale: 5 }} />,
    );

    expect(screen.getByLabelText('Corner shape preview')).toBeInTheDocument();
    expect(container.querySelector('[data-corner-shape="circle"]')).not.toBeNull();
  });

  it('grows the preview box when scaled corner masks would otherwise overlap', () => {
    render(<CornerPreview grid={null} cornerSize={24} settings={{ pixelScale: 6 }} />);

    const preview = screen.getByLabelText('Corner shape preview');
    expect(preview).toHaveAttribute('data-corner-mask-px', '144');
    expect(preview.parentElement).toHaveStyle({
      width: '384px',
      height: '352px',
    });
  });

  it('materializes untitled drawn corner bits into the preview masks', () => {
    const drawnGrid = {
      name: 'untitled',
      width: 4,
      height: 4,
      bits: [
        '1111',
        '1110',
        '1100',
        '1000',
      ].join(''),
    };

    const { container } = render(
      <CornerPreview grid={drawnGrid} cornerSize={4} settings={{ pixelScale: 4 }} />,
    );

    const preview = screen.getByLabelText('Corner shape preview');
    expect(preview).toHaveAttribute('data-corner-source', 'grid');
    expect(preview.style.getPropertyValue('--px-tl-cover')).toContain('M0%2C0h4v1h-4Z');
    expect(preview.style.getPropertyValue('--px-tl-border')).not.toContain("d=''")
    expect(preview.style.getPropertyValue('--px-tl-border')).toContain('M3%2C1h1v1h-1Z');
    expect(container.querySelector('[data-corner-shape="circle"]')).toBeNull();
  });
});

describe('PixelPlaygroundControls corner preview settings', () => {
  it('keeps canvas size in the canvas pane and preview scale in settings', () => {
    const handlePreviewSettingsChange = vi.fn();
    const handleSizeChange = vi.fn();
    const baseProps = {
      mode: 'corners' as const,
      availableModes: ['corners'] as const,
      onModeChange: () => undefined,
      showModeControl: false,
      gridSize: 8,
      sizeMin: 2,
      sizeMax: 24,
      onSizeDecrement: () => undefined,
      onSizeIncrement: () => undefined,
      onSizeChange: handleSizeChange,
      activeTool: BrushTool.DOT,
      onToolChange: () => undefined,
      isGridVisible: true,
      onGridVisibleChange: () => undefined,
      onUndo: () => undefined,
      onRedo: () => undefined,
      onClear: () => undefined,
      registryEntries: [],
      selectedEntryName: null,
      onSelectEntry: () => undefined,
      cornerPreviewSettings: { pixelScale: 6 },
      onCornerPreviewSettingsChange: handlePreviewSettingsChange,
    };

    render(
      <PixelPlaygroundControls
        {...baseProps}
        variant="canvasPane"
      />,
    );

    fireEvent.keyDown(screen.getByLabelText('Canvas size'), { key: 'ArrowRight' });
    expect(handleSizeChange).toHaveBeenCalledWith(9);

    cleanup();

    render(
      <PixelPlaygroundControls
        {...baseProps}
        variant="settings"
      />,
    );

    expect(screen.getByText('1. SCALE')).toBeInTheDocument();
    expect(screen.getByText('SCALE')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Preview pixel scale'), { key: 'ArrowRight' });

    expect(handlePreviewSettingsChange).toHaveBeenCalledWith({
      pixelScale: 7,
    });
  });
});
