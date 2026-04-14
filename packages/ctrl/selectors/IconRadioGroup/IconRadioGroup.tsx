'use client';

import { type ReactNode } from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { Tooltip } from '../../readouts/Tooltip/Tooltip';

// =============================================================================
// IconRadioGroup — Ctrl icon-cell radio group with tooltips
//
// Paper ref: SJE-0 display-mode strip (eye / resize / position / float / auto).
// Each item is a 20px-tall black cell with a centered icon (or short label).
// Active item renders icon in accent gold with glow text-shadow. Each item is
// wrapped in a ctrl Tooltip for hover description.
// =============================================================================

export interface IconRadioOption {
  value: string;
  /** Icon or glyph node rendered inside the cell */
  icon: ReactNode;
  /** Tooltip label (required — accessibility + discoverability) */
  tooltip: string;
}

export interface IconRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: IconRadioOption[];
  className?: string;
  /** Cell height, defaults to 20 to match Paper SJE-0 icon strip */
  cellHeight?: number;
}

const GLOW =
  'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px, var(--color-accent) 0 0 8px';

export function IconRadioGroup({
  value,
  onValueChange,
  options,
  className = '',
  cellHeight = 20,
}: IconRadioGroupProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      className={['flex self-stretch', className].filter(Boolean).join(' ')}
      data-rdna="ctrl-icon-radio-group"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Tooltip key={option.value} content={option.tooltip}>
            <Radio.Root
              value={option.value}
              nativeButton
              render={(props) => (
                <button
                  {...props}
                  type="button"
                  data-active={isActive || undefined}
                  className="flex flex-1 items-center justify-center self-stretch bg-black gap-1 px-1 cursor-pointer focus-visible:outline-none"
                  style={{
                    height: cellHeight,
                    ...(isActive
                      ? { color: 'var(--color-accent)', textShadow: GLOW }
                      : {}),
                  }}
                >
                  {option.icon}
                </button>
              )}
            />
          </Tooltip>
        );
      })}
    </RadioGroup>
  );
}
