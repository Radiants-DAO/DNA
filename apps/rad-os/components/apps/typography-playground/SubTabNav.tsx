'use client';

import React from 'react';
import { type SubTab } from './TypographyPlayground';

interface SubTabNavProps {
  active: SubTab;
  onChange: (tab: SubTab) => void;
}

const SUB_TABS: { value: SubTab; label: string }[] = [
  { value: 'playground', label: 'Playground' },
  { value: 'scale', label: 'Type Scale' },
  { value: 'elements', label: 'Element Styles' },
  { value: 'css-ref', label: 'CSS Reference' },
  { value: 'about', label: 'About Font' },
];

export function SubTabNav({ active, onChange }: SubTabNavProps) {
  return (
    <div className="space-y-0.5">
      {SUB_TABS.map(({ value, label }) => (
        // eslint-disable-next-line rdna/prefer-rdna-components -- reason:sidebar-nav-item-not-a-form-button owner:design-system expires:2026-12-31 issue:DNA-type-playground
        <button
          key={value}
          className={`w-full text-left px-2 py-1.5 font-heading text-xs uppercase tracking-tight transition-colors ${
            active === value
              ? 'text-main font-bold bg-page/50'
              : 'text-mute hover:text-sub hover:bg-page/30'
          }`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
