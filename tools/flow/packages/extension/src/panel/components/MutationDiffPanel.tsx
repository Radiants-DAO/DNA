/**
 * MutationDiffPanel component.
 *
 * Displays all accumulated diffs grouped by element.
 * Shows property/old/new values with clear and revert controls.
 */

import { useMemo } from 'react';
import type { MutationDiff } from '@flow/shared';

interface MutationDiffPanelProps {
  diffs: MutationDiff[];
  onRevert: (mutationId: string) => void;
  onRevertAll: () => void;
  onClear: () => void;
}

export function MutationDiffPanel({
  diffs,
  onRevert,
  onRevertAll,
  onClear,
}: MutationDiffPanelProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, MutationDiff[]>();
    for (const diff of diffs) {
      const key = diff.element.selector;
      const arr = map.get(key) ?? [];
      arr.push(diff);
      map.set(key, arr);
    }
    return map;
  }, [diffs]);

  if (diffs.length === 0) {
    return (
      <div className="p-4 text-sub text-sm">
        No mutations captured. Edit styles or text on the page to see diffs
        here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Header controls */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-main">
          {diffs.length} mutation{diffs.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onRevertAll}
            className="text-xs px-2 py-1 rounded bg-inv text-main hover:bg-tinted"
          >
            Revert All
          </button>
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 rounded bg-inv text-main hover:bg-tinted"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Grouped diffs */}
      {Array.from(grouped.entries()).map(([selector, elementDiffs]) => (
        <div
          key={selector}
          className="border border-line rounded bg-page"
        >
          {/* Element header */}
          <div className="px-3 py-2 border-b border-line bg-inv">
            <code className="text-xs text-main">{selector}</code>
            {elementDiffs[0].element.componentName && (
              <span className="ml-2 text-xs text-sub">
                ({elementDiffs[0].element.componentName})
              </span>
            )}
            {elementDiffs[0].element.sourceFile && (
              <span className="ml-2 text-xs text-content-tertiary">
                {elementDiffs[0].element.sourceFile}
                {elementDiffs[0].element.sourceLine
                  ? `:${elementDiffs[0].element.sourceLine}`
                  : ''}
              </span>
            )}
          </div>

          {/* Property changes */}
          <div className="divide-y divide-line">
            {elementDiffs.map((diff) =>
              diff.changes.map((change, i) => (
                <div
                  key={`${diff.id}-${i}`}
                  className="flex items-center gap-3 px-3 py-1.5 text-xs"
                >
                  <span className="font-mono text-main w-32 shrink-0">
                    {change.property}
                  </span>
                  <span className="text-red-500 line-through">
                    {change.oldValue || '(none)'}
                  </span>
                  <span className="text-sub">&rarr;</span>
                  <span className="text-green-500">
                    {change.newValue || '(none)'}
                  </span>
                  {i === 0 ? (
                    <button
                      onClick={() => onRevert(diff.id)}
                      className="ml-auto text-content-tertiary hover:text-main"
                      title="Revert this change"
                    >
                      &times;
                    </button>
                  ) : (
                    <span className="ml-auto w-4" aria-hidden="true" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
