/* eslint-disable */
'use client';

import { useState } from 'react';

export function CommentPopoverMock() {
  const [note, setNote] = useState('');

  return (
    <div className="relative w-full pt-2">
      {/* Arrow */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        {/* Outer triangle (border) */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '7px solid #374151',
          }}
        />
        {/* Inner triangle (fill) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '2px',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #111827',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 shadow-xl"
      >
        <div className="flex items-center gap-2 p-2">
          <input
            type="text"
            className="flex-1 rounded border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-gray-500"
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-600 font-mono text-xs text-white hover:bg-blue-500"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
