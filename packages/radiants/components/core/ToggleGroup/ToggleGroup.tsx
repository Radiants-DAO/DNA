'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';

// ============================================================================
// Types
// ============================================================================

type ToggleGroupSize = 'sm' | 'md' | 'lg';

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
  /** Size preset applied to all items */
  size?: ToggleGroupSize;
  /** Group content — should be ToggleGroup.Item children */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const toggleGroupRootVariants = cva(
  'inline-flex rounded-xs border border-line overflow-hidden',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
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

const toggleGroupItemVariants = cva(
  `inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   cursor-pointer select-none border-line
   transition-[border-color,background-color,color] duration-150 ease-out
   disabled:opacity-50 disabled:cursor-not-allowed
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:z-10`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs gap-2 [&_svg]:size-3.5',
        md: 'h-7 px-3 text-xs gap-2 [&_svg]:size-4.5',
        lg: 'h-8 px-4 text-sm gap-3 [&_svg]:size-5',
      },
      orientation: {
        horizontal: 'border-r last:border-r-0',
        vertical: 'border-b last:border-b-0',
      },
    },
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
    },
  }
);

// ============================================================================
// Context for passing size/orientation down to items
// ============================================================================

interface ToggleGroupContextValue {
  size: ToggleGroupSize;
  orientation: 'horizontal' | 'vertical';
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: 'md',
  orientation: 'horizontal',
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
}: ToggleGroupItemProps) {
  const { size, orientation } = React.useContext(ToggleGroupContext);

  const itemClasses = toggleGroupItemVariants({
    size,
    orientation,
  });

  return (
    <BaseToggle
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      className={({ pressed }: { pressed: boolean }) => {
        const pressedClasses = pressed
          ? 'bg-accent text-flip'
          : 'bg-page text-main hover:bg-inv hover:text-accent';
        return `${itemClasses} ${pressedClasses} ${className}`.trim();
      }}
      data-slot="toggle-group-item"
      data-size={size}
    >
      {children}
    </BaseToggle>
  );
}

// ============================================================================
// ToggleGroup.Root
// ============================================================================

/**
 * A group of toggle buttons that supports single or multiple selection.
 *
 * Uses Base UI ToggleGroup internally for accessibility and keyboard navigation.
 * Items share borders in a segmented control pattern.
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
  size = 'md',
  children,
  className = '',
}: ToggleGroupProps) {
  const rootClasses = toggleGroupRootVariants({
    orientation,
    disabled,
    className,
  });

  const contextValue = React.useMemo(
    () => ({ size, orientation }),
    [size, orientation]
  );

  return (
    <ToggleGroupContext.Provider value={contextValue}>
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
        {children}
      </BaseToggleGroup>
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
