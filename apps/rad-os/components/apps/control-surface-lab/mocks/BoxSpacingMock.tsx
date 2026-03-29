/* eslint-disable */
'use client';

import { useState } from 'react';

export function BoxSpacingMock() {
  const [linked, setLinked] = useState(true);
  const [gap, setGap] = useState('8');

  const margin = { top: '16', right: '24', bottom: '16', left: '24' };
  const padding = { top: '12', right: '16', bottom: '12', left: '16' };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Box Model */}
      <div className="flex items-center justify-center py-2">
        {/* Margin zone */}
        <div
          className="relative flex items-center justify-center"
          style={{
            background: '#fff3e0',
            border: '1px dashed #ffb74d',
            padding: '20px 28px',
          }}
        >
          <span
            className="absolute left-1 top-0.5 font-sans text-[9px] uppercase tracking-wide"
            style={{ color: '#e65100' }}
          >
            margin
          </span>
          {/* Margin values */}
          <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[10px]" style={{ color: '#e65100' }}>{margin.top}</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[10px]" style={{ color: '#e65100' }}>{margin.right}</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[10px]" style={{ color: '#e65100' }}>{margin.bottom}</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[10px]" style={{ color: '#e65100' }}>{margin.left}</span>

          {/* Padding zone */}
          <div
            className="relative flex items-center justify-center"
            style={{
              background: '#e8f5e9',
              border: '1px dashed #66bb6a',
              padding: '16px 24px',
            }}
          >
            <span
              className="absolute left-1 top-0.5 font-sans text-[9px] uppercase tracking-wide"
              style={{ color: '#2e7d32' }}
            >
              padding
            </span>
            {/* Padding values */}
            <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[10px]" style={{ color: '#2e7d32' }}>{padding.top}</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[10px]" style={{ color: '#2e7d32' }}>{padding.right}</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[10px]" style={{ color: '#2e7d32' }}>{padding.bottom}</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[10px]" style={{ color: '#2e7d32' }}>{padding.left}</span>

            {/* Content zone */}
            <div
              className="flex items-center justify-center px-4 py-2"
              style={{
                background: '#e3f2fd',
                border: '1px solid #42a5f5',
                minWidth: '80px',
              }}
            >
              <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: '#1565c0' }}>
                240 × 120
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Link / Unlink toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 font-sans text-xs text-gray-600 hover:bg-gray-50"
          onClick={() => setLinked(!linked)}
        >
          <span>{linked ? '🔗' : '🔓'}</span>
          <span>{linked ? 'Linked' : 'Unlinked'}</span>
        </button>
      </div>

      {/* Gap row */}
      <div className="flex items-center justify-center gap-2">
        <span className="font-sans text-xs text-gray-500">gap</span>
        <input
          type="text"
          className="h-6 w-14 rounded border border-gray-200 bg-white px-1.5 text-center font-mono text-xs text-gray-700"
          value={gap}
          onChange={(e) => setGap(e.target.value)}
        />
        <span className="font-mono text-[10px] text-gray-400">px</span>
      </div>
    </div>
  );
}
