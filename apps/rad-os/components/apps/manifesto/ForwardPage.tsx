'use client';

import { useEffect, useState } from 'react';
import {
  prepareWithSegments,
  layoutWithLines,
} from '@chenglou/pretext';
import { FORWARD_INTRO } from './manifesto-data';

interface ForwardPageProps {
  pageWidth: number;
  pageHeight: number;
}

interface LaidOutBlock {
  lines: { text: string; width: number; y: number }[];
  totalHeight: number;
  font: string;
}

export function ForwardPage({ pageWidth, pageHeight }: ForwardPageProps) {
  const [blocks, setBlocks] = useState<LaidOutBlock[] | null>(null);
  const [headingBlock, setHeadingBlock] = useState<LaidOutBlock | null>(null);
  const margin = 32;
  const layoutW = pageWidth - margin * 2;
  const maxTextW = Math.min(layoutW, 340); // comfortable reading width for centered block

  useEffect(() => {
    if (layoutW <= 0 || typeof window === 'undefined') return;
    document.fonts.ready.then(() => {
      // Heading
      const headingSize = 18;
      const headingFont = `bold ${headingSize}px 'Joystix Monospace'`;
      const headingLh = Math.round(headingSize * 1.1);
      const headingPrep = prepareWithSegments(FORWARD_INTRO.heading, headingFont);
      const headingResult = layoutWithLines(headingPrep, maxTextW, headingLh);
      setHeadingBlock({
        lines: headingResult.lines.map((l, i) => ({ text: l.text, width: l.width, y: i * headingLh })),
        totalHeight: headingResult.lines.length * headingLh,
        font: headingFont,
      });

      // Body paragraphs
      const bodySize = 14;
      const bodyFont = `${bodySize}px 'Mondwest'`;
      const bodyLh = Math.round(bodySize * 1.375);
      const laid: LaidOutBlock[] = [];
      for (const text of FORWARD_INTRO.lines) {
        const prep = prepareWithSegments(text, bodyFont);
        const result = layoutWithLines(prep, maxTextW, bodyLh);
        laid.push({
          lines: result.lines.map((l, i) => ({ text: l.text, width: l.width, y: i * bodyLh })),
          totalHeight: result.lines.length * bodyLh,
          font: bodyFont,
        });
      }
      setBlocks(laid);
    });
  }, [layoutW, maxTextW]);

  if (!headingBlock || !blocks) return <div style={{ width: pageWidth, height: pageHeight }} />;

  // Total content height: heading + gap + paragraphs with gaps between
  const paragraphGap = 16;
  const headingGap = 24;
  let totalH = headingBlock.totalHeight + headingGap;
  for (let i = 0; i < blocks.length; i++) {
    totalH += blocks[i]!.totalHeight;
    if (i < blocks.length - 1) totalH += paragraphGap;
  }

  const startY = (pageHeight - totalH) / 2;
  const startX = (pageWidth - maxTextW) / 2;

  let cursorY = startY;

  return (
    <div className="relative bg-card" style={{ width: pageWidth, height: pageHeight }}>
      {/* Heading — centered */}
      {headingBlock.lines.map((line, i) => (
        <div
          key={`h-${i}`}
          className="absolute text-head"
          style={{
            left: startX + (maxTextW - line.width) / 2,
            top: cursorY + line.y,
            whiteSpace: 'pre',
            font: headingBlock.font,
          }}
        >
          {line.text}
        </div>
      ))}
      {(() => { cursorY += headingBlock.totalHeight + headingGap; return null; })()}

      {/* Body paragraphs — centered block, left-aligned text */}
      {blocks.map((block, bi) => {
        const blockY = cursorY;
        cursorY += block.totalHeight + (bi < blocks.length - 1 ? paragraphGap : 0);
        return block.lines.map((line, li) => (
          <div
            key={`p${bi}-${li}`}
            className="absolute text-head"
            style={{
              left: startX,
              top: blockY + line.y,
              whiteSpace: 'pre',
              font: block.font,
            }}
          >
            {line.text}
          </div>
        ));
      })}
    </div>
  );
}
