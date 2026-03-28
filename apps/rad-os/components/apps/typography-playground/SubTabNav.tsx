'use client';
import { Button } from '@rdna/radiants/components/core';
import { type SubTab } from './TypographyPlayground';

interface SubTabNavProps {
  active: SubTab;
  onChange: (tab: SubTab) => void;
}

const SUB_TABS: { value: SubTab; label: string }[] = [
  { value: 'manual', label: 'Type Manual' },
  { value: 'usage', label: 'Usage Guide' },
  { value: 'styles', label: 'Type Styles' },
];

export function SubTabNav({ active, onChange }: SubTabNavProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {SUB_TABS.map(({ value, label }) => (
        <Button
          key={value}
          quiet={active !== value}
          size="sm"
          compact
          onClick={() => onChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
