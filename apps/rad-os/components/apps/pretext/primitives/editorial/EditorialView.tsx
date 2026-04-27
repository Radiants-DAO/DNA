'use client';

import { useRef, useState } from 'react';
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
            lineHeight: `${element.lh}px`,
          }}
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
            lineHeight: `${element.lh}px`,
            textAlign: element.center ? 'center' : undefined,
          }}
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
            lineHeight: 0.85,
          }}
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
            lineHeight: `${element.lh}px`,
          }}
        >
          {element.lines.map((line, index) => (
            <div key={`${key}-line-${index}`}>{line}</div>
          ))}
        </div>
      );

    case 'image':
      return (
        <img
          key={key}
          src={element.src}
          alt={element.alt}
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
            left: element.x,
            top: element.y,
            width: element.w,
            height: 1,
          }}
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
