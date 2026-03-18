'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';

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

const toolbarRootVariants = cva(
  `inline-flex items-center gap-0.5 bg-page/80 backdrop-blur-sm rounded-sm px-0.5 py-0.5`,
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

const toolbarButtonVariants = cva(
  `inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   cursor-pointer select-none
   bg-transparent text-flip
   transition-[background-color,color] duration-150 ease-out
   hover:bg-inv hover:text-accent
   active:bg-inv active:text-accent
   disabled:opacity-50 disabled:cursor-not-allowed
   focus-visible:outline-none
   h-7 px-2 text-xs gap-2 [&_svg]:size-4.5`
);

const toolbarSeparatorVariants = cva(
  'bg-line self-stretch',
  {
    variants: {
      orientation: {
        horizontal: 'w-px mx-0.5 self-stretch',
        vertical: 'h-px mx-1',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
);

const toolbarLinkVariants = cva(
  `inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   cursor-pointer select-none no-underline
   bg-transparent text-flip
   transition-[background-color,color] duration-150 ease-out
   hover:bg-inv hover:text-accent
   focus-visible:outline-none
   h-7 px-2 text-xs gap-2 [&_svg]:size-4.5`
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
  const rootClasses = toolbarRootVariants({
    orientation,
    disabled,
    className,
  });

  return (
    <ToolbarOrientationContext.Provider value={orientation}>
      <BaseToolbar.Root
        orientation={orientation}
        disabled={disabled}
        className={rootClasses}
        data-rdna="toolbar"
        data-slot="toolbar"
        data-orientation={orientation}
      >
        {children}
      </BaseToolbar.Root>
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
      data-slot="toolbar-button"
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
  return (
    <BaseToolbar.Group
      disabled={disabled}
      className={`inline-flex items-center gap-0.5 ${className}`.trim()}
      data-slot="toolbar-group"
    >
      {children}
    </BaseToolbar.Group>
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

export default Toolbar;
