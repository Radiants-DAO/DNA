'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '../Toggle/Toggle';
import type { ToggleTone, ToggleSize, ToggleRounded } from '../Toggle/Toggle';

// ============================================================================
// Types
// ============================================================================

interface ToggleGroupItemProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  /** Icon — RDNA icon name (string) or custom ReactNode */
  icon?: string | React.ReactNode;
  /** Square button showing only the icon */
  iconOnly?: boolean;
}

interface ToggleGroupProps {
  /** Allow multiple items to be pressed simultaneously */
  multiple?: boolean;
  /** Controlled selected values */
  value?: string[];
  /** Initial selected values for uncontrolled usage */
  defaultValue?: string[];
  /** Callback fired when the selected values change */
  onValueChange?: (value: string[]) => void;

  disabled?: boolean;
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical';

  /** Color tone applied to all items */
  tone?: ToggleTone;
  /** Size applied to all items */
  size?: ToggleSize;
  /** Pixel-corner roundness applied to all items */
  rounded?: ToggleRounded;

  children?: React.ReactNode;
  className?: string;
}

// ============================================================================
// CVA — group wrapper (ink surface)
// ============================================================================

const toggleGroupRootVariants = cva(
  'inline-flex items-stretch gap-0.5',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row flex-wrap',
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
// Context — passes visual props to items
// ============================================================================

interface ToggleGroupContextValue {
  tone: ToggleTone;
  size: ToggleSize;
  rounded: ToggleRounded;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  tone: 'neutral',
  size: 'xs',
  rounded: 'xs',
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
}: ToggleGroupItemProps) {
  const { tone, size, rounded } = React.useContext(ToggleGroupContext);

  return (
    <Toggle
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      tone={tone}
      size={size}
      rounded={rounded}
      icon={icon}
      iconOnly={iconOnly}
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
 * A group of pressable chips for single or multi-select.
 *
 * Renders as an ink-surfaced container that houses RDNA Toggle items. Uses
 * Base UI ToggleGroup for accessibility and keyboard navigation.
 */
function ToggleGroupRoot({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  orientation = 'horizontal',
  tone = 'neutral',
  size = 'xs',
  rounded = 'xs',
  children,
  className = '',
}: ToggleGroupProps) {
  const rootClasses = toggleGroupRootVariants({
    orientation,
    disabled,
    className,
  });

  const contextValue = React.useMemo(
    () => ({ tone, size, rounded }),
    [tone, size, rounded]
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
