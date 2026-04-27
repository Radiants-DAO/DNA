'use client';

import { useEffect, useState } from 'react';
import {
  prepareWithSegments,
  layoutWithLines,
  walkLineRanges,
} from '@chenglou/pretext';

// ---------------------------------------------------------------------------
// Headline fitting -- binary search for largest font that fits
// ---------------------------------------------------------------------------

interface HeadlineFit {
  fontSize: number;
  lines: { text: string; width: number; y: number }[];
  totalHeight: number;
}

function fitHeadline(
  text: string,
  fontFamily: string,
  maxWidth: number,
  maxSize: number,
  minSize: number = 16,
): HeadlineFit {
  let lo = minSize;
  let hi = maxSize;
  let best = lo;
  let bestLines: { text: string; width: number; y: number }[] = [];
  let bestHeight = 0;

  while (lo <= hi) {
    const size = Math.floor((lo + hi) / 2);
    const font = `700 ${size}px '${fontFamily}'`;
    const lh = Math.round(size * 1.1);
    const prep = prepareWithSegments(text, font);
    let breaksWord = false;

    // walkLineRanges(prepared, maxWidth, onLine) -- 3 args, no lineHeight
    walkLineRanges(prep, maxWidth, (range) => {
      if (range.end.graphemeIndex !== 0) breaksWord = true;
    });

    if (!breaksWord) {
      const result = layoutWithLines(prep, maxWidth, lh);
      const totalH = result.lines.length * lh;
      best = size;
      bestHeight = totalH;
      bestLines = result.lines.map((line, i) => ({
        text: line.text,
        width: line.width,
        y: i * lh,
      }));
      lo = size + 1;
    } else {
      hi = size - 1;
    }
  }

  return { fontSize: best, lines: bestLines, totalHeight: bestHeight };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CoverPageProps {
  pageWidth: number;
  pageHeight: number;
}

export function CoverPage({ pageWidth, pageHeight }: CoverPageProps) {
  const [fit, setFit] = useState<HeadlineFit | null>(null);
  const margin = 32;
  const layoutW = pageWidth - margin * 2;

  useEffect(() => {
    if (layoutW <= 0) return;
    document.fonts.ready.then(() => {
      const result = fitHeadline(
        'Becoming Substance',
        'Mondwest',
        layoutW,
        Math.min(72, layoutW * 0.2),
      );
      setFit(result);
    });
  }, [layoutW]);

  if (!fit) return <div style={{ width: pageWidth, height: pageHeight }} />;

  // Center vertically
  const titleBlockH = fit.totalHeight + 40;
  const startY = (pageHeight - titleBlockH) / 2;

  return (
    <div
      className="relative bg-card"
      style={{ width: pageWidth, height: pageHeight }}
    >
      {fit.lines.map((line, i) => (
        <div
          key={i}
          className="absolute text-head"
          style={{
            left: margin + (layoutW - line.width) / 2,
            top: startY + line.y,
            whiteSpace: 'pre',
            font: `700 ${fit.fontSize}px 'Mondwest'`,
          }}
        >
          {line.text}
        </div>
      ))}

      <div
        className="absolute text-mute font-joystix text-xs uppercase tracking-wide"
        style={{
          left: margin,
          top: startY + fit.totalHeight + 20,
          width: layoutW,
          textAlign: 'center',
        }}
      >
        Radiants Manifesto
      </div>
    </div>
  );
}
