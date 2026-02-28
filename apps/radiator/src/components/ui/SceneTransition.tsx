'use client';

/**
 * Wraps scene content with a fade/scale-in animation on mount.
 * Uses RDNA animation classes — max 300ms, ease-out only.
 */
export function SceneTransition({
  children,
  variant = 'fade',
}: {
  children: React.ReactNode;
  variant?: 'fade' | 'scale';
}) {
  return (
    <div className={variant === 'scale' ? 'animate-scaleIn' : 'animate-fadeIn'}>
      {children}
    </div>
  );
}
