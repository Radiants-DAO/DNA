'use client';

import { type RefObject } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';

// =============================================================================
// ColorPicker — Ctrl color picker dropdown wrapping @base-ui/react/select
//
// Paper ref: SJE-0 Border row color slot. A small swatch + hex trigger opens
// a 3-column grid of brand color swatches, with an optional "Custom" row at
// the bottom. Pass `onCustomClick` to wire the Custom row to a full-featured
// picker (HSB/eyedropper) later; omit it to hide the row entirely.
// =============================================================================

export interface ColorSwatchOption {
  /** Stored color value — typically a CSS custom-property reference. */
  value: string;
  /** Display label (usually a hex code) shown in the trigger when selected. */
  label: string;
}

export interface ColorPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  swatches: ColorSwatchOption[];
  /** If provided, a "Custom" button row appears under the swatch grid. */
  onCustomClick?: () => void;
  /** Align popup to trigger — "start" (default) or "end". */
  align?: 'start' | 'end';
  /** Optional anchor element or ref — see Dropdown.anchor. */
  anchor?: Element | RefObject<Element | null> | null;
  /** Classname for the trigger button. */
  className?: string;
}

/** Portal-safe glow — brand primitives only; popup escapes `.dark` context. */
const GLOW_HOVER_PORTAL =
  'var(--color-sun-yellow) 0 0 0.5px, var(--color-sun-yellow) 0 0 3px';

/** Mirrors Dropdown.POPUP_FRAME — kept local to avoid a shared-helpers module. */
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

const CUSTOM_ROW_BG = 'oklch(0 0 0 / 0.8)';
const CUSTOM_SENTINEL = '__ctrl-color-picker-custom__';

export function ColorPicker({
  value,
  onValueChange,
  swatches,
  onCustomClick,
  align = 'start',
  anchor,
  className = '',
}: ColorPickerProps) {
  const currentLabel = swatches.find((s) => s.value === value)?.label ?? value;

  return (
    <BaseSelect.Root
      value={value || null}
      onValueChange={(v) => {
        if (v === CUSTOM_SENTINEL) {
          onCustomClick?.();
          return;
        }
        if (v !== null) onValueChange(v as string);
      }}
      modal={false}
    >
      <BaseSelect.Trigger
        render={(props) => (
          <button
            {...props}
            type="button"
            data-rdna="ctrl-color-picker-trigger"
            // Stop pointerdown from reaching a parent NumberField.ScrubArea so
            // the button behaves as a click target, not a drag surface.
            onPointerDown={(e) => e.stopPropagation()}
            className={[
              'flex items-center shrink-0 font-mono cursor-pointer',
              'focus-visible:outline-none',
              'hover:text-[var(--color-accent)]',
              'hover:[text-shadow:var(--color-accent)_0_0_0.5px,var(--color-accent)_0_0_3px]',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ gap: 4 }}
          >
            <span
              aria-hidden
              className="shrink-0"
              style={{
                width: 10,
                height: 10,
                backgroundColor: value,
                boxShadow: `${value} 0 0 2px`,
              }}
            />
            <span
              className="shrink-0 uppercase"
              style={{ fontSize: 8, lineHeight: '10px' }}
            >
              {currentLabel}
            </span>
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
          alignItemWithTrigger={false}
        >
          <BaseSelect.Popup>
            <div
              data-rdna="ctrl-color-picker-popup"
              className="font-mono"
              style={{
                ...POPUP_FRAME,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 24px)',
              }}
            >
              {swatches.map((swatch) => (
                <BaseSelect.Item
                  key={swatch.value}
                  value={swatch.value}
                  className="flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none"
                  style={(state) => ({
                    width: 24,
                    height: 24,
                    backgroundColor: swatch.value,
                    boxShadow: state.selected
                      ? 'inset 0 0 0 1px var(--color-cream), 0 0 6px var(--color-sun-yellow)'
                      : state.highlighted
                      ? 'inset 0 0 0 1px var(--color-sun-yellow)'
                      : 'none',
                  })}
                >
                  <BaseSelect.ItemText render={<span className="sr-only">{swatch.label}</span>} />
                </BaseSelect.Item>
              ))}
              {onCustomClick && (
                <BaseSelect.Item
                  value={CUSTOM_SENTINEL}
                  className="flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none"
                  style={(state) => ({
                    gridColumn: '1 / -1',
                    height: 20,
                    paddingInline: 4,
                    backgroundColor: CUSTOM_ROW_BG,
                    color: state.highlighted
                      ? 'var(--color-sun-yellow)'
                      : 'color-mix(in oklch, var(--color-cream) 50%, transparent)',
                    textShadow: state.highlighted ? GLOW_HOVER_PORTAL : 'none',
                  })}
                >
                  <BaseSelect.ItemText
                    render={
                      <span
                        className="shrink-0 uppercase"
                        style={{ fontSize: 10, lineHeight: '12px' }}
                      >
                        Custom
                      </span>
                    }
                  />
                </BaseSelect.Item>
              )}
            </div>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
