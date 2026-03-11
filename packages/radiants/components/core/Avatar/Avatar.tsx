'use client';

import React from 'react';
import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// CVA Variants
// ============================================================================

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden border border-edge-primary',
  {
    variants: {
      size: {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
        xl: 'h-14 w-14 text-lg',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-xs',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  }
);

// ============================================================================
// Types
// ============================================================================

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text (e.g. initials) shown when image is unavailable */
  fallback?: string;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Avatar component for displaying user images with text fallback
 */
export function Avatar({
  src,
  alt = '',
  fallback = '',
  size = 'md',
  shape = 'circle',
  className = '',
}: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={avatarVariants({ size, shape, className })}
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
    >
      {src && (
        <BaseAvatar.Image
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      )}
      <BaseAvatar.Fallback
        className="flex h-full w-full items-center justify-center bg-surface-tertiary text-content-primary font-mono uppercase leading-none"
      >
        {fallback}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

export default Avatar;
