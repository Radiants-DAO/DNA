'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

// =============================================================================
// IconCell — Square icon-only cell used in radio grids.
//
// Selection language:
//   - selected: solid ink fill + cream icon (no pattern, no hover effect).
//   - deselected idle: cell-bg fill + main icon, no pattern.
//   - deselected hover: diagonal-stripe overlay sits behind the icon.
// =============================================================================

type IconCellSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<IconCellSize, string> = {
  xs: 'h-5 w-5',
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

interface IconCellProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick' | 'disabled' | 'title' | 'aria-label'
  > {
  children: ReactNode;
  label: string;
  title?: string;
  onClick?: () => void;
  selected?: boolean;
  mode?: 'radio' | 'button';
  disabled?: boolean;
  size?: IconCellSize;
  /** Drop the cell outline. Selection still uses pattern-only language. */
  chromeless?: boolean;
  className?: string;
}

export function IconCell({
  children,
  label,
  title,
  onClick,
  selected = false,
  mode = 'button',
  disabled = false,
  size,
  chromeless = false,
  className = '',
  ...rest
}: IconCellProps) {
  const isRadio = mode === 'radio';
  const sizeClass = size ? SIZE_CLASSES[size] : 'aspect-square';

  const outlineClasses = chromeless
    ? 'focus-visible:outline-2 focus-visible:outline-ctrl-glow'
    : 'outline-1 outline-ctrl-border-inactive focus-visible:outline-2 focus-visible:outline-ctrl-glow';

  const textClasses = selected ? 'text-flip' : 'text-main';

  return (
    <button
      {...rest}
      type="button"
      data-rdna="ctrl-icon-cell"
      role={isRadio ? 'radio' : undefined}
      aria-checked={isRadio ? selected : undefined}
      aria-pressed={!isRadio && selected ? true : undefined}
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className={[
        sizeClass,
        'group relative flex items-center justify-center shrink-0',
        'transition-colors duration-fast',
        selected ? 'bg-ink' : 'bg-ctrl-cell-bg',
        outlineClasses,
        textClasses,
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ].filter(Boolean).join(' ')}
    >
      {!selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden group-hover:block"
          style={{
            backgroundColor: 'var(--color-ctrl-label)',
            WebkitMaskImage: 'var(--pat-diagonal)',
            maskImage: 'var(--pat-diagonal)',
            WebkitMaskSize: '8px 8px',
            maskSize: '8px 8px',
            WebkitMaskRepeat: 'repeat',
            maskRepeat: 'repeat',
          }}
        />
      )}
      <span className="relative inline-flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}
