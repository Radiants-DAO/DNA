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

type FillRule = 'nonzero' | 'evenodd';

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

interface Shape {
  fillRule: FillRule;
  polygons: Point[][];
}

interface RotateTransform {
  angle: number;
  cx: number;
  cy: number;
}

interface RasterizeResult {
  bits: string;
  boundaryHits: number;
}

interface SampleOffset {
  x: number;
  y: number;
}

const ATTRIBUTE_RE = /([\w:-]+)\s*=\s*(['"])(.*?)\2/g;
const TAG_RE = /<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g;
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
  const shapes = collectShapes(svg, viewBox, options.size, snapStep, report, offGridSeen);
  const preferredOffset = detectSampleOffsets(shapes);
  const candidates = buildSampleOffsetCandidates(preferredOffset)
    .map((sampleOffset) => rasterizeShapes(shapes, options.size, sampleOffset))
    .sort((left, right) => left.boundaryHits - right.boundaryHits);
  const chosen = candidates[0];

  const grid = bitsToGrid(name, options.size, options.size, chosen.bits);
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

function collectShapes(
  svg: string,
  viewBox: ViewBox,
  size: number,
  snapStep: 1 | 0.5,
  report: ImportReport,
  offGridSeen: Set<string>,
): Shape[] {
  const shapes: Shape[] = [];
  const stack: Array<{ tagName: string; fillRule: FillRule }> = [];
  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_RE.exec(svg)) !== null) {
    const rawTag = match[0];
    const tag = match[1].toLowerCase();

    if (rawTag.startsWith('</')) {
      popTagContext(stack, tag);
      continue;
    }

    const attrs = parseAttributes(match[2]);
    const fillRule = resolveFillRule(attrs['fill-rule'], stack.at(-1)?.fillRule);
    const isSelfClosing = /\/\s*>$/.test(rawTag);

    if (attrs.fill === 'none') {
      if (!isSelfClosing) {
        stack.push({ tagName: tag, fillRule });
      }

      continue;
    }

    if (tag === 'rect') {
      shapes.push({
        fillRule,
        polygons: [
          rectToPolygon(attrs, viewBox, size, snapStep, report, offGridSeen),
        ],
      });
    } else if (tag === 'path') {
      const d = attrs.d;
      if (d) {
        shapes.push({
          fillRule,
          polygons: pathToPolygons(d, viewBox, size, snapStep, report, offGridSeen),
        });
      }
    }

    if (!isSelfClosing) {
      stack.push({ tagName: tag, fillRule });
    }
  }

  return shapes;
}

function detectSampleOffsets(shapes: readonly Shape[]): SampleOffset {
  let integerAlignedX = 0;
  let halfAlignedX = 0;
  let integerAlignedY = 0;
  let halfAlignedY = 0;

  for (const shape of shapes) {
    for (const polygon of shape.polygons) {
      for (const point of polygon) {
        tallyCoordinate(point.x, 'x');
        tallyCoordinate(point.y, 'y');
      }
    }
  }

  return {
    x: halfAlignedX > integerAlignedX ? 1 : 0.5,
    y: halfAlignedY > integerAlignedY ? 1 : 0.5,
  };

  function tallyCoordinate(value: number, axis: 'x' | 'y'): void {
    const fractional = Math.abs(value - Math.trunc(value));

    if (fractional <= EPSILON) {
      if (axis === 'x') {
        integerAlignedX += 1;
      } else {
        integerAlignedY += 1;
      }
      return;
    }

    if (Math.abs(fractional - 0.5) <= EPSILON) {
      if (axis === 'x') {
        halfAlignedX += 1;
      } else {
        halfAlignedY += 1;
      }
    }
  }
}

function buildSampleOffsetCandidates(preferred: SampleOffset): SampleOffset[] {
  const candidates: SampleOffset[] = [preferred];
  const fallback = [0.5, 1] as const;

  for (const x of fallback) {
    for (const y of fallback) {
      if (x === preferred.x && y === preferred.y) {
        continue;
      }

      candidates.push({ x, y });
    }
  }

  return candidates;
}

function rasterizeShapes(
  shapes: readonly Shape[],
  size: number,
  sampleOffset: SampleOffset,
): RasterizeResult {
  const bits: string[] = Array(size * size).fill('0');
  let boundaryHits = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sample = { x: x + sampleOffset.x, y: y + sampleOffset.y };
      let isInside = false;
      let isOnBoundary = false;

      for (const shape of shapes) {
        const result = pointInShape(sample, shape);
        if (result.onBoundary) {
          isOnBoundary = true;
        }

        if (result.inside) {
          isInside = true;
          break;
        }
      }

      if (isInside) {
        bits[y * size + x] = '1';
      }

      if (isOnBoundary) {
        boundaryHits += 1;
      }
    }
  }

  return {
    bits: bits.join(''),
    boundaryHits,
  };
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
  const rawX = parseRequiredNumber(attrs.x ?? '0', 'rect.x');
  const rawY = parseRequiredNumber(attrs.y ?? '0', 'rect.y');
  const rawWidth = parseRequiredNumber(attrs.width, 'rect.width');
  const rawHeight = parseRequiredNumber(attrs.height, 'rect.height');

  if (rawWidth <= 0 || rawHeight <= 0) {
    throw new Error(`rect width and height must be positive, received ${rawWidth}×${rawHeight}`);
  }

  const polygon = [
    { x: rawX, y: rawY },
    { x: rawX + rawWidth, y: rawY },
    { x: rawX + rawWidth, y: rawY + rawHeight },
    { x: rawX, y: rawY + rawHeight },
  ];
  const transformed = applyRectTransform(polygon, attrs.transform);

  return transformed.map((point) => ({
    x: normalizeCoordinate(
      point.x,
      'x',
      false,
      viewBox,
      size,
      snapStep,
      report,
      offGridSeen,
    ),
    y: normalizeCoordinate(
      point.y,
      'y',
      false,
      viewBox,
      size,
      snapStep,
      report,
      offGridSeen,
    ),
  }));
}

function applyRectTransform(points: Point[], transform: string | undefined): Point[] {
  const rotate = parseRotateTransform(transform);
  if (!rotate) {
    return points;
  }

  return points.map((point) => rotatePoint(point, rotate));
}

function parseRotateTransform(transform: string | undefined): RotateTransform | null {
  if (!transform) {
    return null;
  }

  const match = transform.match(
    /^\s*rotate\(\s*([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)\s+([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)\s+([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)\s*\)\s*$/u,
  );
  if (!match) {
    return null;
  }

  return {
    angle: Number.parseFloat(match[1]),
    cx: Number.parseFloat(match[2]),
    cy: Number.parseFloat(match[3]),
  };
}

function rotatePoint(point: Point, transform: RotateTransform): Point {
  const angle = ((transform.angle % 360) + 360) % 360;
  const dx = point.x - transform.cx;
  const dy = point.y - transform.cy;

  if (nearlyEqual(angle, 0)) {
    return point;
  }

  if (nearlyEqual(angle, 90)) {
    return {
      x: transform.cx - dy,
      y: transform.cy + dx,
    };
  }

  if (nearlyEqual(angle, 180)) {
    return {
      x: transform.cx - dx,
      y: transform.cy - dy,
    };
  }

  if (nearlyEqual(angle, 270)) {
    return {
      x: transform.cx + dy,
      y: transform.cy - dx,
    };
  }

  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: transform.cx + dx * cos - dy * sin,
    y: transform.cy + dx * sin + dy * cos,
  };
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

function parseFillRule(value: string | undefined): FillRule {
  if (value === 'evenodd') {
    return 'evenodd';
  }

  return 'nonzero';
}

function resolveFillRule(
  localValue: string | undefined,
  inheritedValue: FillRule | undefined,
): FillRule {
  if (localValue === 'inherit') {
    return inheritedValue ?? 'nonzero';
  }

  if (localValue === undefined) {
    return inheritedValue ?? 'nonzero';
  }

  return parseFillRule(localValue);
}

function popTagContext(
  stack: Array<{ tagName: string; fillRule: FillRule }>,
  tagName: string,
): void {
  if (stack.length === 0) {
    return;
  }

  if (stack.at(-1)?.tagName === tagName) {
    stack.pop();
    return;
  }

  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].tagName === tagName) {
      stack.length = i;
      return;
    }
  }
}

function pointInShape(point: Point, shape: Shape): { inside: boolean; onBoundary: boolean } {
  if (shape.fillRule === 'evenodd') {
    let crossings = 0;
    let onBoundary = false;

    for (const polygon of shape.polygons) {
      const winding = windingNumber(point, polygon);
      if (winding.onBoundary) {
        onBoundary = true;
        break;
      }

      if (winding.value !== 0) {
        crossings += 1;
      }
    }

    if (onBoundary) {
      return { inside: true, onBoundary: true };
    }

    return { inside: crossings % 2 === 1, onBoundary: false };
  }

  let totalWinding = 0;

  for (const polygon of shape.polygons) {
    const winding = windingNumber(point, polygon);
    if (winding.onBoundary) {
      return { inside: true, onBoundary: true };
    }

    totalWinding += winding.value;
  }

  return { inside: totalWinding !== 0, onBoundary: false };
}

function windingNumber(point: Point, polygon: Point[]): { value: number; onBoundary: boolean } {
  let winding = 0;

  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];

    if (pointOnSegment(point, start, end)) {
      return { value: 0, onBoundary: true };
    }

    if (start.y <= point.y) {
      if (end.y > point.y && isLeft(start, end, point) > 0) {
        winding += 1;
      }
    } else if (end.y <= point.y && isLeft(start, end, point) < 0) {
      winding -= 1;
    }
  }

  return { value: winding, onBoundary: false };
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
