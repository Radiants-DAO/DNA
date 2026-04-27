import type { ImportReport } from '../import.ts';
import type { PixelGrid } from '../types.ts';

export interface PixelIconDefinition extends PixelGrid {}

export interface PreparedPixelIcon extends PixelIconDefinition {
  readonly path: string;
  readonly maskImage: string;
}

export interface SvgIconConversionOptions {
  readonly size: number;
  readonly snapStep?: 1 | 0.5;
  readonly iconSet?: 16 | 24;
}

export interface ConvertedSvgIcon extends PreparedPixelIcon {
  readonly iconSet?: 16 | 24;
  readonly report: ImportReport;
}
