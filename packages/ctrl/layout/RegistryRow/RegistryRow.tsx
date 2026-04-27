'use client';

import type { ReactNode } from 'react';

// =============================================================================
// RegistryRow — compact list row for registry-style pickers inside a ctrl panel.
//
// Shaped for read-only-style lists (pattern/icon/corner registries, preset
// library pickers) where each row surfaces a small leading thumbnail and a
// truncating label. No action cells — use LayerRow when the row needs inline
// reorder/visibility/delete controls.
//
// Cell chrome matches PropertyRow / LayerRow (dark cell bg, gold glow when
// selected) so it slots cleanly next to them inside a Section.
// =============================================================================

interface RegistryRowProps {
  label: string;
  /** Leading thumbnail — typically a 16×16 icon or mini-preview. */
  thumb?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  /** Whether this row participates in a radiogroup. Default 'button' (plain). */
  mode?: 'radio' | 'button';
  /** Optional title override — defaults to `label`. */
  title?: string;
  className?: string;
}

export function RegistryRow({
  label,
  thumb,
  selected = false,
  disabled = false,
  onSelect,
  mode = 'button',
  title,
  className = '',
}: RegistryRowProps) {
  const radio = mode === 'radio';
  return (
    <button
      type="button"
      data-rdna="ctrl-registry-row"
      data-selected={selected || undefined}
      role={radio ? 'radio' : undefined}
      aria-checked={radio ? selected : undefined}
      aria-pressed={!radio ? selected : undefined}
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={onSelect}
      className={[
        'w-full flex items-center gap-2 px-2 min-h-5 text-left',
        'font-mono text-[0.625rem] uppercase tracking-wider',
        'outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
        'transition-colors duration-fast',
        selected
          ? 'bg-ctrl-cell-bg text-ctrl-text-active'
          : 'text-ctrl-label hover:text-ctrl-value',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        selected ? { textShadow: '0 0 8px var(--glow-sun-yellow)' } : undefined
      }
    >
      {thumb !== undefined && (
        <span className="w-4 h-4 shrink-0 flex items-center justify-center">
          {thumb}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}
