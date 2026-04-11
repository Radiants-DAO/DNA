'use client';

import type { ReactNode } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';

// =============================================================================
// Dropdown — Ctrl dropdown selector wrapping @base-ui/react/select
//
// Paper ref: E2S-0 (unit picker) / E3O-0 (blend mode picker)
// A dark cell trigger with label + caret, opening a menu with selected item
// highlighted in gold glow and unselected items in dim cream. Behavior comes
// from base-ui; visual layer is ctrl-specific.
// =============================================================================

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  /** Placeholder when no value is set */
  placeholder?: string;
  /** Render the current value in active (gold glow) state instead of muted */
  active?: boolean;
  /** ClassName for the trigger cell (e.g. "flex-1" inside a PropertyRow) */
  className?: string;
  /** Optional leading content before the value (e.g. a scrubber-linked number) */
  prefix?: ReactNode;
  /** Suppress the built-in caret */
  hideCaret?: boolean;
  /** Suppress the current-value label (trigger shows caret only) */
  hideLabel?: boolean;
  /** Align popup to trigger — "start" (default) or "end" */
  align?: 'start' | 'end';
}

/** Shared glow-only text-shadow for active/selected text (matches Paper exactly) */
const GLOW =
  'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px, var(--color-accent) 0 0 8px';

/** Popup frame — cream 25% outline wrap + pixel-art drop shadow */
const POPUP_FRAME: React.CSSProperties = {
  backgroundColor: 'oklch(0.9780 0.0295 94.34 / 0.25)',
  padding: 1,
  gap: 1,
  boxShadow:
    '0 2px 4px 0 oklch(0 0 0 / 1), 0 4px 12px 0 oklch(0 0 0 / 1), 0 0 0 1px oklch(0.9780 0.0295 94.34 / 0.0625)',
  fontSynthesis: 'none',
  WebkitFontSmoothing: 'antialiased',
};

/** Selected item bg — pure black */
const ITEM_BG_SELECTED = 'oklch(0 0 0)';
/** Unselected item bg — black 80% (Paper spec) */
const ITEM_BG_UNSELECTED = 'oklch(0 0 0 / 0.8)';

export function Dropdown({
  value,
  onValueChange,
  options,
  placeholder = '',
  active = false,
  className = '',
  prefix,
  hideCaret = false,
  hideLabel = false,
  align = 'start',
}: DropdownProps) {
  const currentLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <BaseSelect.Root
      value={value || null}
      onValueChange={(v) => {
        if (v !== null) onValueChange(v as string);
      }}
      modal={false}
    >
      <BaseSelect.Trigger
        render={(props) => (
          <button
            {...props}
            type="button"
            data-rdna="ctrl-dropdown-trigger"
            className={[
              'flex items-center justify-between bg-black font-mono cursor-pointer',
              'focus-visible:outline-none',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ height: 24, paddingInline: 4, gap: 4 }}
          >
            {prefix}
            {!hideLabel && (
              <span
                className="shrink-0"
                style={{
                  fontSize: 10,
                  lineHeight: 'round(up, 100%, 1px)',
                  ...(active ? { color: 'var(--color-accent)', textShadow: GLOW } : {}),
                }}
              >
                {currentLabel}
              </span>
            )}
            {!hideCaret && (
              <span
                className="shrink-0"
                style={{
                  fontSize: 10,
                  lineHeight: 'round(up, 100%, 1px)',
                  marginLeft: 'auto',
                  width: 'max-content',
                }}
              >
                ▾
              </span>
            )}
          </button>
        )}
      />
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          className="z-50"
          sideOffset={1}
          align={align}
        >
          <BaseSelect.Popup>
            <div
              className="flex flex-col font-mono"
              data-rdna="ctrl-dropdown-popup"
              style={POPUP_FRAME}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className="flex items-center shrink-0 cursor-pointer focus-visible:outline-none"
                    style={{
                      height: 20,
                      paddingInline: 4,
                      backgroundColor: isSelected ? ITEM_BG_SELECTED : ITEM_BG_UNSELECTED,
                    }}
                  >
                    <BaseSelect.ItemText
                      render={
                        <span
                          className="shrink-0"
                          style={{
                            fontSize: 10,
                            lineHeight: '12px',
                            ...(isSelected
                              ? { color: 'var(--color-accent)', textShadow: GLOW }
                              : {
                                  color:
                                    'color-mix(in oklch, var(--color-cream) 37.5%, transparent)',
                                }),
                          }}
                        >
                          {option.label}
                        </span>
                      }
                    />
                  </BaseSelect.Item>
                );
              })}
            </div>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
