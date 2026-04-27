'use client';

import { Button } from '@rdna/radiants/components/core';
import type { ColorsSubTab } from './types';

interface ColorsSubNavProps {
  active: ColorsSubTab;
  onChange: (tab: ColorsSubTab) => void;
}

const TABS: { value: ColorsSubTab; label: string }[] = [
  { value: 'palette',  label: 'Palette' },
  { value: 'semantic', label: 'Semantic' },
];

export function ColorsSubNav({ active, onChange }: ColorsSubNavProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {TABS.map(({ value, label }) => (
        <Button key={value} quiet={active !== value} size="sm" compact onClick={() => onChange(value)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
