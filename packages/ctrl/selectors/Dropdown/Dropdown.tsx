'use client';

import { type ReactNode, type RefObject } from 'react';
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
  /**
   * Optional anchor element or ref. When set, the popup is positioned against
   * this element instead of the trigger button. Use to anchor to a parent row
   * or cell so the popup width can match the row width.
   */
  anchor?: Element | RefObject<Element | null> | null;
  /**
   * When true, the popup width matches the anchor element's width via
   * `var(--anchor-width)`. Combine with `anchor` to anchor to a parent row.
   */
  popupFullWidth?: boolean;
}

/** Full glow — accent 0.5px + accent 3px + main (cream) 10px. Used for selected/active/title. */
const GLOW =
  'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px, var(--color-main) 0 0 10px';

/** Hover glow — accent 0.5px + accent 3px only (no cream bloom). */
const GLOW_HOVER = 'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px';

/**
 * Popup frame — pure black base, with a 25% cream overlay applied via
 * `background-image`. The black ensures the popup is fully opaque even over
 * transparent surfaces; the cream overlay gives it the subtle washed tone.
 */
const POPUP_FRAME: React.CSSProperties = {
  backgroundColor: '#000',
  backgroundImage:
    'linear-gradient(oklch(0.9780 0.0295 94.34 / 0.25), oklch(0.9780 0.0295 94.34 / 0.25))',
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
  anchor,
  popupFullWidth = false,
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
              'flex items-center justify-between bg-black font-mono cursor-pointer self-stretch',
              'focus-visible:outline-none',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ minHeight: 24, paddingInline: 4, gap: 4 }}
          >
            {prefix}
            {!hideLabel && (
              <span
                className="shrink-0"
                style={{
                  fontSize: 10,
                  lineHeight: 'round(up, 100%, 1px)',
                  ...(active ? { color: 'var(--color-main)', textShadow: GLOW } : {}),
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
          side="bottom"
          sideOffset={1}
          align={align}
          anchor={anchor ?? undefined}
          alignItemWithTrigger={anchor ? false : undefined}
        >
          <BaseSelect.Popup>
            <div
              className="flex flex-col font-mono"
              data-rdna="ctrl-dropdown-popup"
              style={{
                ...POPUP_FRAME,
                ...(popupFullWidth ? { width: 'var(--anchor-width)' } : {}),
              }}
            >
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex items-center shrink-0 cursor-pointer focus-visible:outline-none"
                  style={(state) => ({
                    height: 20,
                    paddingInline: 4,
                    backgroundColor: state.selected ? ITEM_BG_SELECTED : ITEM_BG_UNSELECTED,
                    color: state.disabled
                      ? 'color-mix(in oklch, var(--color-main) 25%, transparent)'
                      : state.selected
                      ? 'var(--color-main)'
                      : state.highlighted
                      ? 'var(--color-accent)'
                      : 'color-mix(in oklch, var(--color-main) 50%, transparent)',
                    textShadow: state.selected
                      ? GLOW
                      : state.highlighted && !state.disabled
                      ? GLOW_HOVER
                      : 'none',
                  })}
                >
                  <BaseSelect.ItemText
                    render={
                      <span
                        className="shrink-0"
                        style={{ fontSize: 10, lineHeight: '12px' }}
                      >
                        {option.label}
                      </span>
                    }
                  />
                </BaseSelect.Item>
              ))}
            </div>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
