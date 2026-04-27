import { getPattern } from '@rdna/pixel';
import { BRAND_HEX, type BrandColor } from './colors';
import { LOGO_PATHS, type LogoVariant } from './logoPaths';
import { patternToSvgDef } from './patternDef';

export type Bg =
  | { kind: 'transparent' }
  | { kind: 'solid'; color: BrandColor }
  | { kind: 'pattern'; pattern: string; fg: BrandColor; bgColor: BrandColor };

export interface ComposeLogoOptions {
  variant: LogoVariant;
  logoColor: BrandColor;
  bg: Bg;
  width: number;
  height: number;
  /** Fraction of the smaller dimension the logo should occupy. Default 0.7. */
  size?: number;
  /** Multiplier on the pattern cell size. 1 = default (canvas/64). Default 1. */
  patternScale?: number;
}

const PATTERN_ID = 'logo-bg-pattern';

/** Pattern cell size at the given canvas + scale — mirrors the math in compose. */
export function getPatternCellSize(
  canvasW: number,
  canvasH: number,
  patternScale: number,
): number {
  return Math.max(1, Math.round((Math.min(canvasW, canvasH) / 64) * patternScale));
}

/** Valid `size` values for a given variant + canvas. Each one produces a
 *  distinct pixel-snapped render. Pass `snapUnit` equal to the pattern
 *  cell size when composing over a pattern bg — otherwise 1 (raw pixels). */
export function getSizeSnapPoints(
  variant: LogoVariant,
  canvasW: number,
  canvasH: number,
  range: { min: number; max: number } = { min: 0.3, max: 0.95 },
  snapUnit: number = 1,
): number[] {
  const logo = LOGO_PATHS[variant];
  const vbMax = Math.max(logo.viewBox.width, logo.viewBox.height);
  const minDim = Math.min(canvasW, canvasH);
  // snappedLogoCell = n * snapUnit  ⇒  size = (n * snapUnit * vbMax) / (minDim * gridUnit)
  const sizePerN = (snapUnit * vbMax) / (logo.gridUnit * minDim);
  const points: number[] = [];
  for (let n = 1; n < 10_000; n++) {
    const sz = n * sizePerN;
    if (sz > range.max) break;
    if (sz >= range.min) points.push(Number(sz.toFixed(4)));
  }
  return points;
}

// Deterministic rule: never render a logo whose color reads poorly against its bg.
function resolveLogoColor(bg: Bg, requested: BrandColor): BrandColor {
  if (bg.kind !== 'solid') return requested;
  if (bg.color === 'cream') return 'ink'; // no yellow-on-cream, no cream-on-cream
  if (bg.color === 'yellow') return 'ink'; // only ink on yellow
  if (bg.color === 'ink') return requested === 'ink' ? 'cream' : requested; // no ink-on-ink
  return requested;
}

// Supreme-box color rule: opposite-tone block behind the logo on patterned bgs.
function pickSupremeBoxColor(
  logoColor: BrandColor,
  patternFg: BrandColor,
  patternBg: BrandColor,
): BrandColor {
  if (logoColor !== 'ink') return 'ink'; // cream/yellow logos → black box
  if (patternBg !== 'ink') return patternBg; // ink logo → lighter pattern bg
  if (patternFg !== 'ink') return patternFg;
  return 'cream';
}

export function composeLogoSvg({
  variant,
  logoColor,
  bg,
  width,
  height,
  size = 0.7,
  patternScale = 1,
}: ComposeLogoOptions): string {
  const logo = LOGO_PATHS[variant];
  const effectiveLogoColor = resolveLogoColor(bg, logoColor);
  const fillHex = BRAND_HEX[effectiveLogoColor];

  // Pattern cell size drives tile rendering AND logo grid snap (pattern-aligned).
  const cellSize = getPatternCellSize(width, height, patternScale);

  // Resolve pattern grid early — it determines whether logo snaps to pattern cells.
  const patternGrid = bg.kind === 'pattern' ? getPattern(bg.pattern) : undefined;
  const hasPattern = bg.kind === 'pattern' && !!patternGrid;
  // Snap unit: aligns logo grid with pattern grid on patterned bgs; 1px otherwise.
  const snapUnit = hasPattern ? cellSize : 1;

  // Target bounding box is `size` of the smaller canvas dim.
  const targetSize = Math.min(width, height) * size;
  const rawScale = Math.min(
    targetSize / logo.viewBox.width,
    targetSize / logo.viewBox.height,
  );
  // Snap so each `logo.gridUnit` renders as a whole multiple of snapUnit.
  const rawLogoCell = rawScale * logo.gridUnit;
  const snappedLogoCell = Math.max(snapUnit, Math.floor(rawLogoCell / snapUnit) * snapUnit);
  const scale = snappedLogoCell / logo.gridUnit;
  const renderedW = logo.viewBox.width * scale;
  const renderedH = logo.viewBox.height * scale;
  // Snap origin too so the logo grid lines up with the pattern grid.
  const tx = Math.round((width - renderedW) / 2 / snapUnit) * snapUnit;
  const ty = Math.round((height - renderedH) / 2 / snapUnit) * snapUnit;

  let defs = '';
  let bgRect = '';
  let boxRect = '';
  let strokeAttrs = '';

  if (bg.kind === 'solid') {
    bgRect = `<rect width="${width}" height="${height}" fill="${BRAND_HEX[bg.color]}"/>`;
  } else if (hasPattern && patternGrid) {
    defs = `<defs>${patternToSvgDef(patternGrid, { id: PATTERN_ID, fg: bg.fg, bg: bg.bgColor, cellSize })}</defs>`;
    bgRect = `<rect width="${width}" height="${height}" fill="url(#${PATTERN_ID})"/>`;

    const accentColor = pickSupremeBoxColor(effectiveLogoColor, bg.fg, bg.bgColor);
    if (variant === 'mark') {
      // Outline hugs the mark's silhouette. paint-order="stroke" draws stroke
      // under the fill so only the outside half remains visible.
      const strokeViewport = cellSize * 4;
      const strokeLocal = strokeViewport / scale;
      strokeAttrs = ` stroke="${BRAND_HEX[accentColor]}" stroke-width="${strokeLocal}" stroke-linejoin="miter" stroke-miterlimit="2" paint-order="stroke"`;
    } else {
      // Wordmark/RadSun get a solid box — outlines around letterforms blob together.
      // Padding ≈ 1 pattern cell so the box reads as a tight ring around the logo.
      const pad = cellSize;
      const bx = tx - pad;
      const by = ty - pad;
      const bw = renderedW + pad * 2;
      const bh = renderedH + pad * 2;
      boxRect = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${BRAND_HEX[accentColor]}"/>`;
    }
  }

  const paths = logo.paths
    .map((d) => `<path d="${d}" fill="${fillHex}"${strokeAttrs}/>`)
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    defs +
    bgRect +
    boxRect +
    `<g transform="translate(${tx} ${ty}) scale(${scale})">${paths}</g>` +
    `</svg>`
  );
}
