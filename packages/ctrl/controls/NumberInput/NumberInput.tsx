'use client';

import { type ReactNode } from 'react';
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
  /** Optional leading content (e.g. a "W"/"H"/"MIN"/"MAX" label) */
  prefix?: ReactNode;
  /** Optional trailing content (e.g. a unit dropdown) */
  suffix?: ReactNode;
  /** Horizontal scrub sensitivity in pixels per step (default 2) */
  pixelSensitivity?: number;
  /** Optional format for the displayed value */
  format?: Intl.NumberFormatOptions;
  /** Input id for labelling */
  id?: string;
}

/** Shared glow-only text-shadow for active/selected text (matches Dropdown) */
const GLOW =
  'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px, var(--color-accent) 0 0 8px';

export function NumberInput({
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
  pixelSensitivity = 2,
  format,
  id,
}: NumberInputProps) {
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
          data-rdna="ctrl-number-input"
          className={['flex items-center bg-black font-mono', className].filter(Boolean).join(' ')}
          style={{ height: 24 }}
        >
          <NumberField.ScrubArea
            direction="horizontal"
            pixelSensitivity={pixelSensitivity}
            render={(props) => (
              <span
                {...props}
                className="flex flex-1 items-center self-stretch"
                style={{
                  cursor: disabled ? 'default' : 'ew-resize',
                  paddingInline: 4,
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
                      className="flex-1 bg-transparent outline-none border-none appearance-none min-w-0"
                      style={{
                        fontSize: 10,
                        lineHeight: 'round(up, 100%, 1px)',
                        textAlign: 'left',
                        cursor: disabled ? 'default' : 'text',
                        ...(active
                          ? { color: 'var(--color-accent)', textShadow: GLOW }
                          : {}),
                      }}
                      onPointerDown={(e) => {
                        // Let the input receive pointer events so the user can
                        // click to place the caret. The ScrubArea still handles
                        // drags that start on the surrounding padding / prefix.
                        e.stopPropagation();
                      }}
                    />
                  )}
                />
              </span>
            )}
          />
          {suffix}
        </div>
      )}
    />
  );
}
