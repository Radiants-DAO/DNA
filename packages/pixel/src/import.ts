import { bitsToGrid } from './core.js';
import type { PixelGrid } from './types.js';

export interface ImportOptions {
  size: number;
  snapStep?: 1 | 0.5;
}

export interface ImportReport {
  snappedValues: number;
  offGridValues: number[];
  hadCurves: boolean;
  hadDiagonalSegments: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const ATTRIBUTE_RE = /([\w:-]+)\s*=\s*(['"])(.*?)\2/g;
const SHAPE_RE = /<(path|rect)\b([^>]*)\/?>/gi;
const TOKEN_RE = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
const CURVE_COMMAND_RE = /[CcSsQqTtAa]/;
const EPSILON = 1e-9;
const SNAP_TOLERANCE = 0.01;

export function svgToGrid(
  name: string,
  svg: string,
  options: ImportOptions,
): { grid: PixelGrid; report: ImportReport } {
  validateOptions(options);

  const report: ImportReport = {
    snappedValues: 0,
    offGridValues: [],
    hadCurves: false,
    hadDiagonalSegments: false,
  };
  const offGridSeen = new Set<string>();
  const snapStep = options.snapStep ?? 0.5;
  const viewBox = parseViewBox(svg);
  const polygons = collectPolygons(svg, viewBox, options.size, snapStep, report, offGridSeen);

  const bits: string[] = Array(options.size * options.size).fill('0');

  for (let y = 0; y < options.size; y++) {
    for (let x = 0; x < options.size; x++) {
      const sample = { x: x + 1, y: y + 1 };
      if (polygons.some((polygon) => pointInPolygon(sample, polygon))) {
        bits[y * options.size + x] = '1';
      }
    }
  }

  const grid = bitsToGrid(name, options.size, options.size, bits.join(''));
  return { grid, report };
}

function validateOptions(options: ImportOptions): void {
  if (!Number.isInteger(options.size) || options.size <= 0) {
    throw new Error(`size must be a positive integer, received ${options.size}`);
  }

  if (
    options.snapStep !== undefined &&
    options.snapStep !== 1 &&
    options.snapStep !== 0.5
  ) {
    throw new Error(`snapStep must be 1 or 0.5, received ${options.snapStep}`);
  }
}

function parseViewBox(svg: string): ViewBox {
  const match = svg.match(/<svg\b[^>]*\bviewBox=(['"])(.*?)\1/i);
  if (!match) {
    return { minX: 0, minY: 0, width: 1, height: 1 };
  }

  const parts = match[2]
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value));

  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid viewBox: ${match[2]}`);
  }

  const [minX, minY, width, height] = parts;
  if (width <= 0 || height <= 0) {
    throw new Error(`viewBox width and height must be positive: ${match[2]}`);
  }

  return { minX, minY, width, height };
}

function collectPolygons(
  svg: string,
  viewBox: ViewBox,
  size: number,
  snapStep: 1 | 0.5,
  report: ImportReport,
  offGridSeen: Set<string>,
): Point[][] {
  const polygons: Point[][] = [];
  SHAPE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SHAPE_RE.exec(svg)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2]);

    if (attrs.fill === 'none') {
      continue;
    }

    if (tag === 'rect') {
      polygons.push(
        rectToPolygon(attrs, viewBox, size, snapStep, report, offGridSeen),
      );
      continue;
    }

    if (tag === 'path') {
      const d = attrs.d;
      if (!d) {
        continue;
      }

      polygons.push(
        ...pathToPolygons(d, viewBox, size, snapStep, report, offGridSeen),
      );
    }
  }

  return polygons;
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTRIBUTE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ATTRIBUTE_RE.exec(source)) !== null) {
    attrs[match[1]] = match[3];
  }

  return attrs;
}

function rectToPolygon(
  attrs: Record<string, string>,
  viewBox: ViewBox,
  size: number,
  snapStep: 1 | 0.5,
  report: ImportReport,
  offGridSeen: Set<string>,
): Point[] {
  const x = normalizeCoordinate(
    parseRequiredNumber(attrs.x ?? '0', 'rect.x'),
    'x',
    false,
    viewBox,
    size,
    snapStep,
    report,
    offGridSeen,
  );
  const y = normalizeCoordinate(
    parseRequiredNumber(attrs.y ?? '0', 'rect.y'),
    'y',
    false,
    viewBox,
    size,
    snapStep,
    report,
    offGridSeen,
  );
  const width = normalizeCoordinate(
    parseRequiredNumber(attrs.width, 'rect.width'),
    'x',
    true,
    viewBox,
    size,
    snapStep,
    report,
    offGridSeen,
  );
  const height = normalizeCoordinate(
    parseRequiredNumber(attrs.height, 'rect.height'),
    'y',
    true,
    viewBox,
    size,
    snapStep,
    report,
    offGridSeen,
  );

  if (width <= 0 || height <= 0) {
    throw new Error(`rect width and height must be positive, received ${width}×${height}`);
  }

  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

function pathToPolygons(
  d: string,
  viewBox: ViewBox,
  size: number,
  snapStep: 1 | 0.5,
  report: ImportReport,
  offGridSeen: Set<string>,
): Point[][] {
  if (CURVE_COMMAND_RE.test(d)) {
    report.hadCurves = true;
    throw new Error('Curved path commands are not supported');
  }

  const tokens = d.match(TOKEN_RE) ?? [];
  const polygons: Point[][] = [];
  let command = '';
  let index = 0;
  let current: Point | null = null;
  let start: Point | null = null;
  let polygon: Point[] = [];

  const readNumber = (axis: 'x' | 'y'): number => {
    const token = tokens[index];
    if (token === undefined || isCommand(token)) {
      throw new Error(`Expected ${axis} coordinate in path data`);
    }

    index += 1;
    return normalizeCoordinate(
      Number.parseFloat(token),
      axis,
      false,
      viewBox,
      size,
      snapStep,
      report,
      offGridSeen,
    );
  };

  const ensureCurrent = (): Point => {
    if (!current) {
      throw new Error('Path data must begin with a move command');
    }

    return current;
  };

  const appendPoint = (point: Point): void => {
    const last = polygon[polygon.length - 1];
    if (!last || !pointsEqual(last, point)) {
      polygon.push(point);
    }
  };

  const moveTo = (point: Point): void => {
    if (polygon.length >= 3) {
      polygons.push(polygon);
    }

    polygon = [];
    current = point;
    start = point;
    appendPoint(point);
  };

  const lineTo = (point: Point): void => {
    const from = ensureCurrent();
    if (!nearlyEqual(from.x, point.x) && !nearlyEqual(from.y, point.y)) {
      report.hadDiagonalSegments = true;
      throw new Error('Diagonal path segments are not supported');
    }

    appendPoint(point);
    current = point;
  };

  const closePolygon = (): void => {
    if (!current || !start) {
      return;
    }

    if (!pointsEqual(current, start)) {
      lineTo(start);
    }

    if (polygon.length >= 3) {
      polygons.push(polygon);
    }

    polygon = [];
    current = start;
  };

  while (index < tokens.length) {
    const token = tokens[index];

    if (isCommand(token)) {
      command = token;
      index += 1;
    } else if (!command) {
      throw new Error('Path data is missing an initial command');
    }

    switch (command) {
      case 'M':
      case 'm': {
        const origin = current ?? { x: 0, y: 0 };
        const x = readNumber('x');
        const y = readNumber('y');
        const point =
          command === 'm'
            ? { x: origin.x + x, y: origin.y + y }
            : { x, y };
        moveTo(point);
        command = command === 'm' ? 'l' : 'L';
        break;
      }
      case 'L':
      case 'l': {
        const origin = ensureCurrent();
        const x = readNumber('x');
        const y = readNumber('y');
        const point =
          command === 'l'
            ? { x: origin.x + x, y: origin.y + y }
            : { x, y };
        lineTo(point);
        break;
      }
      case 'H':
      case 'h': {
        const origin = ensureCurrent();
        const x = readNumber('x');
        const point = command === 'h' ? { x: origin.x + x, y: origin.y } : { x, y: origin.y };
        lineTo(point);
        break;
      }
      case 'V':
      case 'v': {
        const origin = ensureCurrent();
        const y = readNumber('y');
        const point = command === 'v' ? { x: origin.x, y: origin.y + y } : { x: origin.x, y };
        lineTo(point);
        break;
      }
      case 'Z':
      case 'z': {
        closePolygon();
        command = '';
        break;
      }
      default:
        throw new Error(`Unsupported path command: ${command}`);
    }
  }

  if (polygon.length >= 3) {
    polygons.push(polygon);
  }

  return polygons;
}

function normalizeCoordinate(
  value: number,
  axis: 'x' | 'y',
  isLength: boolean,
  viewBox: ViewBox,
  size: number,
  snapStep: 1 | 0.5,
  report: ImportReport,
  offGridSeen: Set<string>,
): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${axis} coordinate: ${value}`);
  }

  const scale = axis === 'x' ? size / viewBox.width : size / viewBox.height;
  const offset = axis === 'x' ? viewBox.minX : viewBox.minY;
  const scaled = isLength ? value * scale : (value - offset) * scale;
  const snapped = roundToStep(scaled, snapStep);
  const delta = Math.abs(scaled - snapped);

  if (delta > EPSILON) {
    if (delta <= SNAP_TOLERANCE) {
      report.snappedValues += 1;
    } else {
      const key = value.toString();
      if (!offGridSeen.has(key)) {
        offGridSeen.add(key);
        report.offGridValues.push(value);
      }
    }
  }

  return snapped;
}

function parseRequiredNumber(value: string | undefined, label: string): number {
  const parsed = Number.parseFloat(value ?? '');
  if (!Number.isFinite(parsed)) {
    throw new Error(`Missing or invalid ${label}`);
  }

  return parsed;
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let winding = 0;

  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];

    if (pointOnSegment(point, start, end)) {
      return true;
    }

    if (start.y <= point.y) {
      if (end.y > point.y && isLeft(start, end, point) > 0) {
        winding += 1;
      }
    } else if (end.y <= point.y && isLeft(start, end, point) < 0) {
      winding -= 1;
    }
  }

  return winding !== 0;
}

function pointOnSegment(point: Point, start: Point, end: Point): boolean {
  const cross = isLeft(start, end, point);
  if (Math.abs(cross) > EPSILON) {
    return false;
  }

  return (
    point.x >= Math.min(start.x, end.x) - EPSILON &&
    point.x <= Math.max(start.x, end.x) + EPSILON &&
    point.y >= Math.min(start.y, end.y) - EPSILON &&
    point.y <= Math.max(start.y, end.y) + EPSILON
  );
}

function isLeft(start: Point, end: Point, point: Point): number {
  return (
    (end.x - start.x) * (point.y - start.y) -
    (point.x - start.x) * (end.y - start.y)
  );
}

function roundToStep(value: number, step: number): number {
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(6));
}

function isCommand(token: string): boolean {
  return /^[a-zA-Z]$/.test(token);
}

function pointsEqual(a: Point, b: Point): boolean {
  return nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y);
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}
