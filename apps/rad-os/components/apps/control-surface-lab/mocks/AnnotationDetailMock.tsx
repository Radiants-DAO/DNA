/* eslint-disable */
'use client';

import { useState } from 'react';

type Mode = 'view' | 'resolve' | 'dismiss';

export function AnnotationDetailMock() {
  const [mode, setMode] = useState<Mode>('view');
  const [resolveNote, setResolveNote] = useState('');

  return (
    <div className="w-full rounded-md border border-gray-700 bg-gray-900 text-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-sans text-xs text-blue-400">
            Fix
          </span>
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
            style={{ backgroundColor: '#f9731622', color: '#f97316' }}
          >
            P2
          </span>
        </div>
        <button className="text-sm text-gray-500 hover:text-gray-300">✕</button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 px-3 py-3">
        <p className="font-mono text-xs leading-relaxed text-gray-300">
          Border radius should use radius-sm token, not hardcoded 4px.
          The component currently has inline styles that bypass the
          design system token layer.
        </p>
        <span className="font-sans text-[10px] text-gray-500">
          5m ago · pending
        </span>
      </div>

      {/* Resolve input */}
      {mode === 'resolve' && (
        <div className="border-t border-gray-700 px-3 py-2">
          <input
            type="text"
            className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-gray-500"
            placeholder="Resolution note..."
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-700 px-3 py-2">
        {mode === 'view' ? (
          <>
            <button
              className="rounded border border-gray-600 px-3 py-1 font-sans text-xs text-gray-300 hover:border-gray-500 hover:text-white"
              onClick={() => setMode('resolve')}
            >
              Resolve
            </button>
            <button
              className="font-sans text-xs text-gray-500 hover:text-gray-300"
              onClick={() => setMode('dismiss')}
            >
              Dismiss
            </button>
          </>
        ) : mode === 'resolve' ? (
          <>
            <button
              className="rounded bg-green-600 px-3 py-1 font-sans text-xs text-white hover:bg-green-500"
              onClick={() => setMode('view')}
            >
              Confirm
            </button>
            <button
              className="font-sans text-xs text-gray-500 hover:text-gray-300"
              onClick={() => setMode('view')}
            >
              Cancel
            </button>
          </>
        ) : (
          <span className="font-sans text-xs text-gray-500 italic">Dismissed</span>
        )}
      </div>
    </div>
  );
}
