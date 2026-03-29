/* eslint-disable */
'use client';

import { useState } from 'react';

const intents = [
  { icon: '🔧', label: 'fix' },
  { icon: '✏️', label: 'change' },
  { icon: '❓', label: 'question' },
  { icon: '✨', label: 'create' },
] as const;

const priorities = [
  { level: 'P1', color: '#ef4444' },
  { level: 'P2', color: '#f97316' },
  { level: 'P3', color: '#3b82f6' },
  { level: 'P4', color: '#9ca3af' },
] as const;

export function AnnotationComposerMock() {
  const [intent, setIntent] = useState<string>('fix');
  const [priority, setPriority] = useState<string>('P2');
  const [message, setMessage] = useState('');

  return (
    <div className="w-full rounded-md border border-gray-700 bg-gray-900 text-gray-200 shadow-xl">
      {/* Header */}
      <div className="border-b border-gray-700 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
          New Annotation
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3">
        {/* Textarea */}
        <textarea
          rows={3}
          className="w-full resize-none rounded border border-gray-600 bg-gray-800 px-2 py-1.5 font-mono text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-gray-500"
          placeholder="What needs to change?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Intent Row */}
        <div className="flex items-center gap-1">
          {intents.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                intent === item.label
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
              onClick={() => setIntent(item.label)}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="font-sans">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Priority Row */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-[10px] uppercase tracking-wide text-gray-500">Priority</span>
          {priorities.map((p) => (
            <button
              key={p.level}
              className="group relative"
              onClick={() => setPriority(p.level)}
            >
              <span
                className="block h-3.5 w-3.5 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: p.color,
                  boxShadow: priority === p.level ? `0 0 0 2px ${p.color}44` : 'none',
                  outline: priority === p.level ? `2px solid ${p.color}` : '2px solid transparent',
                  outlineOffset: '1px',
                }}
              />
            </button>
          ))}
        </div>

        {/* Mode Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-gray-600 px-1 py-0.5">
            <span className="cursor-pointer rounded-full bg-gray-700 px-1.5 py-0.5 text-[10px]">☀️</span>
            <span className="cursor-pointer rounded-full px-1.5 py-0.5 text-[10px] text-gray-500">🌙</span>
          </div>
          {['hover', 'focus', 'disabled'].map((state) => (
            <span
              key={state}
              className="cursor-pointer rounded-full border border-gray-600 px-2 py-0.5 font-sans text-[10px] text-gray-400 hover:border-gray-500 hover:text-gray-300"
            >
              {state}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-700 px-3 py-2">
        <button className="font-sans text-xs text-gray-400 hover:text-gray-200">
          Cancel
        </button>
        <button className="rounded bg-blue-600 px-3 py-1 font-sans text-xs text-white hover:bg-blue-500">
          Pin
        </button>
      </div>
    </div>
  );
}
