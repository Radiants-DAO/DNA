/* eslint-disable */
'use client';

import { useState } from 'react';

export function ComposerShellMock() {
  const [message, setMessage] = useState('');

  return (
    <div className="w-full rounded-md border border-gray-700 bg-gray-900 text-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Annotate
        </span>
        <button className="text-sm text-gray-400 hover:text-gray-200" title="Screenshot">
          📷
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3">
        {/* Textarea */}
        <textarea
          rows={3}
          className="w-full resize-none rounded border border-gray-600 bg-gray-800 px-2 py-1.5 font-mono text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-gray-500"
          placeholder="Describe the annotation..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Screenshot Strip Placeholder */}
        <div className="flex h-10 items-center justify-center rounded border border-dashed border-gray-600 text-[10px] text-gray-500">
          screenshot strip
        </div>

        {/* Controls Slot Placeholder */}
        <div className="flex h-8 items-center justify-center rounded border border-dashed border-gray-600 text-[10px] text-gray-500">
          controls slot
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700 px-3 py-2">
        <span className="font-mono text-[10px] text-gray-500">⌘+Enter</span>
        <div className="flex items-center gap-2">
          <button className="font-sans text-xs text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button className="rounded bg-blue-600 px-3 py-1 font-sans text-xs text-white hover:bg-blue-500">
            Pin
          </button>
        </div>
      </div>
    </div>
  );
}
