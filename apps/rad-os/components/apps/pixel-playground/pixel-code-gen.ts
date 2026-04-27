import type { PixelGrid } from '@rdna/pixel';
import { bitsToPath } from '@rdna/pixel';
import type { OutputFormat, PixelMode } from './types';
import { MODE_CONFIG } from './constants';

export function generatePixelCode(
  mode: PixelMode,
  format: OutputFormat,
  grid: PixelGrid,
): string {
  switch (format) {
    case 'snippet':
      return formatSnippet(grid);
    case 'prompt':
      return formatPrompt(mode, grid);
    case 'bitstring':
      return formatBitstring(grid);
    case 'svg':
      return formatSvg(grid);
  }
}

function formatSnippet(grid: PixelGrid): string {
  return `{ name: '${grid.name}', width: ${grid.width}, height: ${grid.height}, bits: '${grid.bits}' }`;
}

function formatPrompt(mode: PixelMode, grid: PixelGrid): string {
  const cfg = MODE_CONFIG[mode];
  const verb = {
    patterns: 'Author this pattern in',
    icons: 'Author this pixel icon in',
    corners: 'Author this corner override in',
    dither: 'Tune this dither ramp with',
  } satisfies Record<PixelMode, string>;
  const guidance = {
    patterns: [
      '@rdna/pixel is the authoring source of truth.',
      'Radiants materializes checked-in CSS and registries from prepared artifacts.',
    ],
    icons: [
      '@rdna/pixel is the authoring source of truth.',
      'packages/pixel/src/icons/source.ts exposes the browseable converted icon source used by the playground.',
      'Converted runtime icon previews and shipped masks come from @rdna/pixel/icons.',
      'BitmapIcon/getBitmapIcon read the generated 16px and 24px registries.',
      'SVG icons stay on the separate prepared manifest pipeline in packages/radiants/icons/manifest.ts.',
    ],
    corners: [
      '@rdna/pixel is the authoring source of truth.',
      'Radiants materializes checked-in CSS and registries from prepared artifacts.',
      'Theme-following corners stay bound to <html data-corner-shape>.',
      'Fixed corners use an explicit shape override.',
      'Chrome tabs are the reference theme-following surface.',
    ],
    dither: [
      '@rdna/pixel is the authoring source of truth.',
      'Dither stays as a generated ramp helper instead of a registry of authored bit rows.',
      'Radiants and Rad OS consume prepared dither bands through the pixel playground preview path.',
    ],
  } satisfies Record<PixelMode, string[]>;
  return [
    `${verb[mode]} ${cfg.registryName} at ${cfg.registryFile}.`,
    ...guidance[mode].map((line) => `- ${line}`),
    '',
    `  ${formatSnippet(grid)}`,
  ].join('\n');
}

function formatBitstring(grid: PixelGrid): string {
  const lines: string[] = [];
  for (let r = 0; r < grid.height; r++) {
    const row: string[] = [];
    for (let c = 0; c < grid.width; c++) {
      row.push(grid.bits.charAt(r * grid.width + c) === '1' ? '■' : '·');
    }
    lines.push(row.join(' '));
  }
  return lines.join('\n');
}

function formatSvg(grid: PixelGrid): string {
  const d = bitsToPath(grid.bits, grid.width, grid.height);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid.width} ${grid.height}" width="${grid.width}" height="${grid.height}">`,
    `  <path fill="currentColor" d="${d}" />`,
    `</svg>`,
  ].join('\n');
}
