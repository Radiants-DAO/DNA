/* eslint-disable */
'use client';

import { useState } from 'react';

const tools = [
  { icon: '🔍', label: 'inspect' },
  { icon: '💬', label: 'comment' },
  { icon: '📐', label: 'measure' },
  { icon: '⚙️', label: 'settings' },
] as const;

export function InspectToolbarMock() {
  const [active, setActive] = useState('inspect');

  return (
    <div className="flex w-full items-center justify-center py-2">
      <div
        className="flex items-center gap-0.5 rounded-full bg-gray-900 px-2 py-1 text-gray-200"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
      >
        {tools.map((tool) => (
          <button
            key={tool.label}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
              active === tool.label
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActive(tool.label)}
          >
            <span>{tool.icon}</span>
          </button>
        ))}

        {/* Separator */}
        <div className="mx-1 h-4 w-px bg-gray-700" />

        {/* Mode Label */}
        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
          {active}
        </span>
      </div>
    </div>
  );
}
