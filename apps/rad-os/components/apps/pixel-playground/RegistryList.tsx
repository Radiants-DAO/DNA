'use client';

import type { PixelGrid } from '@rdna/pixel';
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
        {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:list-row-button-chrome-too-heavy owner:design expires:2027-01-01 issue:DNA-001 */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-depth ${
            selectedName === null ? 'bg-depth text-main' : 'text-mute'
          }`}
          aria-label="New blank"
        >
          <span className="w-5 h-5 shrink-0 flex items-center justify-center">
            <Icon name="plus" />
          </span>
          <span className="font-mono text-xs truncate">New</span>
        </button>
      </li>
      {entries.map((entry) => {
        const selected = selectedName === entry.name;
        return (
          <li key={entry.name}>
            {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:list-row-button-chrome-too-heavy owner:design expires:2027-01-01 issue:DNA-001 */}
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className={`w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-depth ${
                selected ? 'bg-depth text-main' : 'text-mute'
              }`}
              aria-label={entry.name}
            >
              <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                <PixelThumb grid={entry} size={20} />
              </span>
              <span className="font-mono text-xs truncate">{entry.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
