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
    if (layoutW <= 0) return;
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

  const paragraphGap = 16;
  const headingGap = 24;
  const bodyHeight = blocks.reduce(
    (total, block, index) =>
      total + block.totalHeight + (index < blocks.length - 1 ? paragraphGap : 0),
    0,
  );
  const totalH = headingBlock.totalHeight + headingGap + bodyHeight;

  const startY = (pageHeight - totalH) / 2;
  const startX = (pageWidth - maxTextW) / 2;
  const bodyStartY = startY + headingBlock.totalHeight + headingGap;
  const bodyBlocks = blocks.reduce<Array<{ block: LaidOutBlock; y: number }>>(
    (positions, block) => {
      const previous = positions.at(-1);
      const y = previous ? previous.y + previous.block.totalHeight + paragraphGap : bodyStartY;
      return [...positions, { block, y }];
    },
    [],
  );

  return (
    <div className="relative bg-card" style={{ width: pageWidth, height: pageHeight }}>
      {/* Heading — centered */}
      {headingBlock.lines.map((line, i) => (
        <div
          key={`h-${i}`}
          className="absolute text-head"
          style={{
            left: startX + (maxTextW - line.width) / 2,
            top: startY + line.y,
            whiteSpace: 'pre',
            font: headingBlock.font,
          }}
        >
          {line.text}
        </div>
      ))}

      {/* Body paragraphs — centered block, left-aligned text */}
      {bodyBlocks.map(({ block, y: blockY }, bi) => {
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
