import 'server-only';

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { cache } from 'react';
import {
  convertSvgIconToPixelGrid,
  type ConvertedSvgIcon,
} from '@rdna/pixel/icons';
import { getAcceptedIconConversionIssue, type AcceptedIconConversionIssue } from './icon-conversion-review-issues';

export interface IconConversionReviewEntry {
  readonly key: string;
  readonly name: string;
  readonly fileName: string;
  readonly iconSet: 16 | 24;
  readonly sourceSvg: string;
  readonly sourceSvgDataUri: string;
  readonly converted: ConvertedSvgIcon | null;
  readonly trimPreview: IconTrimPreview | null;
  readonly diagnosis: IconConversionDiagnosis;
  readonly error: string | null;
  readonly acceptedIssue: AcceptedIconConversionIssue | null;
}

type CropEdge = 'top' | 'right' | 'bottom' | 'left';

export interface IconTrimPreview {
  readonly applied: boolean;
  readonly width: number;
  readonly height: number;
  readonly bits: string;
  readonly croppedPixelCount: number;
  readonly croppedEdges: readonly CropEdge[];
}

interface AxisProfile {
  int: number;
  half: number;
  other: number;
}

interface CoordinateProfile {
  readonly x: AxisProfile;
  readonly y: AxisProfile;
}

export interface IconConversionDiagnosis {
  readonly code:
    | 'clean-grid'
    | 'diagonal-source'
    | 'mixed-axis-near-grid'
    | 'near-grid-float-export'
    | 'off-grid-source'
    | 'parse-error';
  readonly summary: string;
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function getIconDirectory(iconSet: 16 | 24): string {
  return resolve(REPO_ROOT, 'packages', 'radiants', 'assets', 'icons', `${iconSet}px`);
}

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function countFilledPixels(bits: string): number {
  let total = 0;

  for (const bit of bits) {
    if (bit === '1') {
      total += 1;
    }
  }

  return total;
}

function buildTrimPreview(
  converted: ConvertedSvgIcon | null,
  iconSet: 16 | 24,
): IconTrimPreview | null {
  if (!converted) {
    return null;
  }

  if (iconSet !== 24) {
    return {
      applied: false,
      width: converted.width,
      height: converted.height,
      bits: converted.bits,
      croppedPixelCount: 0,
      croppedEdges: [],
    };
  }

  return {
    applied: true,
    width: converted.width,
    height: converted.height,
    bits: converted.bits,
    croppedPixelCount: 0,
    croppedEdges: [],
  };
}

function emptyAxisProfile(): AxisProfile {
  return { int: 0, half: 0, other: 0 };
}

function bucketCoordinate(value: number): keyof AxisProfile {
  const fractional = Math.abs(value - Math.trunc(value));

  if (fractional <= 0.01) {
    return 'int';
  }

  if (Math.abs(fractional - 0.5) <= 0.01) {
    return 'half';
  }

  return 'other';
}

function analyzeCoordinateProfile(sourceSvg: string): CoordinateProfile {
  const x = emptyAxisProfile();
  const y = emptyAxisProfile();
  const attrPattern = /<rect\b[^>]*\b(x|y|width|height)=['"]([^'"]+)['"]/gi;
  const pathPattern = /\bd=(['"])(.*?)\1/gi;
  const tokenPattern = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;

  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrPattern.exec(sourceSvg)) !== null) {
    const value = Number.parseFloat(attrMatch[2]);
    if (!Number.isFinite(value)) {
      continue;
    }

    const axis = attrMatch[1] === 'x' || attrMatch[1] === 'width' ? x : y;
    axis[bucketCoordinate(value)] += 1;
  }

  let pathMatch: RegExpExecArray | null;
  while ((pathMatch = pathPattern.exec(sourceSvg)) !== null) {
    const tokens = pathMatch[2].match(tokenPattern) ?? [];
    let mode: 'pair' | 'single' = 'pair';
    let nextAxis: 'x' | 'y' = 'x';

    for (const token of tokens) {
      if (/^[a-zA-Z]$/u.test(token)) {
        const command = token.toUpperCase();
        if (command === 'H') {
          mode = 'single';
          nextAxis = 'x';
        } else if (command === 'V') {
          mode = 'single';
          nextAxis = 'y';
        } else if (command === 'M' || command === 'L') {
          mode = 'pair';
          nextAxis = 'x';
        }
        continue;
      }

      const value = Number.parseFloat(token);
      if (!Number.isFinite(value)) {
        continue;
      }

      if (nextAxis === 'x') {
        x[bucketCoordinate(value)] += 1;
      } else {
        y[bucketCoordinate(value)] += 1;
      }

      if (mode === 'pair') {
        nextAxis = nextAxis === 'x' ? 'y' : 'x';
      }
    }
  }

  return { x, y };
}

function dominantAxisMode(axis: AxisProfile): 'int' | 'half' | 'other' {
  if (axis.int >= axis.half && axis.int >= axis.other) {
    return 'int';
  }

  if (axis.half >= axis.other) {
    return 'half';
  }

  return 'other';
}

function diagnoseEntry(
  sourceSvg: string,
  converted: ConvertedSvgIcon | null,
  error: string | null,
): IconConversionDiagnosis {
  if (!converted) {
    return {
      code: 'parse-error',
      summary: error ?? 'conversion failed',
    };
  }

  if (converted.report.offGridValues.length > 0) {
    return {
      code: 'off-grid-source',
      summary: 'source SVG contains real off-grid coordinates; auto-conversion is lossy and likely needs redraw or an authored override',
    };
  }

  if (converted.report.hadDiagonalSegments) {
    return {
      code: 'diagonal-source',
      summary: 'source SVG contains diagonal geometry; conversion is heuristic and may need manual cleanup',
    };
  }

  const profile = analyzeCoordinateProfile(sourceSvg);
  const xMode = dominantAxisMode(profile.x);
  const yMode = dominantAxisMode(profile.y);

  if (converted.report.snappedValues > 0 && xMode !== 'other' && yMode !== 'other' && xMode !== yMode) {
    return {
      code: 'mixed-axis-near-grid',
      summary: `source SVG is near-grid but uses mixed axis origins (${xMode} x / ${yMode} y); conversion depends on axis-specific sampling`,
    };
  }

  if (converted.report.snappedValues > 0) {
    return {
      code: 'near-grid-float-export',
      summary: 'source SVG is near-grid but float-exported; conversion is snapped and may still need manual cleanup',
    };
  }

  return {
    code: 'clean-grid',
    summary: 'source SVG is grid-clean',
  };
}

async function readReviewEntriesForSet(
  iconSet: 16 | 24,
): Promise<readonly IconConversionReviewEntry[]> {
  const directory = getIconDirectory(iconSet);
  const fileNames = (await readdir(directory))
    .filter((fileName) => fileName.endsWith('.svg'))
    .sort();

  return Promise.all(
    fileNames.map(async (fileName) => {
      const sourceSvg = await readFile(resolve(directory, fileName), 'utf8');
      const name = fileName.replace(/\.svg$/u, '');

      try {
        const converted = convertSvgIconToPixelGrid(name, sourceSvg, {
          size: iconSet,
          iconSet,
          snapStep: 0.5,
        });

        return {
          key: `${iconSet}:${name}`,
          name,
          fileName,
          iconSet,
          sourceSvg,
          sourceSvgDataUri: toSvgDataUri(sourceSvg),
          converted,
          trimPreview: buildTrimPreview(converted, iconSet),
          diagnosis: diagnoseEntry(sourceSvg, converted, null),
          error: null,
          acceptedIssue: getAcceptedIconConversionIssue({
            name,
            iconSet,
            converted,
            error: null,
          }),
        } satisfies IconConversionReviewEntry;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          key: `${iconSet}:${name}`,
          name,
          fileName,
          iconSet,
          sourceSvg,
          sourceSvgDataUri: toSvgDataUri(sourceSvg),
          converted: null,
          trimPreview: null,
          diagnosis: diagnoseEntry(sourceSvg, null, message),
          error: message,
          acceptedIssue: null,
        } satisfies IconConversionReviewEntry;
      }
    }),
  );
}

export const getIconConversionReviewEntries = cache(async () => {
  const [icons16, icons24] = await Promise.all([
    readReviewEntriesForSet(16),
    readReviewEntriesForSet(24),
  ]);

  return [...icons16, ...icons24].sort((a, b) => {
    return compareEntrySeverity(a) - compareEntrySeverity(b) ||
      a.iconSet - b.iconSet ||
      a.name.localeCompare(b.name);
  });
});

export async function getIconConversionReviewSummary() {
  const entries = await getIconConversionReviewEntries();
  const succeeded = entries.filter((entry) => entry.converted !== null);
  const failed = entries.filter((entry) => entry.error !== null);
  const snapped = succeeded.filter((entry) => entry.converted!.report.snappedValues > 0);
  const offGrid = succeeded.filter(
    (entry) => entry.converted!.report.offGridValues.length > 0,
  );

  return {
    total: entries.length,
    succeeded: succeeded.length,
    failed: failed.length,
    snapped: snapped.length,
    offGrid: offGrid.length,
    pixelsFilled: succeeded.reduce(
      (total, entry) => total + countFilledPixels(entry.converted!.bits),
      0,
    ),
  };
}

function compareEntrySeverity(entry: IconConversionReviewEntry): number {
  if (!entry.converted) {
    return 0;
  }

  if (entry.acceptedIssue) {
    return 5;
  }

  if (entry.converted.report.offGridValues.length > 0) {
    return 1;
  }

  if (entry.converted.report.hadDiagonalSegments) {
    return 2;
  }

  if (entry.converted.report.snappedValues > 0) {
    return 3;
  }

  return 4;
}
