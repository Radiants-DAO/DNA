#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIXEL_CORNER_CONFIG } from './pixel-corners.config.mjs';
import { renderPixelCornersGeneratedCss } from './pixel-corners-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'pixel-corners.generated.css');

const css = renderPixelCornersGeneratedCss(PIXEL_CORNER_CONFIG);
writeFileSync(outPath, css, 'utf8');

console.log(`Wrote ${css.length} bytes to pixel-corners.generated.css`);
