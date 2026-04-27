import { ditherBands, type DitherBandsOptions } from '@rdna/pixel';

export type DitherOutputFormat = 'prompt' | 'snippet' | 'bitstring';

export interface DitherCodeOptions extends DitherBandsOptions {
  pixelScale: number;
}

export function generateDitherCode(
  format: DitherOutputFormat,
  options: DitherCodeOptions,
): string {
  const { matrix, steps, direction, pixelScale } = options;
  switch (format) {
    case 'snippet':
      return `ditherBands({ matrix: ${matrix}, steps: ${steps}, direction: '${direction}' })`;
    case 'prompt':
      return [
        `Use this dither band stack:`,
        ``,
        `  import { ditherBands } from '@rdna/pixel/dither';`,
        ``,
        `  const ramp = ditherBands({ matrix: ${matrix}, steps: ${steps}, direction: '${direction}' });`,
        ``,
        `Render N stacked overlay divs over a base color element. Each band gets`,
        `top = (band.index / steps) * 100%, height = 100% / steps. Each band's`,
        `mask-image = band.mask.maskImage, mask-size = ${matrix * pixelScale}px ${matrix * pixelScale}px`,
        `(at pixelScale ${pixelScale}), mask-repeat = repeat. background-color is the`,
        `fill token; the base element underneath uses the empty/base token.`,
        `See packages/radiants/components/core/AppWindow.tsx for the canonical pattern.`,
      ].join('\n');
    case 'bitstring': {
      const { bands } = ditherBands({ matrix, steps, direction });
      return bands
        .map((band) => {
          const lines: string[] = [`# band ${band.index} (density ${band.density.toFixed(3)})`];
          for (let y = 0; y < band.grid.height; y++) {
            const row: string[] = [];
            for (let x = 0; x < band.grid.width; x++) {
              row.push(band.grid.bits.charAt(y * band.grid.width + x) === '1' ? '■' : '·');
            }
            lines.push(row.join(' '));
          }
          return lines.join('\n');
        })
        .join('\n\n');
    }
  }
}
