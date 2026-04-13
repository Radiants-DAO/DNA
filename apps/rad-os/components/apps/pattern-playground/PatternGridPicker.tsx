'use client';

import { useState } from 'react';
import { Pattern } from '@rdna/radiants/components/core';
import {
  PATTERN_GROUPS,
  getPatternsByGroup,
} from '@rdna/radiants/patterns';

interface PatternGridPickerProps {
  selected: string;
  onSelect: (name: string) => void;
  color: string;
}

export function PatternGridPicker({ selected, onSelect, color }: PatternGridPickerProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-2">
      {PATTERN_GROUPS.map((group) => {
        const entries = getPatternsByGroup(group.key);
        const isCollapsed = collapsed[group.key] ?? false;

        return (
          <div key={group.key}>
            {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:disclosure-trigger owner:design expires:2027-01-01 issue:DNA-001 */}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
              className="flex items-center gap-1.5 w-full text-left py-1 group cursor-pointer"
            >
              <span className="font-mono text-xs text-mute transition-transform duration-fast"
                style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              >
                ▾
              </span>
              <span className="font-heading text-xs text-sub uppercase tracking-wide">
                {group.label}
              </span>
              <span className="font-mono text-xs text-mute ml-auto">{entries.length}</span>
            </button>

            {!isCollapsed && (
              <div className="grid grid-cols-6 gap-1 mt-1">
                {entries.map((entry) => (
                  <div
                    key={entry.name}
                    className={`pixel-rounded-xs aspect-square transition-shadow duration-fast ${
                      selected === entry.name ? 'pixel-shadow-raised ring-1 ring-accent' : 'hover:pixel-shadow-surface'
                    }`}
                  >
                    {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:pattern-swatch-button owner:design expires:2027-01-01 issue:DNA-001 */}
                    <button
                      type="button"
                      onClick={() => onSelect(entry.name)}
                      title={`${entry.name} (${entry.fill}%)`}
                      className="relative w-full h-full cursor-pointer"
                    >
                      <Pattern
                        pat={entry.name}
                        color={color}
                        scale={1}
                        style={{ position: 'absolute', inset: 0 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
