'use client';

import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import type { PretextBlock } from '../../markdown';
import type { EditorialSettings } from '../../types';
import { useFontsReady } from '../shared/useFontsReady';
import {
  computeEditorialLayout,
  type EditorialLayoutElement,
  type EditorialLayoutResult,
} from './editorial-layout';

interface EditorialViewProps {
  blocks: PretextBlock[];
  settings: EditorialSettings;
  assets: Record<string, string>;
  containerWidth: number;
  containerHeight: number;
}

function renderElement(element: EditorialLayoutElement, key: string) {
  switch (element.kind) {
    case 'line':
      return (
        <div
          key={key}
          className={
            element.variant === 'code'
              ? 'absolute rounded-sm bg-depth px-2 text-head'
              : 'absolute text-head'
          }
          style={{
            left: element.x,
            top: element.y,
            whiteSpace: 'pre',
            font: element.font,
            ['--pretext-line-height' as string]: `${element.lh}px`,
            lineHeight: 'var(--pretext-line-height)',
          } as CSSProperties}
        >
          {element.text}
        </div>
      );

    case 'heading-line':
      return (
        <div
          key={key}
          className="absolute text-head"
          style={{
            left: element.x,
            top: element.y,
            width: element.w,
            whiteSpace: 'pre',
            fontFamily: element.fontFamily,
            fontSize: element.fontSize,
            fontWeight: element.fontWeight,
            ['--pretext-line-height' as string]: `${element.lh}px`,
            lineHeight: 'var(--pretext-line-height)',
            textAlign: element.center ? 'center' : undefined,
          } as CSSProperties}
        >
          {element.text}
        </div>
      );

    case 'dropcap':
      return (
        <div
          key={key}
          className="absolute flex items-start justify-center text-head"
          style={{
            left: element.x,
            top: element.y,
            width: element.w,
            height: element.h,
            fontFamily: element.fontFamily,
            fontSize: element.fontSize,
            ['--pretext-line-height' as string]: '0.85',
            lineHeight: 'var(--pretext-line-height)',
          } as CSSProperties}
        >
          {element.letter}
        </div>
      );

    case 'pullquote':
      return (
        <div
          key={key}
          className="absolute border border-line bg-accent-soft px-4 py-4 text-head"
          style={{
            left: element.x,
            top: element.y,
            width: element.w,
            height: element.h,
            fontFamily: element.fontFamily,
            fontSize: element.fontSize,
            ['--pretext-line-height' as string]: `${element.lh}px`,
            lineHeight: 'var(--pretext-line-height)',
          } as CSSProperties}
        >
          {element.lines.map((line, index) => (
            <div key={`${key}-line-${index}`}>{line}</div>
          ))}
        </div>
      );

    case 'image':
      return (
        <Image
          key={key}
          src={element.src}
          alt={element.alt}
          width={Math.max(1, Math.round(element.w))}
          height={Math.max(1, Math.round(element.h))}
          unoptimized
          className="absolute border border-line object-cover"
          style={{
            left: element.x,
            top: element.y,
            width: element.w,
            height: element.h,
          }}
        />
      );

    case 'rule':
      return (
        <div
          key={key}
          className="absolute bg-line"
          style={{
            ['--pretext-rule-thickness' as string]: '1px',
            left: element.x,
            top: element.y,
            width: element.w,
            height: 'var(--pretext-rule-thickness)',
          } as CSSProperties}
        />
      );
  }
}

export function EditorialView({
  blocks,
  settings,
  assets,
  containerWidth,
  containerHeight,
}: EditorialViewProps) {
  const cacheRef = useRef<Map<string, PreparedTextWithSegments>>(new Map());
  const [result, setResult] = useState<EditorialLayoutResult | null>(null);

  useFontsReady(() => {
    setResult(
      computeEditorialLayout({
        blocks,
        containerWidth,
        desiredColumns: settings.columnCount,
        dropCap: settings.dropCap,
        pullquote: settings.pullquote,
        assets,
        cache: cacheRef.current,
      }),
    );
  }, [
    assets,
    blocks,
    containerWidth,
    settings.columnCount,
    settings.dropCap,
    settings.pullquote,
  ]);

  const layout = result;

  return (
    <div
      data-testid="pretext-primitive-editorial"
      data-block-count={blocks.length}
      data-column-count={layout?.columnCount ?? settings.columnCount}
      data-container-width={containerWidth}
      data-container-height={containerHeight}
      className="h-full w-full overflow-auto bg-card"
    >
      {layout ? (
        <div className="relative" style={{ height: layout.height }}>
          {layout.elements.map((element, index) =>
            renderElement(element, `editorial-${index}`),
          )}
        </div>
      ) : null}
    </div>
  );
}
