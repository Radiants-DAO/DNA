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

/**
 * Portal-safe glows — used inside the popup, which teleports outside the
 * `.dark` theme scope. Semantic tokens like `--color-main` resolve to the
 * light-theme ink value in that context, so the popup must use brand
 * primitives directly.
 */
const GLOW_PORTAL =
  'var(--color-sun-yellow) 0 0 0.5px, var(--color-sun-yellow) 0 0 3px, var(--color-cream) 0 0 10px';
const GLOW_HOVER_PORTAL =
  'var(--color-sun-yellow) 0 0 0.5px, var(--color-sun-yellow) 0 0 3px';

/**
 * Popup frame — pure black base, with a 25% cream overlay applied via
 * `background-image`. The black ensures the popup is fully opaque even over
 * transparent surfaces; the cream overlay gives it the subtle washed tone.
 * `margin: -1` pulls the popup 1px in every direction so it bleeds 1px past
 * its anchor (covering the 1px outline gap of the parent cell).
 */
const POPUP_FRAME: React.CSSProperties = {
  backgroundColor: '#000',
  backgroundImage:
    'linear-gradient(oklch(0.9780 0.0295 94.34 / 0.25), oklch(0.9780 0.0295 94.34 / 0.25))',
  padding: 1,
  gap: 1,
  margin: -1,
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
              // Hover: accent yellow + yellow glow — higher specificity than `active` classes below
              'hover:text-[var(--color-accent)]',
              'hover:[text-shadow:var(--color-accent)_0_0_0.5px,var(--color-accent)_0_0_3px]',
              // Active (user-adjusted): cream + full glow
              active && 'text-[var(--color-main)]',
              active &&
                '[text-shadow:var(--color-accent)_0_0_0.5px,var(--color-accent)_0_0_3px,var(--color-main)_0_0_10px]',
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
                style={{ fontSize: 10, lineHeight: 'round(up, 100%, 1px)' }}
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
          sideOffset={0}
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
                ...(popupFullWidth ? { width: 'calc(var(--anchor-width) + 2px)' } : {}),
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
                      ? 'color-mix(in oklch, var(--color-cream) 25%, transparent)'
                      : state.selected
                      ? 'var(--color-cream)'
                      : state.highlighted
                      ? 'var(--color-sun-yellow)'
                      : 'color-mix(in oklch, var(--color-cream) 50%, transparent)',
                    textShadow: state.selected
                      ? GLOW_PORTAL
                      : state.highlighted && !state.disabled
                      ? GLOW_HOVER_PORTAL
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
