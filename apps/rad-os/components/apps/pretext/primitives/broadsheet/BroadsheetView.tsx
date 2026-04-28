'use client';

import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import type { PretextBlock } from '../../markdown';
import type { BroadsheetSettings } from '../../types';
import { useFontsReady } from '../shared/useFontsReady';
import {
  computeBroadsheetLayout,
  pretextBlocksToBroadsheetModel,
  type BroadsheetLayoutElement,
  type BroadsheetLayoutResult,
} from './broadsheet-layout';

interface BroadsheetViewProps {
  blocks: PretextBlock[];
  settings: BroadsheetSettings;
  title: string;
  assets: Record<string, string>;
  containerWidth: number;
  containerHeight: number;
  dateline?: string;
}

function renderElement(
  element: BroadsheetLayoutElement,
  bodyFont: string,
  bodyFontSize: number,
  mastheadHeight: number,
  key: string,
) {
  const isMasthead =
    element.kind === 'masthead-text' ||
    (element.kind === 'rule' && element.section === 'masthead');
  const topOffset = isMasthead ? 0 : mastheadHeight;

  switch (element.kind) {
    case 'masthead-text':
      return (
        <div
          key={key}
          className="absolute text-head"
          style={{
            left: element.x,
            top: element.y + topOffset,
            width: element.w,
            whiteSpace: 'pre',
            fontFamily: element.family,
            fontSize: element.fontSize,
            fontWeight: element.bold ? 700 : 400,
            ['--pretext-line-height' as string]: `${element.lh}px`,
            lineHeight: 'var(--pretext-line-height)',
            textAlign: element.align,
            textTransform: element.uppercase ? 'uppercase' : undefined,
            letterSpacing: element.letterSpacing,
          } as CSSProperties}
        >
          {element.text}
        </div>
      );

    case 'line':
      return (
        <div
          key={key}
          className="absolute text-head"
          style={{
            left: element.x,
            top: element.y + topOffset,
            whiteSpace: 'pre',
            font: bodyFont,
          }}
        >
          {element.text}
        </div>
      );

    case 'dropcap':
      return (
        <div
          key={key}
          className="absolute flex items-center justify-center border border-line bg-accent text-head"
          style={{
            left: element.x,
            top: element.y + topOffset,
            width: bodyFontSize * 2.4,
            height: bodyFontSize * 4,
            fontSize: bodyFontSize * 2.4,
            ['--pretext-line-height' as string]: '1',
            lineHeight: 'var(--pretext-line-height)',
          } as CSSProperties}
        >
          {element.letter}
        </div>
      );

    case 'heading-line':
      return (
        <div
          key={key}
          className="absolute text-head"
          style={{
            left: element.x,
            top: element.y + topOffset,
            width: element.center ? element.w : undefined,
            whiteSpace: 'pre',
            fontFamily: element.family,
            fontSize: element.fontSize,
            fontWeight: element.bold ? 700 : 400,
            ['--pretext-line-height' as string]: `${element.lh}px`,
            lineHeight: 'var(--pretext-line-height)',
            textAlign: element.center ? 'center' : undefined,
          } as CSSProperties}
        >
          {element.text}
        </div>
      );

    case 'hero':
      return (
        <Image
          key={key}
          src={element.src}
          alt=""
          width={Math.max(1, Math.round(element.w))}
          height={Math.max(1, Math.round(element.h))}
          unoptimized
          className="absolute border border-line object-cover"
          style={{
            left: element.x,
            top: element.y + topOffset,
            width: element.w,
            height: element.h,
          }}
        />
      );

    case 'rule':
      return (
        <div
          key={key}
          className="absolute bg-head"
          style={{
            ['--pretext-rule-thickness' as string]: '1px',
            left: element.x,
            top: element.y + topOffset,
            width: element.w,
            height: 'var(--pretext-rule-thickness)',
          } as CSSProperties}
        />
      );
  }
}

export function BroadsheetView({
  blocks,
  settings,
  title,
  assets,
  containerWidth,
  containerHeight,
  dateline = title || 'Latest Edition',
}: BroadsheetViewProps) {
  const cacheRef = useRef<Map<string, PreparedTextWithSegments>>(new Map());
  const [result, setResult] = useState<BroadsheetLayoutResult | null>(null);

  useFontsReady(() => {
    const model = pretextBlocksToBroadsheetModel(blocks, assets);
    setResult(
      computeBroadsheetLayout({
        containerWidth,
        masthead: settings.masthead || title || 'Broadsheet',
        dateline,
        headline: model.headline || title || 'Latest Edition',
        columns: settings.columns,
        heroWrap: settings.heroWrap,
        heroImageSrc:
          (settings.heroImageKey && assets[settings.heroImageKey]) ||
          model.heroImageSrc,
        flow: model.flow,
        cache: cacheRef.current,
      }),
    );
  }, [
    assets,
    blocks,
    containerWidth,
    dateline,
    settings.columns,
    settings.heroImageKey,
    settings.heroWrap,
    settings.masthead,
    title,
  ]);

  const layout = result;

  return (
    <div
      data-testid="pretext-primitive-broadsheet"
      data-column-count={layout?.columnCount ?? settings.columns}
      data-container-width={containerWidth}
      data-container-height={containerHeight}
      className="h-full w-full overflow-auto bg-card"
    >
      {layout ? (
        <div
          className="relative"
          style={{ height: layout.mastheadHeight + layout.height + 32 }}
        >
          {layout.elements.map((element, index) =>
            renderElement(
              element,
              layout.bodyFont,
              layout.baseFontSize,
              layout.mastheadHeight,
              `broadsheet-${index}`,
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
