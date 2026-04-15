'use client';

import { forwardRef, type ReactNode } from 'react';
import { NumberField } from '@base-ui/react/number-field';

// =============================================================================
// NumberInput — Ctrl draggable numeric cell wrapping @base-ui/react/number-field
//
// Paper ref: SJE-0 W/H row value cells. A 24px-tall black cell matching the
// Dropdown trigger. The cell itself is a NumberField.ScrubArea so clicking
// anywhere outside the Input starts a horizontal drag-to-scrub. Clicking the
// Input focuses it for direct text entry. An optional right slot can hold a
// unit dropdown; an optional left slot can hold a label/prefix.
// =============================================================================

export interface NumberInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  smallStep?: number;
  largeStep?: number;
  placeholder?: string;
  /** Render the value in active (gold glow) state instead of muted */
  active?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Read-only — allows scrub/focus but blocks edits */
  readOnly?: boolean;
  /** ClassName for the outer cell (e.g. "flex-1" inside a PropertyRow) */
  className?: string;
  /** Optional leading content (e.g. a "W"/"H" label) */
  prefix?: ReactNode;
  /** Optional trailing content rendered outside the input box (e.g. a unit dropdown, separated by a 1px gap) */
  suffix?: ReactNode;
  /** Optional trailing content rendered inside the input box after the value (e.g. a "MIN"/"MAX" label) */
  innerSuffix?: ReactNode;
  /** Horizontal scrub sensitivity in pixels per step (default 2) */
  pixelSensitivity?: number;
  /** Optional format for the displayed value */
  format?: Intl.NumberFormatOptions;
  /** Input id for labelling */
  id?: string;
}

/** Shared glow text-shadow for active/selected text (matches Dropdown) — accent + accent + cream bloom */
const GLOW =
  'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px, var(--color-main) 0 0 10px';

export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(
  {
    value,
    onValueChange,
    min,
    max,
    step = 1,
    smallStep,
    largeStep,
    placeholder,
    active = false,
    disabled = false,
    readOnly = false,
    className = '',
    prefix,
    suffix,
    innerSuffix,
    pixelSensitivity = 2,
    format,
    id,
  },
  ref,
) {
  return (
    <NumberField.Root
      id={id}
      value={value}
      onValueChange={(v) => onValueChange(v)}
      min={min}
      max={max}
      step={step}
      smallStep={smallStep}
      largeStep={largeStep}
      disabled={disabled}
      readOnly={readOnly}
      format={format}
      allowWheelScrub
      render={(props) => (
        <div
          {...props}
          ref={ref}
          data-rdna="ctrl-number-input"
          className={['flex items-center font-mono min-w-0 self-stretch', className].filter(Boolean).join(' ')}
          style={{ minHeight: 24, gap: 'var(--ctrl-cell-gap)' }}
        >
          <NumberField.ScrubArea
            direction="vertical"
            pixelSensitivity={pixelSensitivity}
            render={(props) => (
              <span
                {...props}
                className="flex flex-1 items-center self-stretch min-w-0 bg-ctrl-cell-bg"
                style={{
                  cursor: disabled ? 'default' : 'ns-resize',
                  gap: 4,
                  touchAction: 'none',
                }}
              >
                {prefix}
                <NumberField.Input
                  render={(props) => (
                    <input
                      {...props}
                      placeholder={placeholder}
                      className="flex-1 self-stretch bg-transparent outline-none border-none appearance-none min-w-0"
                      style={{
                        fontSize: 10,
                        lineHeight: 'round(up, 100%, 1px)',
                        textAlign: 'left',
                        paddingLeft: 4,
                        cursor: disabled ? 'default' : 'ns-resize',
                        ...(active
                          ? { color: 'var(--color-main)', textShadow: GLOW }
                          : {}),
                      }}
                    />
                  )}
                />
                {innerSuffix}
              </span>
            )}
          />
          {suffix}
        </div>
      )}
    />
  );
});
