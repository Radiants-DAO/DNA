'use client';

import { bitsToPath } from '@rdna/pixel';
import { Button } from '@rdna/radiants/components/core';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  formatIconConversionIssueClipboard,
  getIconConversionReviewState,
  type AcceptedIconConversionIssue,
  type ReviewAction,
} from '@/lib/icon-conversion-review-issues';

interface ConvertedReport {
  readonly snappedValues: number;
  readonly offGridValues: readonly number[];
  readonly hadCurves: boolean;
  readonly hadDiagonalSegments: boolean;
}

interface ConvertedIcon {
  readonly bits: string;
  readonly width: number;
  readonly height: number;
  readonly report: ConvertedReport;
}

interface TrimPreview {
  readonly applied: boolean;
  readonly width: number;
  readonly height: number;
  readonly bits: string;
  readonly croppedPixelCount: number;
  readonly croppedEdges: readonly string[];
}

export interface IconConversionReviewClientEntry {
  readonly key: string;
  readonly name: string;
  readonly fileName: string;
  readonly iconSet: 16 | 24;
  readonly sourceSvgDataUri: string;
  readonly converted: ConvertedIcon | null;
  readonly trimPreview: TrimPreview | null;
  readonly diagnosis: {
    readonly code: string;
    readonly summary: string;
  };
  readonly error: string | null;
  readonly acceptedIssue: AcceptedIconConversionIssue | null;
}

interface IconConversionReviewClientProps {
  readonly entries: readonly IconConversionReviewClientEntry[];
}

const ACTION_LABELS: Record<ReviewAction, string> = {
  delete: 'Delete Both',
  incorrect: 'Incorrect',
};
const STAGE_SIZE = 320;

function formatReviewStateLabel(
  state: ReturnType<typeof getIconConversionReviewState>,
): string {
  if (state === 'delete') {
    return ACTION_LABELS.delete;
  }

  if (state === 'incorrect') {
    return ACTION_LABELS.incorrect;
  }

  if (state === 'accepted') {
    return 'Accepted Exception';
  }

  return 'Implicit OK';
}

function PixelPreview({
  bits,
  size,
}: {
  bits: string;
  size: number;
}) {
  const path = bitsToPath(bits, size, size);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      className="w-full h-full text-main"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={path} fill="currentColor" shapeRendering="crispEdges" />
    </svg>
  );
}

function StageFrame({
  gridSize,
  children,
}: {
  gridSize: number;
  children: ReactNode;
}) {
  const cellSize = STAGE_SIZE / gridSize;

  return (
    <div
      className="relative shrink-0 overflow-hidden border border-rule bg-page"
      style={{ width: STAGE_SIZE, height: STAGE_SIZE }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(to right, color-mix(in srgb, var(--color-rule) 55%, transparent) 1px, transparent 1px)',
            'linear-gradient(to bottom, color-mix(in srgb, var(--color-rule) 55%, transparent) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: `${cellSize}px ${cellSize}px`,
          backgroundPosition: '-0.5px -0.5px',
        }}
      />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

function summarizeEntries(entries: readonly IconConversionReviewClientEntry[]) {
  const names16 = new Set(entries.filter((entry) => entry.iconSet === 16).map((entry) => entry.name));
  const names24 = new Set(entries.filter((entry) => entry.iconSet === 24).map((entry) => entry.name));
  const cropRisk24 = entries.filter(
    (entry) => entry.iconSet === 24 && (entry.trimPreview?.croppedPixelCount ?? 0) > 0,
  ).length;

  let overlap = 0;
  for (const name of names16) {
    if (names24.has(name)) {
      overlap += 1;
    }
  }

  return {
    count16: names16.size,
    count24: names24.size,
    overlap,
    cropRisk24,
  };
}

function findNextIndex(
  entries: readonly IconConversionReviewClientEntry[],
  currentIndex: number,
  step: 1 | -1,
): number {
  if (entries.length === 0) {
    return 0;
  }

  const next = currentIndex + step;

  if (next < 0) {
    return 0;
  }

  if (next >= entries.length) {
    return entries.length - 1;
  }

  return next;
}

export function IconConversionReviewClient({
  entries,
}: IconConversionReviewClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, ReviewAction>>({});
  const [copied, setCopied] = useState(false);
  const current = entries[currentIndex] ?? null;
  const summary = useMemo(() => summarizeEntries(entries), [entries]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (!current) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentIndex((index) => findNextIndex(entries, index, -1));
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentIndex((index) => findNextIndex(entries, index, 1));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setDecisions((prev) => ({ ...prev, [current.key]: 'incorrect' }));
        setCurrentIndex((index) => findNextIndex(entries, index, 1));
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setDecisions((prev) => ({ ...prev, [current.key]: 'delete' }));
        setCurrentIndex((index) => findNextIndex(entries, index, 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, entries]);

  const counts = useMemo(() => {
    const next = {
      delete: 0,
      incorrect: 0,
      accepted: 0,
      implicitOk: 0,
    };

    for (const entry of entries) {
      const state = getIconConversionReviewState(entry, decisions);

      if (state === 'delete' || state === 'incorrect') {
        next[state] += 1;
        continue;
      }

      if (state === 'accepted') {
        next.accepted += 1;
        continue;
      }

      next.implicitOk += 1;
    }

    return next;
  }, [decisions, entries]);

  const progress = `${Math.min(currentIndex + 1, entries.length)} / ${entries.length}`;
  const currentState = current ? getIconConversionReviewState(current, decisions) : 'implicit-ok';
  const currentPreview = current?.trimPreview ?? null;

  async function copyIssues(): Promise<void> {
    const payload = formatIconConversionIssueClipboard(entries, decisions);
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function applyAction(action: ReviewAction): void {
    if (!current) {
      return;
    }

    setDecisions((prev) => ({ ...prev, [current.key]: action }));
    setCurrentIndex((index) => findNextIndex(entries, index, 1));
  }

  function clearAction(): void {
    if (!current) {
      return;
    }

    setDecisions((prev) => {
      const next = { ...prev };
      delete next[current.key];
      return next;
    });
  }

  if (!current) {
    return (
      <main className="min-h-screen bg-page text-main px-6 py-8">
        <div className="max-w-[56rem] mx-auto">No icon entries found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page text-main px-4 py-6 md:px-6">
      <div className="max-w-[72rem] mx-auto flex flex-col gap-4">
        <section className="border border-rule bg-card p-4 md:p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl">Icon Conversion Review</h1>
              <p className="text-sm text-mute max-w-[48rem]">
                Tinder-style review for SVG to bitgrid conversions. Review units are native assets,
                not matched pairs. This library currently has {summary.count16} `16px` assets,
                {summary.count24} `24px` assets, only {summary.overlap} shared name across both sets,
                and the `24px` set now converts to a canonical `21x21` bitmap live area.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" mode="flat" onClick={copyIssues}>
                {copied ? 'Copied' : 'Copy issues'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <span>Progress: {progress}</span>
            <span>Delete Both: {counts.delete}</span>
            <span>Incorrect: {counts.incorrect}</span>
            <span>Accepted: {counts.accepted}</span>
            <span>Implicit OK: {counts.implicitOk}</span>
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-xs text-mute">
            <span>`←` previous</span>
            <span>`→` next</span>
            <span>`↑` incorrect</span>
            <span>`↓` delete both</span>
            <span>clear mark = accepted/OK default</span>
          </div>
        </section>

        <section className="border border-rule bg-card overflow-hidden">
          <div className="border-b border-rule px-4 py-3 flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-sm">{current.name}</h2>
            <span className="font-mono text-xs text-mute">{current.fileName}</span>
            <span className="font-mono text-xs text-mute">{current.iconSet}px source</span>
            <span className="font-mono text-xs">
              {formatReviewStateLabel(currentState)}
            </span>
            <span className="font-mono text-xs text-mute">{current.diagnosis.code}</span>
            {current.acceptedIssue ? (
              <span className="font-mono text-xs text-mute">manifest accepted</span>
            ) : null}
            {currentPreview?.applied ? (
              <span className="font-mono text-xs text-mute">
                canonical 21x21 bitmap
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-px bg-rule xl:grid-cols-2">
            <div className="bg-card p-4 flex flex-col gap-3">
              <div className="font-joystix text-[10px] uppercase text-mute">Original SVG</div>
              <div className="bg-depth border border-rule p-4 flex items-center justify-center">
                <StageFrame gridSize={current.iconSet}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.sourceSvgDataUri}
                    alt={`${current.name} original svg`}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </StageFrame>
              </div>
            </div>

            <div className="bg-card p-4 flex flex-col gap-3">
              <div className="font-joystix text-[10px] uppercase text-mute">
                {currentPreview?.applied ? 'Canonical Bitgrid' : 'Converted Bitgrid'}
              </div>
              <div className="bg-depth border border-rule p-4 flex items-center justify-center">
                <StageFrame gridSize={currentPreview?.width ?? current.iconSet}>
                  {current.converted ? (
                    <PixelPreview
                      bits={currentPreview?.bits ?? current.converted.bits}
                      size={currentPreview?.width ?? current.converted.width}
                    />
                  ) : (
                    <div
                      className="w-full h-full font-mono text-xs whitespace-pre-wrap flex items-center justify-center text-center"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {current.error}
                    </div>
                  )}
                </StageFrame>
              </div>
            </div>
          </div>

          <div className="border-t border-rule px-4 py-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 font-mono text-xs text-mute">
            <div>native grid: {current.iconSet} x {current.iconSet}</div>
            <div>
              filled bits:{' '}
              {current.converted
                ? [...current.converted.bits].filter((bit) => bit === '1').length
                : 'n/a'}
            </div>
            <div>
              bitmap grid:{' '}
              {currentPreview
                ? `${currentPreview.width} x ${currentPreview.height}`
                : `${current.iconSet} x ${current.iconSet}`}
            </div>
            <div>
              snapped:{' '}
              {current.converted ? current.converted.report.snappedValues : 'n/a'}
            </div>
            <div>
              diagonals:{' '}
              {current.converted
                ? String(current.converted.report.hadDiagonalSegments)
                : 'n/a'}
            </div>
            <div className="md:col-span-2 xl:col-span-4 break-words">
              diagnosis: {current.diagnosis.summary}
            </div>
            <div className="md:col-span-2 xl:col-span-4 break-words">
              canonicalization:{' '}
              {currentPreview?.applied
                ? '24px source rendered as canonical 21x21 bitmap'
                : 'not applied'}
            </div>
            <div className="md:col-span-2 xl:col-span-4 break-words">
              off-grid:{' '}
              {current.converted && current.converted.report.offGridValues.length > 0
                ? current.converted.report.offGridValues.join(', ')
                : 'none'}
            </div>
            {current.acceptedIssue ? (
              <div className="md:col-span-2 xl:col-span-4 break-words">
                accepted manifest entry: {current.acceptedIssue.signature}
              </div>
            ) : null}
          </div>

          <div className="border-t border-rule px-4 py-3 flex flex-wrap gap-2">
            <Button size="sm" mode="flat" onClick={() => setCurrentIndex((index) => findNextIndex(entries, index, -1))}>
              Previous
            </Button>
            <Button size="sm" mode="flat" onClick={() => applyAction('incorrect')}>
              Incorrect
            </Button>
            <Button size="sm" mode="flat" onClick={() => applyAction('delete')}>
              Delete Both
            </Button>
            <Button size="sm" mode="flat" onClick={clearAction}>
              Clear Mark
            </Button>
            <Button size="sm" mode="flat" onClick={() => setDecisions({})}>
              Clear All Marks
            </Button>
            <Button size="sm" mode="flat" onClick={() => setCurrentIndex((index) => findNextIndex(entries, index, 1))}>
              Next
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
