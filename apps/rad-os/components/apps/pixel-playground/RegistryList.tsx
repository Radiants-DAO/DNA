'use client';

import type { PixelGrid } from '@rdna/pixel';
import { CompactRowButton } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { PixelThumb } from './PixelThumb';

interface RegistryListProps {
  entries: readonly PixelGrid[];
  selectedName: string | null;
  onSelect: (entry: PixelGrid | null) => void; // null = +New
}

export function RegistryList({
  entries,
  selectedName,
  onSelect,
}: RegistryListProps) {
  return (
    <ul className="flex flex-col px-3 pb-3">
      <li>
        <CompactRowButton
          onClick={() => onSelect(null)}
          selected={selectedName === null}
          className={`font-mono ${selectedName === null ? 'bg-depth text-main' : 'text-mute'}`}
          aria-label="New blank"
          leading={(
            <span className="flex size-5 items-center justify-center">
              <Icon name="plus" />
            </span>
          )}
        >
          New
        </CompactRowButton>
      </li>
      {entries.map((entry) => {
        const selected = selectedName === entry.name;
        return (
          <li key={entry.name}>
            <CompactRowButton
              onClick={() => onSelect(entry)}
              selected={selected}
              className={`font-mono ${selected ? 'bg-depth text-main' : 'text-mute'}`}
              aria-label={entry.name}
              leading={(
                <span className="flex size-5 items-center justify-center">
                  <PixelThumb grid={entry} size={20} />
                </span>
              )}
            >
              {entry.name}
            </CompactRowButton>
          </li>
        );
      })}
    </ul>
  );
}
