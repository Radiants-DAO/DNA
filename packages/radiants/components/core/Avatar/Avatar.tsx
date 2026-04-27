'use client';

import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cva } from 'class-variance-authority';
import type { AvatarShape, AvatarSize } from './Avatar.meta';


// ============================================================================
// Type re-exports (canonical in ./Avatar.meta)
// ============================================================================

export type { AvatarShape, AvatarSize };

// ============================================================================
// CVA Variants
// ============================================================================

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden',
  {
    variants: {
      size: {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
        xl: 'h-14 w-14 text-lg',
      } satisfies Record<AvatarSize, string>,
      shape: {
        circle: 'rounded-full border border-line',
        square: '',
      } satisfies Record<AvatarShape, string>,
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

interface AvatarProps {
  /** Size preset */
  size?: AvatarSize;
  /** Border-radius shape */
  shape?: AvatarShape;
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
  const root = (
    <BaseAvatar.Root
      className={avatarVariants({
        size,
        shape,
        className: shape === 'square' ? '' : className,
      })}
      data-rdna="avatar"
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
        className="flex h-full w-full items-center justify-center bg-tinted text-main font-mono uppercase leading-none"
      >
        {fallback}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );

  if (shape === 'square') {
    return (
      <div className={`pixel-rounded-4 inline-block ${className}`.trim()}>
        {root}
      </div>
    );
  }

  return root;
}
