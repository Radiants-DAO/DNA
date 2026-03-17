"use client";

import { useState } from "react";

interface ScreenshotStripProps {
  screenshots: string[];
  onRemove?: (index: number) => void;
  /** If true, thumbnails are not removable (display-only mode) */
  readOnly?: boolean;
}

/**
 * Shared thumbnail strip for annotation screenshots.
 * Used in both the composer (editable) and detail/list views (read-only).
 */
export function ScreenshotStrip({ screenshots, onRemove, readOnly }: ScreenshotStripProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (screenshots.length === 0) return null;

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto">
        {screenshots.map((src, i) => (
          <div key={i} className="group/thumb relative shrink-0">
            {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
            <button
              type="button"
              onClick={() => setExpanded(i)}
              className="block overflow-hidden rounded-xs border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Screenshot ${i + 1}`}
                className="h-12 w-auto object-cover"
              />
            </button>
            {!readOnly && onRemove && (
              // eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] leading-none text-inv group-hover/thumb:flex"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {expanded !== null && (
        // eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density
        <button
          type="button"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(0,0,0,0.8)]"
          onClick={() => setExpanded(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshots[expanded]}
            alt={`Screenshot ${expanded + 1}`}
            className="max-h-[80vh] max-w-[80vw] rounded-sm shadow-floating"
          />
        </button>
      )}
    </>
  );
}
