'use client';

import { useState, useCallback } from 'react';
import type { RegistryEntry } from '@rdna/radiants/registry';
import { Input } from '@rdna/radiants/components/core';
import { ComponentCodeOutput } from './ui-library/ComponentCodeOutput';
import {
  type GroupedCategory,
  useRegistryBrowserEntries,
} from './ui-library/browser-state';

export interface UILibraryState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedEntry: RegistryEntry | null;
  setSelectedEntry: (entry: RegistryEntry | null) => void;
  grouped: GroupedCategory[];
}

export function useUILibrary(): UILibraryState {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<RegistryEntry | null>(null);
  const { grouped } = useRegistryBrowserEntries(searchQuery, 'all');

  return {
    searchQuery,
    setSearchQuery,
    selectedEntry,
    setSelectedEntry,
    grouped,
  };
}

export function UILibraryNavigator({
  searchQuery,
  setSearchQuery,
  grouped,
  selectedEntry,
  setSelectedEntry,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  grouped: GroupedCategory[];
  selectedEntry: RegistryEntry | null;
  setSelectedEntry: (entry: RegistryEntry | null) => void;
}) {
  const handleSelect = useCallback(
    (entry: RegistryEntry) => {
      setSelectedEntry(selectedEntry?.name === entry.name ? null : entry);
      document.getElementById(`component-${entry.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [selectedEntry, setSelectedEntry],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 p-3 border-b border-rule">
        <Input
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          placeholder="Search..."
          fullWidth
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.category}>
            <div className="px-3 py-2 border-b border-rule bg-depth">
              <span className="font-mono text-xs text-mute uppercase tracking-wide">
                {group.label}
              </span>
            </div>
            {group.entries.map((entry) => (
              // eslint-disable-next-line rdna/prefer-rdna-components -- reason:navigator-list-item owner:design expires:2027-01-01 issue:DNA-001
              <button
                key={entry.name}
                type="button"
                onClick={() => handleSelect(entry)}
                className={`w-full text-left px-3 py-1.5 font-mono text-xs cursor-pointer transition-colors ${
                  selectedEntry?.name === entry.name
                    ? 'bg-accent text-flip font-bold'
                    : 'text-main hover:bg-hover'
                }`}
              >
                {entry.name}
              </button>
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="font-mono text-xs text-mute text-center py-6">No results</p>
        )}
      </div>
    </div>
  );
}

export function UILibraryCode({
  selectedEntry,
  propValues,
}: {
  selectedEntry: RegistryEntry | null;
  propValues: Record<string, unknown>;
}) {
  if (!selectedEntry) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">
          Code output appears here
        </p>
      </div>
    );
  }

  return <ComponentCodeOutput entry={selectedEntry} propValues={propValues} />;
}
