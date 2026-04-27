'use client';

// =============================================================================
// StudioExportPanel — Figma-style export settings for the Studio right rail.
//
// Sits below the LAYERS section. Owns its own export config state (format,
// scale, background, grid overlay) and produces:
//   - A downloadable file (PNG or SVG) on "Export"
//   - A clipboard-ready blob/text on "Copy"
//
// PNG path: renders the live dotting foreground canvas into a temp canvas at
// the chosen scale with optional background fill (nearest-neighbor, no smoothing).
// SVG path: serialises the active layer's pixel data to <rect> elements so the
// output is a proper vector, not a rasterised preview.
// =============================================================================

import { useCallback, useState, type MutableRefObject } from 'react';
import {
  ActionButton,
  PropertyRow,
  SegmentedControl,
  Toggle,
} from '@rdna/ctrl';
import { Icon } from '@rdna/radiants/icons/runtime';
import { useData, type DottingRef, type PixelModifyItem } from '@/lib/dotting';
import { CANVAS_BG_COLOR, CANVAS_SIZE } from './constants';
import { StudioRailDropdown } from './StudioRailSection';

type ExportFormat = 'png' | 'svg';
type ExportScale = 1 | 2 | 4 | 8;

interface StudioExportPanelProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  /** Bumped whenever the Dotting instance remounts; passed through to useData
   *  so the subscription re-attaches to the fresh canvas. */
  canvasKey: number;
  className?: string;
}

const SCALE_VALUES: ReadonlyArray<ExportScale> = [1, 2, 4, 8];

function triggerDownload(filename: string, blobOrUrl: Blob | string) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(url);
}

function buildSvgString(
  dataArray: ReadonlyArray<ReadonlyArray<PixelModifyItem>>,
  opts: { size: number; scale: number; bg: string | null },
): string {
  const { size, scale, bg } = opts;
  const w = size * scale;
  const h = size * scale;
  const rects: string[] = [];
  if (bg) rects.push(`<rect width="${size}" height="${size}" fill="${bg}"/>`);

  // Find the data's origin so rect x/y are in 0..size-1 regardless of the
  // dotting worldspace offset.
  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  for (const row of dataArray) {
    for (const cell of row) {
      if (cell.rowIndex < minRow) minRow = cell.rowIndex;
      if (cell.columnIndex < minCol) minCol = cell.columnIndex;
    }
  }
  if (!Number.isFinite(minRow)) minRow = 0;
  if (!Number.isFinite(minCol)) minCol = 0;

  for (const row of dataArray) {
    for (const cell of row) {
      // Skip transparent / background cells when bg is transparent so the SVG
      // stays genuinely see-through.
      if (!cell.color) continue;
      if (!bg && cell.color.toLowerCase() === CANVAS_BG_COLOR.toLowerCase()) continue;
      const x = cell.columnIndex - minCol;
      const y = cell.rowIndex - minRow;
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${cell.color}"/>`);
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${w}" height="${h}" ` +
    `viewBox="0 0 ${size} ${size}" ` +
    `shape-rendering="crispEdges">` +
    rects.join('') +
    `</svg>`
  );
}

async function buildPngBlob(
  fgCanvas: HTMLCanvasElement | undefined,
  opts: { scale: number; bg: string | null },
): Promise<Blob | null> {
  if (!fgCanvas) return null;
  const { scale, bg } = opts;
  const out = document.createElement('canvas');
  out.width = fgCanvas.width * scale;
  out.height = fgCanvas.height * scale;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(fgCanvas, 0, 0, out.width, out.height);
  return new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, 'image/png'),
  );
}

export function StudioExportPanel({
  dottingRef,
  canvasKey,
  className = '',
}: StudioExportPanelProps) {
  const { dataArray } = useData(dottingRef, canvasKey);

  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<ExportScale>(1);
  const [transparent, setTransparent] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const bgFill = transparent ? null : CANVAS_BG_COLOR;

  const handleExport = useCallback(async () => {
    const stamp = Date.now();
    if (format === 'png') {
      const blob = await buildPngBlob(
        dottingRef.current?.getForegroundCanvas() ?? undefined,
        { scale, bg: bgFill },
      );
      if (!blob) return;
      triggerDownload(`studio-${stamp}@${scale}x.png`, blob);
    } else {
      // Try dotting's native SVG export when at 1x + no bg control is needed,
      // so we keep whatever cell styling it emits. Otherwise fall back to the
      // rebuilt SVG so scale / transparent bg are respected.
      if (scale === 1 && transparent) {
        dottingRef.current?.downloadImage({ type: 'svg', isGridVisible: includeGrid });
        return;
      }
      const svg = buildSvgString(dataArray, {
        size: CANVAS_SIZE,
        scale,
        bg: bgFill,
      });
      triggerDownload(`studio-${stamp}@${scale}x.svg`, new Blob([svg], { type: 'image/svg+xml' }));
    }
  }, [format, scale, bgFill, transparent, includeGrid, dottingRef, dataArray]);

  const handleCopy = useCallback(async () => {
    try {
      if (format === 'png') {
        const blob = await buildPngBlob(
          dottingRef.current?.getForegroundCanvas() ?? undefined,
          { scale, bg: bgFill },
        );
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } else {
        const svg = buildSvgString(dataArray, {
          size: CANVAS_SIZE,
          scale,
          bg: bgFill,
        });
        await navigator.clipboard.writeText(svg);
      }
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1400);
    } catch (err) {
      console.error('copy failed', err);
      setCopyState('failed');
      window.setTimeout(() => setCopyState('idle'), 1800);
    }
  }, [format, scale, bgFill, dottingRef, dataArray]);

  const copyLabel =
    copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy';

  return (
    <StudioRailDropdown
      title="EXPORT"
      collapsedIcon={<Icon name="download" />}
      collapsedTooltip="Export"
      className={className}
    >
      <PropertyRow
        label="FORMAT"
        chrome="flush"
        size="xl"
        divider={false}
        valueClassName="!gap-px !p-0"
      >
        <SegmentedControl
          size="sm"
          value={format}
          chrome="flush"
          stretch
          onChange={(v) => setFormat(v as ExportFormat)}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'svg', label: 'SVG' },
          ]}
        />
      </PropertyRow>

      <PropertyRow
        label="SCALE"
        chrome="flush"
        size="xl"
        divider={false}
        valueClassName="!gap-px !p-0"
      >
        <SegmentedControl
          size="sm"
          value={String(scale)}
          chrome="flush"
          stretch
          onChange={(v) => {
            const n = Number(v) as ExportScale;
            if (SCALE_VALUES.includes(n)) setScale(n);
          }}
          options={SCALE_VALUES.map((s) => ({
            value: String(s),
            label: `${s}×`,
          }))}
        />
      </PropertyRow>

      <PropertyRow label="TRANSPARENT" chrome="flush" size="xl" divider={false}>
        <Toggle value={transparent} onChange={setTransparent} size="sm" />
      </PropertyRow>

      <PropertyRow label="GRID OVERLAY" chrome="flush" size="xl" divider={false}>
        <Toggle
          value={includeGrid}
          onChange={setIncludeGrid}
          size="sm"
          disabled={format === 'svg'}
        />
      </PropertyRow>

      <div
        className="flex min-h-6 max-h-6 items-stretch gap-px bg-ink"
        role="group"
        aria-label="Export actions"
      >
        <ActionButton
          label={copyLabel}
          icon={<Icon name="copy" />}
          chrome="flush"
          size="md"
          onClick={handleCopy}
          className="!min-h-6 !max-h-6"
        />
        <ActionButton
          label="Export"
          icon={<Icon name="download" />}
          chrome="flush"
          size="md"
          onClick={handleExport}
          className="!min-h-6 !max-h-6"
        />
      </div>
    </StudioRailDropdown>
  );
}
