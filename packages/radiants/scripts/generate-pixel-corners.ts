#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPixelCornersGeneratedCss } from './pixel-corners-lib.ts';

export function writePixelCornersGeneratedCss(
  outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../pixel-corners.generated.css'),
) {
  const css = renderPixelCornersGeneratedCss();
  writeFileSync(outputPath, css, 'utf8');
  return css;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const css = writePixelCornersGeneratedCss();
  console.log(`Wrote ${css.length} bytes to pixel-corners.generated.css`);
}
