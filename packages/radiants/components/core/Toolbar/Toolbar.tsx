'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { SegmentGroup } from '../_shared/SegmentGroup';


// ============================================================================
// Types
// ============================================================================

interface ToolbarRootProps {
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical';
  /** Whether all toolbar items are disabled */
  disabled?: boolean;
  /** Toolbar content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface ToolbarButtonProps {
  /** Whether this button is disabled */
  disabled?: boolean;
  /** Button content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Accessible label */
  'aria-label'?: string;
}

interface ToolbarSeparatorProps {
  /** Additional className */
  className?: string;
}

interface ToolbarLinkProps {
  /** Link destination */
  href?: string;
  /** Link content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Link target */
  target?: string;
}

interface ToolbarGroupProps {
  /** Whether all items in this group are disabled */
  disabled?: boolean;
  /** Group content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

// `disabled` is still Toolbar-specific; layout + surface delegate to
// SegmentGroup. Root-specific paint / opacity lives here.
const toolbarRootVariants = cva('', {
  variants: {
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: '',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const toolbarButtonVariants = cva(
  `inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   cursor-pointer select-none
   bg-transparent text-flip
   transition-[background-color,color] duration-[var(--duration-base)] ease-out
   disabled:opacity-50 disabled:cursor-not-allowed
   focus-visible:outline-none
   h-7 px-2 text-xs gap-2 [&_svg]:size-4
   pixel-rounded-4`,
  {
    variants: {
      variant: {
        ghost: '',
        flat: '',
      },
    },
    defaultVariants: {
      variant: 'ghost',
    },
  }
);

// Separator: base paints line colour. Orientation variants describe
// the separator's own geometry relative to the parent toolbar:
//   horizontal toolbar  → vertical line (`w-px self-stretch`)
//   vertical   toolbar  → horizontal line (`h-px w-full`)
// The previous `vertical` variant rendered 0-width because it lacked
// both `w-full` and `self-stretch`. That is the F10 bug.
const toolbarSeparatorVariants = cva('bg-line', {
  variants: {
    orientation: {
      horizontal: 'w-px self-stretch mx-0.5',
      vertical: 'h-px w-full my-1',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

const toolbarLinkVariants = cva(
  `inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   cursor-pointer select-none no-underline
   bg-transparent text-flip
   transition-[background-color,color] duration-[var(--duration-base)] ease-out
   focus-visible:outline-none
   h-7 px-2 text-xs gap-2 [&_svg]:size-4
   pixel-rounded-4`
);

// ============================================================================
// Context for passing orientation to sub-components
// ============================================================================

const ToolbarOrientationContext = React.createContext<'horizontal' | 'vertical'>('horizontal');

// ============================================================================
// Sub-components
// ============================================================================

function ToolbarRoot({
  orientation = 'horizontal',
  disabled = false,
  children,
  className = '',
}: ToolbarRootProps) {
  const stateClasses = toolbarRootVariants({ disabled });

  return (
    <ToolbarOrientationContext.Provider value={orientation}>
      <SegmentGroup
        orientation={orientation}
        density="compact"
        surface="page"
        corner="sm"
        className={`${stateClasses} ${className}`.trim()}
        render={({ className: segClassName }) => (
          <BaseToolbar.Root
            orientation={orientation}
            disabled={disabled}
            className={segClassName}
            data-rdna="toolbar"
            data-slot="toolbar"
            data-orientation={orientation}
          >
            {children}
          </BaseToolbar.Root>
        )}
      />
    </ToolbarOrientationContext.Provider>
  );
}

function ToolbarButton({
  disabled = false,
  children,
  className = '',
  onClick,
  'aria-label': ariaLabel,
}: ToolbarButtonProps) {
  const classes = toolbarButtonVariants({ className });

  return (
    <BaseToolbar.Button
      disabled={disabled}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      data-slot="button-face"
      data-quiet
      data-color="accent"
    >
      {children}
    </BaseToolbar.Button>
  );
}

function ToolbarSeparator({ className = '' }: ToolbarSeparatorProps) {
  const orientation = React.useContext(ToolbarOrientationContext);
  const classes = toolbarSeparatorVariants({ orientation, className });

  return (
    <BaseToolbar.Separator
      className={classes}
      data-slot="toolbar-separator"
    />
  );
}

function ToolbarLink({
  href,
  children,
  className = '',
  target,
}: ToolbarLinkProps) {
  const classes = toolbarLinkVariants({ className });

  return (
    <BaseToolbar.Link
      href={href}
      target={target}
      className={classes}
      data-slot="toolbar-link"
    >
      {children}
    </BaseToolbar.Link>
  );
}

function ToolbarGroup({
  disabled = false,
  children,
  className = '',
}: ToolbarGroupProps) {
  const orientation = React.useContext(ToolbarOrientationContext);
  return (
    <SegmentGroup
      orientation={orientation}
      density="none"
      surface="none"
      corner="none"
      className={className}
      render={({ className: segClassName }) => (
        <BaseToolbar.Group
          disabled={disabled}
          className={segClassName}
          data-slot="toolbar-group"
        >
          {children}
        </BaseToolbar.Group>
      )}
    />
  );
}

// ============================================================================
// Namespace Export
// ============================================================================

export const Toolbar = {
  Root: ToolbarRoot,
  Button: ToolbarButton,
  Separator: ToolbarSeparator,
  Link: ToolbarLink,
  Group: ToolbarGroup,
};
