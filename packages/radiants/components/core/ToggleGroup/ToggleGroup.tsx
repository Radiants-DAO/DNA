'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '../Toggle/Toggle';
import type { ToggleMode, ToggleTone, ToggleSize, ToggleRounded } from '../Toggle/Toggle';
import { PixelBorder } from '../PixelBorder';

// ============================================================================
// Types
// ============================================================================

interface ToggleGroupItemProps {
  /** Unique value for this item within the group */
  value: string;
  /** Whether this individual item is disabled */
  disabled?: boolean;
  /** Item content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** Icon — RDNA icon name (string) or custom ReactNode */
  icon?: string | React.ReactNode;
  /** Square button showing only the icon */
  iconOnly?: boolean;
  /** Suppress icon slot and leader line */
  textOnly?: boolean;
}

interface ToggleGroupProps {
  /** Whether the group allows multiple items to be pressed simultaneously */
  multiple?: boolean;
  /** The pressed values (controlled) — array of value strings */
  value?: string[];
  /** Initial pressed values for uncontrolled usage */
  defaultValue?: string[];
  /** Callback fired when the pressed values change */
  onValueChange?: (value: string[]) => void;
  /** Whether all items in the group should ignore user interaction */
  disabled?: boolean;
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical';
  /** Visual mode — controls fill treatment. Defaults to 'solid'. */
  mode?: ToggleMode;
  /** Color tone — sets data-color for CSS styling */
  tone?: ToggleTone;
  /** Size preset applied to all items */
  size?: ToggleSize;
  /** Pixel-corner roundness for items (defaults to 'none' inside group) */
  rounded?: ToggleRounded;
  /** Transparent at rest — fills on hover/selected */
  quiet?: boolean;
  /** Compact badge-like styling — uses mono font */
  compact?: boolean;
  /** Group content — should be ToggleGroup.Item children */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const toggleGroupRootVariants = cva(
  'inline-flex',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row items-stretch',
        vertical: 'flex-col',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      disabled: false,
    },
  }
);

// ============================================================================
// Context for passing visual props down to items
// ============================================================================

interface ToggleGroupContextValue {
  size: ToggleSize;
  orientation: 'horizontal' | 'vertical';
  mode: ToggleMode;
  tone: ToggleTone;
  rounded: ToggleRounded;
  quiet: boolean;
  compact: boolean;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: 'md',
  orientation: 'horizontal',
  mode: 'solid',
  tone: 'accent',
  rounded: 'none',
  quiet: true,
  compact: false,
});

// ============================================================================
// ToggleGroup.Item
// ============================================================================

function ToggleGroupItem({
  value,
  disabled = false,
  children,
  className = '',
  'aria-label': ariaLabel,
  icon,
  iconOnly,
  textOnly,
}: ToggleGroupItemProps) {
  const { size, mode, tone, rounded, quiet, compact } =
    React.useContext(ToggleGroupContext);

  return (
    <Toggle
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      mode={mode}
      tone={tone}
      size={size}
      rounded={rounded}
      quiet={quiet}
      compact={compact}
      icon={icon}
      iconOnly={iconOnly}
      textOnly={textOnly}
      className={className}
    >
      {children}
    </Toggle>
  );
}

// ============================================================================
// ToggleGroup.Root
// ============================================================================

/**
 * A group of toggle buttons that supports single or multiple selection.
 *
 * Uses Base UI ToggleGroup internally for accessibility and keyboard navigation.
 * Items render as RDNA Toggle components, inheriting the full Button visual system.
 *
 * Namespace API: `ToggleGroup.Root` + `ToggleGroup.Item`
 * Shorthand: `<ToggleGroup>` renders the root.
 */
function ToggleGroupRoot({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  orientation = 'horizontal',
  mode = 'solid',
  tone = 'accent',
  size = 'md',
  rounded = 'none',
  quiet = true,
  compact = false,
  children,
  className = '',
}: ToggleGroupProps) {
  const rootClasses = toggleGroupRootVariants({
    orientation,
    disabled,
    className,
  });

  const contextValue = React.useMemo(
    () => ({ size, orientation, mode, tone, rounded, quiet, compact }),
    [size, orientation, mode, tone, rounded, quiet, compact]
  );

  // Insert separator spans between items
  const childArray = React.Children.toArray(children);
  const separated = childArray.flatMap((child, i) => {
    if (i === 0) return [child];
    const sep = (
      <span
        key={`sep-${i}`}
        className={
          orientation === 'horizontal'
            ? 'w-px self-stretch bg-line'
            : 'h-px self-stretch bg-line'
        }
        aria-hidden="true"
      />
    );
    return [sep, child];
  });

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <PixelBorder size="xs" className="inline-block">
        <BaseToggleGroup
          multiple={multiple}
          value={value}
          defaultValue={defaultValue}
          onValueChange={(newValue) => onValueChange?.(newValue)}
          disabled={disabled}
          orientation={orientation}
          className={rootClasses}
          data-rdna="togglegroup"
          data-slot="toggle-group"
          data-orientation={orientation}
        >
          {separated}
        </BaseToggleGroup>
      </PixelBorder>
    </ToggleGroupContext.Provider>
  );
}

// ============================================================================
// Namespace Export
// ============================================================================

export const ToggleGroup = Object.assign(ToggleGroupRoot, {
  Item: ToggleGroupItem,
});

export default ToggleGroup;
