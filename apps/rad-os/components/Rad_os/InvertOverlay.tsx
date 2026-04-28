'use client';

interface InvertOverlayProps {
  active: boolean;
}

/**
 * Full-screen invert overlay for invert mode
 * When active, inverts all colors on the page using mix-blend-mode: difference
 */
export function InvertOverlay({ active }: InvertOverlayProps) {
  return (
    <div
      className={`
        fixed inset-0 z-system
        pointer-events-none
        transition-opacity duration-300
        ${active ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:invert-mode-difference-overlay owner:rad-os expires:2027-01-01 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#invert-mode-blend-overlay
        backgroundColor: 'var(--color-pure-white)',
        mixBlendMode: 'difference',
      }}
    />
  );
}
