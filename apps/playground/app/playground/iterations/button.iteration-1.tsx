'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap select-none',
    'rounded-md border-b-2',
    'transition-all duration-200 ease-out',
    'disabled:opacity-50 disabled:pointer-events-none',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-action-primary text-content-inverted',
          'border-b-action-primary-hover',
          'hover:bg-action-primary-hover hover:border-b-transparent',
          'active:border-b-transparent',
        ],
        secondary: [
          'bg-surface-secondary text-content-primary',
          'border-b-edge-secondary',
          'hover:bg-surface-tertiary hover:border-b-action-primary',
          'active:border-b-action-primary',
        ],
        outline: [
          'bg-transparent text-content-primary',
          'border border-edge-primary border-b-2 border-b-edge-primary',
          'hover:border-b-action-primary hover:text-action-primary',
          'active:border-b-action-primary',
        ],
        ghost: [
          'bg-transparent text-content-secondary',
          'border-b-transparent',
          'hover:text-content-primary hover:border-b-action-primary hover:bg-surface-secondary',
          'active:border-b-action-primary',
        ],
        destructive: [
          'bg-status-error text-content-inverted',
          'border-b-status-error-emphasis',
          'hover:bg-status-error-emphasis hover:border-b-transparent',
          'active:border-b-transparent',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'primary', active: true, className: 'bg-action-primary-hover border-b-transparent' },
      { variant: 'secondary', active: true, className: 'bg-surface-tertiary border-b-action-primary' },
      { variant: 'outline', active: true, className: 'border-b-action-primary text-action-primary' },
      { variant: 'ghost', active: true, className: 'text-content-primary border-b-action-primary bg-surface-secondary' },
      { variant: 'destructive', active: true, className: 'bg-status-error-emphasis border-b-transparent' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      active: false,
    },
  }
)

type CVAProps = VariantProps<typeof buttonVariants>;

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: CVAProps['variant']
  size?: CVAProps['size']
  fullWidth?: CVAProps['fullWidth']
  active?: CVAProps['active']
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export function Button({
  variant,
  size,
  fullWidth,
  active,
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, active, className })}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
