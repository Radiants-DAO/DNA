import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const playgroundSource = readFileSync(
  join(process.cwd(), 'components/apps/pixel-playground/PixelPlayground.tsx'),
  'utf8',
);
const controlsSource = readFileSync(
  join(process.cwd(), 'components/apps/pixel-playground/PixelPlaygroundControls.tsx'),
  'utf8',
);

describe('PixelPlayground tab layout', () => {
  it('prioritizes visual previews over generated output for browsing-heavy modes', () => {
    expect(playgroundSource).toContain(
      "const previewFirstModes = new Set<PixelMode>(['patterns', 'icons']);",
    );
    expect(playgroundSource).toContain('const previewFirst = previewFirstModes.has(state.mode);');
    expect(playgroundSource).toContain('{previewFirst ? modePreviewPanel : codeOutputPanel}');
    expect(playgroundSource).toContain('{previewFirst ? codeOutputPanel : modePreviewPanel}');
  });

  it('keeps the playground canvas as the primary in-window surface', () => {
    expect(playgroundSource).toContain("side: 'bottom' as const");
    expect(playgroundSource).toContain("label: 'Library'");
    expect(playgroundSource).toContain('useControlSurfaceSlot(librarySlot)');
    expect(playgroundSource).toContain('if (usesInlineWorkbench)');
    expect(playgroundSource).not.toContain('basis-1/2 grid-cols-2');
  });

  it('uses the Radiants canvas/tools left rail instead of the old edit drawer', () => {
    expect(playgroundSource).toContain('title="CANVAS"');
    expect(playgroundSource).toContain('variant="canvasPane"');
    expect(playgroundSource).toContain('title={usesInlineWorkbench ? \'TOOLS\' : \'CONTROLS\'}');
    expect(playgroundSource).not.toContain("label: 'Edit'");
    expect(playgroundSource).not.toContain('useControlSurfaceSlot(editToolbarSlot)');
    expect(controlsSource).not.toContain("variant === 'editToolbar'");
    expect(controlsSource).toContain('aria-label="Canvas controls"');
    expect(controlsSource).toContain('ariaLabel="Canvas size"');
    expect(controlsSource).toContain(
      'className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px"',
    );
  });

  it('hides fixed-size controls instead of rendering disabled steppers', () => {
    expect(controlsSource).toContain('const isFixedSize = sizeMin === sizeMax;');
    expect(controlsSource).toContain('{!isFixedSize && (');
  });

  it('uses ctrl sliders for draggable canvas and preview sizing', () => {
    expect(controlsSource).toContain('Slider,');
    expect(controlsSource).toContain('Stepper,');
    expect(controlsSource).toContain('<Slider');
    expect(controlsSource).toContain("variant === 'canvasPane'");
    expect(controlsSource).toContain('ariaLabel="Canvas size"');
    expect(controlsSource).toContain('ariaLabel="Preview pixel scale"');
    expect(controlsSource).not.toContain('ariaLabel="Corner size"');
    expect(controlsSource).toContain('decrementIcon={<Icon name="chevron-left" />}');
    expect(controlsSource).toContain('incrementIcon={<Icon name="chevron-right" />}');
    expect(controlsSource).not.toContain('label="Smaller"');
    expect(controlsSource).not.toContain('label="Larger"');
  });

  it('uses radiants primitives for the library controls', () => {
    expect(controlsSource).toContain('Input,');
    expect(controlsSource).toContain('ScrollArea,');
    expect(controlsSource).toContain('ToggleGroup,');
    expect(controlsSource).toContain('<Input');
    expect(controlsSource).toContain('<ScrollArea.Root');
    expect(controlsSource).toContain('<ToggleGroup');
    expect(controlsSource).not.toContain('overflow-y-auto bg-white');
  });
});
